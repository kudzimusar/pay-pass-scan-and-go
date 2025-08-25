import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';
import Redis from 'ioredis';

// Distributed Cache Service
// Provides centralized caching with Redis clustering, sharding, and high availability

const app = express();
const PORT = process.env.PORT || 3007;

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
    new winston.transports.File({ filename: 'cache-service.log' })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 100, // requests
  duration: 60, // per 60 seconds
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    logger.warn('Rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json({ error: 'Too many requests' });
  }
});

// Redis Cluster Configuration
interface RedisNode {
  host: string;
  port: number;
  password?: string;
}

interface CacheCluster {
  id: string;
  name: string;
  nodes: RedisNode[];
  client: Redis.Cluster;
  isHealthy: boolean;
  lastHealthCheck: Date;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  totalKeys: number;
  memoryUsage: number;
}

// Cache clusters configuration
const cacheConfigs = {
  primary: {
    id: 'primary',
    name: 'Primary Cache Cluster',
    nodes: [
      { host: process.env.REDIS_PRIMARY_1 || 'redis-primary-1', port: 6379 },
      { host: process.env.REDIS_PRIMARY_2 || 'redis-primary-2', port: 6379 },
      { host: process.env.REDIS_PRIMARY_3 || 'redis-primary-3', port: 6379 }
    ]
  },
  session: {
    id: 'session',
    name: 'Session Cache Cluster', 
    nodes: [
      { host: process.env.REDIS_SESSION_1 || 'redis-session-1', port: 6379 },
      { host: process.env.REDIS_SESSION_2 || 'redis-session-2', port: 6379 }
    ]
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics Cache Cluster',
    nodes: [
      { host: process.env.REDIS_ANALYTICS_1 || 'redis-analytics-1', port: 6379 }
    ]
  }
};

// Initialize cache clusters
const clusters: Map<string, CacheCluster> = new Map();
const stats: Map<string, CacheStats> = new Map();

async function initializeClusters() {
  for (const [clusterId, config] of Object.entries(cacheConfigs)) {
    try {
      const client = new Redis.Cluster(config.nodes, {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3
        },
        enableOfflineQueue: false,
        retryDelayOnClusterDown: 300,
        slotsRefreshTimeout: 10000,
        maxRetriesPerRequest: 3
      });

      const cluster: CacheCluster = {
        id: clusterId,
        name: config.name,
        nodes: config.nodes,
        client,
        isHealthy: false,
        lastHealthCheck: new Date()
      };

      // Test connection
      await client.ping();
      cluster.isHealthy = true;
      logger.info(`Cache cluster initialized: ${config.name}`);

      clusters.set(clusterId, cluster);
      stats.set(clusterId, {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalKeys: 0,
        memoryUsage: 0
      });

      // Setup event listeners
      client.on('error', (error) => {
        logger.error(`Cache cluster error: ${config.name}`, error);
        cluster.isHealthy = false;
        const clusterStats = stats.get(clusterId);
        if (clusterStats) {
          clusterStats.errors++;
        }
      });

      client.on('connect', () => {
        logger.info(`Cache cluster connected: ${config.name}`);
        cluster.isHealthy = true;
      });

    } catch (error) {
      logger.error(`Failed to initialize cache cluster: ${config.name}`, error);
    }
  }
}

// Cache key sharding strategy
function getShardKey(key: string): string {
  // Simple hash-based sharding
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Determine cluster based on hash
  const absHash = Math.abs(hash);
  if (absHash % 3 === 0) return 'primary';
  if (absHash % 3 === 1) return 'session';
  return 'analytics';
}

// Retry wrapper for cache operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

// GET /:cluster/:key - Get cached value
app.get('/:cluster/:key', async (req, res) => {
  try {
    const { cluster: clusterId, key } = req.params;
    const cluster = clusters.get(clusterId);
    
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    if (!cluster.isHealthy) {
      return res.status(503).json({ error: 'Cluster unavailable' });
    }

    const value = await withRetry(async () => {
      return await cluster.client.get(key);
    });

    const clusterStats = stats.get(clusterId)!;
    
    if (value !== null) {
      clusterStats.hits++;
      res.json({
        success: true,
        data: {
          key,
          value: JSON.parse(value),
          cluster: clusterId,
          hit: true
        }
      });
    } else {
      clusterStats.misses++;
      res.status(404).json({
        success: false,
        error: 'Key not found',
        data: { key, cluster: clusterId, hit: false }
      });
    }

  } catch (error) {
    logger.error('Cache get error', { error, key: req.params.key });
    res.status(500).json({ error: 'Cache operation failed' });
  }
});

// POST /:cluster/:key - Set cached value
app.post('/:cluster/:key', async (req, res) => {
  try {
    const { cluster: clusterId, key } = req.params;
    const { value, ttl = 3600 } = req.body; // Default 1 hour TTL
    
    const cluster = clusters.get(clusterId);
    
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    if (!cluster.isHealthy) {
      return res.status(503).json({ error: 'Cluster unavailable' });
    }

    await withRetry(async () => {
      if (ttl > 0) {
        await cluster.client.setex(key, ttl, JSON.stringify(value));
      } else {
        await cluster.client.set(key, JSON.stringify(value));
      }
    });

    const clusterStats = stats.get(clusterId)!;
    clusterStats.sets++;

    res.json({
      success: true,
      data: {
        key,
        cluster: clusterId,
        ttl,
        set: true
      }
    });

  } catch (error) {
    logger.error('Cache set error', { error, key: req.params.key });
    res.status(500).json({ error: 'Cache operation failed' });
  }
});

// DELETE /:cluster/:key - Delete cached value
app.delete('/:cluster/:key', async (req, res) => {
  try {
    const { cluster: clusterId, key } = req.params;
    const cluster = clusters.get(clusterId);
    
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    if (!cluster.isHealthy) {
      return res.status(503).json({ error: 'Cluster unavailable' });
    }

    const deleted = await withRetry(async () => {
      return await cluster.client.del(key);
    });

    const clusterStats = stats.get(clusterId)!;
    clusterStats.deletes++;

    res.json({
      success: true,
      data: {
        key,
        cluster: clusterId,
        deleted: deleted > 0
      }
    });

  } catch (error) {
    logger.error('Cache delete error', { error, key: req.params.key });
    res.status(500).json({ error: 'Cache operation failed' });
  }
});

// POST /batch - Batch operations
app.post('/batch', async (req, res) => {
  try {
    const { operations } = req.body;
    
    if (!Array.isArray(operations)) {
      return res.status(400).json({ error: 'Operations must be an array' });
    }

    const results = [];
    
    for (const op of operations) {
      try {
        const { action, cluster: clusterId, key, value, ttl } = op;
        const cluster = clusters.get(clusterId);
        
        if (!cluster || !cluster.isHealthy) {
          results.push({
            action,
            key,
            cluster: clusterId,
            success: false,
            error: 'Cluster unavailable'
          });
          continue;
        }

        let result;
        
        switch (action) {
          case 'get':
            const getValue = await cluster.client.get(key);
            result = {
              action,
              key,
              cluster: clusterId,
              success: true,
              value: getValue ? JSON.parse(getValue) : null,
              hit: getValue !== null
            };
            break;
            
          case 'set':
            if (ttl > 0) {
              await cluster.client.setex(key, ttl, JSON.stringify(value));
            } else {
              await cluster.client.set(key, JSON.stringify(value));
            }
            result = {
              action,
              key,
              cluster: clusterId,
              success: true,
              set: true
            };
            break;
            
          case 'delete':
            const deleteCount = await cluster.client.del(key);
            result = {
              action,
              key,
              cluster: clusterId,
              success: true,
              deleted: deleteCount > 0
            };
            break;
            
          default:
            result = {
              action,
              key,
              cluster: clusterId,
              success: false,
              error: 'Invalid action'
            };
        }
        
        results.push(result);
        
      } catch (error) {
        results.push({
          action: op.action,
          key: op.key,
          cluster: op.cluster,
          success: false,
          error: 'Operation failed'
        });
      }
    }

    res.json({
      success: true,
      data: {
        total: operations.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      }
    });

  } catch (error) {
    logger.error('Batch operation error', error);
    res.status(500).json({ error: 'Batch operation failed' });
  }
});

// GET /stats - Get cache statistics
app.get('/stats', async (req, res) => {
  try {
    const clusterStats = {};
    
    for (const [clusterId, cluster] of clusters.entries()) {
      const stats_data = stats.get(clusterId)!;
      
      try {
        // Get Redis INFO
        const info = await cluster.client.info('memory');
        const keyspace = await cluster.client.info('keyspace');
        
        // Parse memory usage
        const memoryMatch = info.match(/used_memory:(\d+)/);
        const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;
        
        // Parse key count
        const keyMatch = keyspace.match(/keys=(\d+)/);
        const totalKeys = keyMatch ? parseInt(keyMatch[1]) : 0;
        
        stats_data.memoryUsage = memoryUsage;
        stats_data.totalKeys = totalKeys;
        
        clusterStats[clusterId] = {
          ...stats_data,
          cluster: cluster.name,
          isHealthy: cluster.isHealthy,
          lastHealthCheck: cluster.lastHealthCheck,
          hitRate: stats_data.hits + stats_data.misses > 0 ? 
            (stats_data.hits / (stats_data.hits + stats_data.misses) * 100).toFixed(2) : '0.00',
          memoryUsageMB: (memoryUsage / 1024 / 1024).toFixed(2),
          nodes: cluster.nodes.length
        };
        
      } catch (error) {
        clusterStats[clusterId] = {
          ...stats_data,
          cluster: cluster.name,
          isHealthy: false,
          error: 'Failed to get cluster info'
        };
      }
    }

    res.json({
      success: true,
      data: {
        clusters: clusterStats,
        summary: {
          totalClusters: clusters.size,
          healthyClusters: Array.from(clusters.values()).filter(c => c.isHealthy).length,
          totalHits: Array.from(stats.values()).reduce((sum, s) => sum + s.hits, 0),
          totalMisses: Array.from(stats.values()).reduce((sum, s) => sum + s.misses, 0),
          totalSets: Array.from(stats.values()).reduce((sum, s) => sum + s.sets, 0),
          totalErrors: Array.from(stats.values()).reduce((sum, s) => sum + s.errors, 0)
        }
      }
    });

  } catch (error) {
    logger.error('Stats error', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// GET /health - Health check
app.get('/health', async (req, res) => {
  try {
    const clusterHealth = {};
    let overallHealthy = true;
    
    for (const [clusterId, cluster] of clusters.entries()) {
      try {
        await cluster.client.ping();
        cluster.isHealthy = true;
        cluster.lastHealthCheck = new Date();
        clusterHealth[clusterId] = { status: 'healthy', name: cluster.name };
      } catch (error) {
        cluster.isHealthy = false;
        overallHealthy = false;
        clusterHealth[clusterId] = { status: 'unhealthy', name: cluster.name, error: error.message };
      }
    }

    const status = overallHealthy ? 'healthy' : 'degraded';
    
    res.status(overallHealthy ? 200 : 503).json({
      status,
      service: 'cache-service',
      timestamp: new Date().toISOString(),
      clusters: clusterHealth,
      version: '2.1.0'
    });

  } catch (error) {
    logger.error('Health check error', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'cache-service',
      error: error.message
    });
  }
});

// POST /flush/:cluster - Flush cluster
app.post('/flush/:cluster', async (req, res) => {
  try {
    const { cluster: clusterId } = req.params;
    const cluster = clusters.get(clusterId);
    
    if (!cluster) {
      return res.status(404).json({ error: 'Cluster not found' });
    }

    if (!cluster.isHealthy) {
      return res.status(503).json({ error: 'Cluster unavailable' });
    }

    await cluster.client.flushall();
    
    // Reset stats
    const clusterStats = stats.get(clusterId)!;
    Object.assign(clusterStats, {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalKeys: 0,
      memoryUsage: 0
    });

    logger.info(`Cache cluster flushed: ${cluster.name}`);

    res.json({
      success: true,
      data: {
        cluster: clusterId,
        flushed: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Cache flush error', { error, cluster: req.params.cluster });
    res.status(500).json({ error: 'Cache flush failed' });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack, path: req.path });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Health check monitoring
setInterval(async () => {
  for (const [clusterId, cluster] of clusters.entries()) {
    try {
      await cluster.client.ping();
      if (!cluster.isHealthy) {
        cluster.isHealthy = true;
        logger.info(`Cache cluster recovered: ${cluster.name}`);
      }
      cluster.lastHealthCheck = new Date();
    } catch (error) {
      if (cluster.isHealthy) {
        cluster.isHealthy = false;
        logger.error(`Cache cluster failed: ${cluster.name}`, error);
      }
    }
  }
}, 30000); // Check every 30 seconds

// Initialize and start server
async function startServer() {
  try {
    await initializeClusters();
    
    app.listen(PORT, () => {
      logger.info(`Cache service running on port ${PORT}`);
      logger.info(`Initialized ${clusters.size} cache clusters`);
    });
  } catch (error) {
    logger.error('Failed to start cache service', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down cache service...');
  
  for (const cluster of clusters.values()) {
    try {
      await cluster.client.disconnect();
    } catch (error) {
      logger.error('Error closing cache cluster', error);
    }
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Shutting down cache service...');
  
  for (const cluster of clusters.values()) {
    try {
      await cluster.client.disconnect();
    } catch (error) {
      logger.error('Error closing cache cluster', error);
    }
  }
  
  process.exit(0);
});

startServer();

export default app;
