import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import { Pool, PoolClient } from 'pg';

// Database Router Service
// Provides database sharding, read replicas, and connection pooling

const app = express();
const PORT = process.env.PORT || 3008;

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'database-router.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database configuration
interface DatabaseShard {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  pool: Pool;
  isHealthy: boolean;
  shardKey: string;
  replicas: DatabaseReplica[];
  metrics: {
    activeConnections: number;
    totalQueries: number;
    avgResponseTime: number;
    errorCount: number;
  };
}

interface DatabaseReplica {
  id: string;
  host: string;
  port: number;
  database: string;
  pool: Pool;
  isHealthy: boolean;
  lag: number; // Replication lag in ms
}

// Initialize database shards
const shards: Map<string, DatabaseShard> = new Map();
const connectionPools: Map<string, Pool> = new Map();

async function initializeShards() {
  const shardConfigs = [
    {
      id: 'shard_users',
      name: 'Users Shard',
      host: process.env.DB_USERS_HOST || 'postgres-users',
      port: parseInt(process.env.DB_USERS_PORT || '5432'),
      database: process.env.DB_USERS_NAME || 'paypass_users',
      shardKey: 'user_id',
      replicas: [
        {
          id: 'users_replica_1',
          host: process.env.DB_USERS_REPLICA_HOST || 'postgres-users-replica',
          port: parseInt(process.env.DB_USERS_REPLICA_PORT || '5432'),
          database: process.env.DB_USERS_NAME || 'paypass_users'
        }
      ]
    },
    {
      id: 'shard_payments',
      name: 'Payments Shard',
      host: process.env.DB_PAYMENTS_HOST || 'postgres-payments',
      port: parseInt(process.env.DB_PAYMENTS_PORT || '5432'),
      database: process.env.DB_PAYMENTS_NAME || 'paypass_payments',
      shardKey: 'payment_id',
      replicas: [
        {
          id: 'payments_replica_1',
          host: process.env.DB_PAYMENTS_REPLICA_HOST || 'postgres-payments-replica',
          port: parseInt(process.env.DB_PAYMENTS_REPLICA_PORT || '5432'),
          database: process.env.DB_PAYMENTS_NAME || 'paypass_payments'
        }
      ]
    },
    {
      id: 'shard_analytics',
      name: 'Analytics Shard',
      host: process.env.DB_ANALYTICS_HOST || 'postgres-analytics',
      port: parseInt(process.env.DB_ANALYTICS_PORT || '5432'),
      database: process.env.DB_ANALYTICS_NAME || 'paypass_analytics',
      shardKey: 'analytics_id',
      replicas: []
    }
  ];

  for (const config of shardConfigs) {
    try {
      // Create primary pool
      const primaryPool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: process.env.DB_USER || 'paypass',
        password: process.env.DB_PASSWORD || 'secure_password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Initialize replica pools
      const replicas: DatabaseReplica[] = [];
      for (const replicaConfig of config.replicas) {
        const replicaPool = new Pool({
          host: replicaConfig.host,
          port: replicaConfig.port,
          database: replicaConfig.database,
          user: process.env.DB_USER || 'paypass',
          password: process.env.DB_PASSWORD || 'secure_password',
          max: 15,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        replicas.push({
          ...replicaConfig,
          pool: replicaPool,
          isHealthy: false,
          lag: 0
        });
      }

      const shard: DatabaseShard = {
        id: config.id,
        name: config.name,
        host: config.host,
        port: config.port,
        database: config.database,
        pool: primaryPool,
        isHealthy: false,
        shardKey: config.shardKey,
        replicas,
        metrics: {
          activeConnections: 0,
          totalQueries: 0,
          avgResponseTime: 0,
          errorCount: 0
        }
      };

      // Test primary connection
      await primaryPool.query('SELECT 1');
      shard.isHealthy = true;
      logger.info(`Database shard initialized: ${config.name}`);

      // Test replica connections
      for (const replica of replicas) {
        try {
          await replica.pool.query('SELECT 1');
          replica.isHealthy = true;
          logger.info(`Database replica initialized: ${replica.id}`);
        } catch (error) {
          logger.error(`Failed to initialize replica: ${replica.id}`, error);
        }
      }

      shards.set(config.id, shard);

    } catch (error) {
      logger.error(`Failed to initialize shard: ${config.name}`, error);
    }
  }
}

// Sharding strategy
function getShardForKey(key: string, operation: 'read' | 'write' = 'write'): DatabaseShard | null {
  // Simple hash-based sharding
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const absHash = Math.abs(hash);
  
  // Route based on key pattern and hash
  if (key.startsWith('user_') || key.includes('user')) {
    return shards.get('shard_users') || null;
  } else if (key.startsWith('payment_') || key.includes('payment')) {
    return shards.get('shard_payments') || null;
  } else if (key.startsWith('analytics_') || key.includes('analytics')) {
    return shards.get('shard_analytics') || null;
  }

  // Fallback to hash-based distribution
  const shardIds = Array.from(shards.keys());
  const shardIndex = absHash % shardIds.length;
  return shards.get(shardIds[shardIndex]) || null;
}

// Connection pooling and load balancing
function getConnectionPool(shard: DatabaseShard, operation: 'read' | 'write' = 'write'): Pool {
  // For write operations, always use primary
  if (operation === 'write') {
    return shard.pool;
  }

  // For read operations, use replicas if available and healthy
  const healthyReplicas = shard.replicas.filter(r => r.isHealthy);
  
  if (healthyReplicas.length > 0) {
    // Round-robin selection among healthy replicas
    const replicaIndex = shard.metrics.totalQueries % healthyReplicas.length;
    return healthyReplicas[replicaIndex].pool;
  }

  // Fallback to primary if no healthy replicas
  return shard.pool;
}

// Circuit breaker pattern
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
    }
  }

  getState() {
    return this.state;
  }
}

const circuitBreakers: Map<string, CircuitBreaker> = new Map();

// POST /query - Execute database query
app.post('/query', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query, params = [], shardKey, operation = 'read', timeout = 30000 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Determine target shard
    const targetShard = shardKey ? getShardForKey(shardKey, operation) : Array.from(shards.values())[0];
    
    if (!targetShard) {
      return res.status(503).json({ error: 'No available database shard' });
    }

    if (!targetShard.isHealthy) {
      return res.status(503).json({ error: 'Target shard is unhealthy' });
    }

    // Get appropriate connection pool
    const pool = getConnectionPool(targetShard, operation);
    
    // Get or create circuit breaker for this shard
    let circuitBreaker = circuitBreakers.get(targetShard.id);
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker();
      circuitBreakers.set(targetShard.id, circuitBreaker);
    }

    // Execute query with circuit breaker
    const result = await circuitBreaker.execute(async () => {
      const client = await pool.connect();
      try {
        // Set query timeout
        await client.query('SET statement_timeout = $1', [timeout]);
        
        const queryResult = await client.query(query, params);
        return queryResult;
      } finally {
        client.release();
      }
    });

    // Update metrics
    const responseTime = Date.now() - startTime;
    targetShard.metrics.totalQueries++;
    targetShard.metrics.avgResponseTime = 
      (targetShard.metrics.avgResponseTime * (targetShard.metrics.totalQueries - 1) + responseTime) / 
      targetShard.metrics.totalQueries;

    res.json({
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        command: result.command,
        shard: targetShard.id,
        responseTime,
        circuitBreakerState: circuitBreaker.getState()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database query error', { error: error.message, query: req.body.query });
    
    // Update error metrics
    if (req.body.shardKey) {
      const shard = getShardForKey(req.body.shardKey);
      if (shard) {
        shard.metrics.errorCount++;
      }
    }

    res.status(500).json({
      success: false,
      error: 'Database query failed',
      message: error.message,
      responseTime
    });
  }
});

// POST /transaction - Execute database transaction
app.post('/transaction', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { queries, shardKey, timeout = 30000 } = req.body;
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'Queries array is required' });
    }

    const targetShard = shardKey ? getShardForKey(shardKey, 'write') : Array.from(shards.values())[0];
    
    if (!targetShard || !targetShard.isHealthy) {
      return res.status(503).json({ error: 'No healthy database shard available' });
    }

    const pool = targetShard.pool; // Transactions always use primary
    
    let circuitBreaker = circuitBreakers.get(targetShard.id);
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker();
      circuitBreakers.set(targetShard.id, circuitBreaker);
    }

    const results = await circuitBreaker.execute(async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('SET statement_timeout = $1', [timeout]);
        
        const results = [];
        for (const { query, params = [] } of queries) {
          const result = await client.query(query, params);
          results.push({
            rows: result.rows,
            rowCount: result.rowCount,
            command: result.command
          });
        }
        
        await client.query('COMMIT');
        return results;
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    const responseTime = Date.now() - startTime;
    targetShard.metrics.totalQueries += queries.length;

    res.json({
      success: true,
      data: {
        results,
        shard: targetShard.id,
        responseTime,
        queriesExecuted: queries.length
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error('Database transaction error', { error: error.message });

    res.status(500).json({
      success: false,
      error: 'Database transaction failed',
      message: error.message,
      responseTime
    });
  }
});

// GET /health - Health check
app.get('/health', async (req, res) => {
  try {
    const shardHealth = {};
    let overallHealthy = true;

    for (const [shardId, shard] of shards.entries()) {
      try {
        await shard.pool.query('SELECT 1');
        shard.isHealthy = true;
        
        const replicaHealth = {};
        for (const replica of shard.replicas) {
          try {
            await replica.pool.query('SELECT 1');
            replica.isHealthy = true;
            replicaHealth[replica.id] = 'healthy';
          } catch (error) {
            replica.isHealthy = false;
            replicaHealth[replica.id] = 'unhealthy';
          }
        }
        
        shardHealth[shardId] = {
          status: 'healthy',
          name: shard.name,
          replicas: replicaHealth,
          circuitBreaker: circuitBreakers.get(shardId)?.getState() || 'closed'
        };
        
      } catch (error) {
        shard.isHealthy = false;
        overallHealthy = false;
        shardHealth[shardId] = {
          status: 'unhealthy',
          name: shard.name,
          error: error.message
        };
      }
    }

    res.status(overallHealthy ? 200 : 503).json({
      status: overallHealthy ? 'healthy' : 'degraded',
      service: 'database-router',
      timestamp: new Date().toISOString(),
      shards: shardHealth,
      totalShards: shards.size,
      healthyShards: Array.from(shards.values()).filter(s => s.isHealthy).length
    });

  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'database-router',
      error: error.message
    });
  }
});

// GET /metrics - Database metrics
app.get('/metrics', async (req, res) => {
  try {
    const metrics = {};
    
    for (const [shardId, shard] of shards.entries()) {
      metrics[shardId] = {
        ...shard.metrics,
        name: shard.name,
        isHealthy: shard.isHealthy,
        replicas: shard.replicas.map(r => ({
          id: r.id,
          isHealthy: r.isHealthy,
          lag: r.lag
        })),
        circuitBreakerState: circuitBreakers.get(shardId)?.getState() || 'closed'
      };
    }

    res.json({
      success: true,
      data: {
        shards: metrics,
        summary: {
          totalShards: shards.size,
          totalQueries: Array.from(shards.values()).reduce((sum, s) => sum + s.metrics.totalQueries, 0),
          totalErrors: Array.from(shards.values()).reduce((sum, s) => sum + s.metrics.errorCount, 0),
          avgResponseTime: Array.from(shards.values()).reduce((sum, s) => sum + s.metrics.avgResponseTime, 0) / shards.size
        }
      }
    });

  } catch (error) {
    logger.error('Metrics error', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Error handling
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Health monitoring
setInterval(async () => {
  for (const shard of shards.values()) {
    try {
      await shard.pool.query('SELECT 1');
      shard.isHealthy = true;
    } catch (error) {
      shard.isHealthy = false;
      logger.error(`Shard health check failed: ${shard.name}`, error);
    }
  }
}, 30000);

// Start server
async function startServer() {
  try {
    await initializeShards();
    
    app.listen(PORT, () => {
      logger.info(`Database router service running on port ${PORT}`);
      logger.info(`Initialized ${shards.size} database shards`);
    });
  } catch (error) {
    logger.error('Failed to start database router service', error);
    process.exit(1);
  }
}

startServer();
