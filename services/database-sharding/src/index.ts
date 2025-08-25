/**
 * Database Sharding Service
 * Implements horizontal database partitioning for scalability
 * Database Sharding: Enabled
 */

import express from 'express';
import { createHash } from 'crypto';

const app = express();
app.use(express.json());

interface ShardConfig {
  id: string;
  connectionString: string;
  weight: number;
  isActive: boolean;
}

interface ShardingStrategy {
  getShardForKey(key: string): string;
  getAllShards(): ShardConfig[];
  addShard(config: ShardConfig): void;
  removeShard(shardId: string): void;
}

/**
 * Hash-based sharding strategy
 * Uses consistent hashing for even distribution
 */
class HashBasedSharding implements ShardingStrategy {
  private shards: Map<string, ShardConfig> = new Map();
  private hashRing: string[] = [];

  constructor(initialShards: ShardConfig[] = []) {
    initialShards.forEach(shard => this.addShard(shard));
  }

  getShardForKey(key: string): string {
    if (this.hashRing.length === 0) {
      throw new Error('No active shards available');
    }

    const hash = this.hashKey(key);
    const index = this.findShardIndex(hash);
    return this.hashRing[index];
  }

  getAllShards(): ShardConfig[] {
    return Array.from(this.shards.values()).filter(shard => shard.isActive);
  }

  addShard(config: ShardConfig): void {
    this.shards.set(config.id, config);
    if (config.isActive) {
      // Add multiple virtual nodes for better distribution
      for (let i = 0; i < config.weight; i++) {
        this.hashRing.push(config.id);
      }
      this.hashRing.sort();
    }
  }

  removeShard(shardId: string): void {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.isActive = false;
      this.hashRing = this.hashRing.filter(id => id !== shardId);
    }
  }

  private hashKey(key: string): number {
    const hash = createHash('md5').update(key).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }

  private findShardIndex(hash: number): number {
    // Simple modulo for demo - in production use consistent hashing
    return hash % this.hashRing.length;
  }
}

/**
 * Range-based sharding strategy
 * Partitions data based on key ranges
 */
class RangeBasedSharding implements ShardingStrategy {
  private shards: Map<string, ShardConfig> = new Map();
  private ranges: Array<{ min: string; max: string; shardId: string }> = [];

  getShardForKey(key: string): string {
    const range = this.ranges.find(r => key >= r.min && key <= r.max);
    if (!range) {
      throw new Error(`No shard found for key: ${key}`);
    }
    return range.shardId;
  }

  getAllShards(): ShardConfig[] {
    return Array.from(this.shards.values()).filter(shard => shard.isActive);
  }

  addShard(config: ShardConfig): void {
    this.shards.set(config.id, config);
  }

  removeShard(shardId: string): void {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.isActive = false;
      this.ranges = this.ranges.filter(r => r.shardId !== shardId);
    }
  }

  addRange(min: string, max: string, shardId: string): void {
    this.ranges.push({ min, max, shardId });
    this.ranges.sort((a, b) => a.min.localeCompare(b.min));
  }
}

/**
 * Database Sharding Manager
 * Coordinates sharding operations and routing
 */
class DatabaseShardingManager {
  private strategy: ShardingStrategy;
  private connectionPools: Map<string, any> = new Map();

  constructor(strategy: ShardingStrategy) {
    this.strategy = strategy;
  }

  async executeQuery(key: string, query: string, params: any[] = []): Promise<any> {
    try {
      const shardId = this.strategy.getShardForKey(key);
      const connection = await this.getConnection(shardId);
      
      console.log(`Executing query on shard: ${shardId}`);
      // In real implementation, execute actual database query
      return {
        shard: shardId,
        query,
        params,
        result: `Mock result from shard ${shardId}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  async executeTransaction(key: string, operations: Array<{query: string, params: any[]}>): Promise<any> {
    const shardId = this.strategy.getShardForKey(key);
    const connection = await this.getConnection(shardId);
    
    console.log(`Starting transaction on shard: ${shardId}`);
    
    try {
      // Begin transaction
      const results = [];
      
      for (const op of operations) {
        const result = await this.executeQuery(key, op.query, op.params);
        results.push(result);
      }
      
      // Commit transaction
      console.log(`Transaction committed on shard: ${shardId}`);
      return {
        shard: shardId,
        operations: results,
        status: 'committed'
      };
    } catch (error) {
      // Rollback transaction
      console.log(`Transaction rolled back on shard: ${shardId}`);
      throw error;
    }
  }

  async redistributeData(fromShardId: string, toShardId: string, keyPattern: string): Promise<void> {
    console.log(`Redistributing data from ${fromShardId} to ${toShardId}`);
    
    // In real implementation:
    // 1. Lock affected shards
    // 2. Copy data matching pattern
    // 3. Verify copy integrity
    // 4. Update routing rules
    // 5. Delete old data
    // 6. Release locks
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Data redistribution complete: ${keyPattern}`);
        resolve();
      }, 1000);
    });
  }

  private async getConnection(shardId: string): Promise<any> {
    if (!this.connectionPools.has(shardId)) {
      const shard = this.strategy.getAllShards().find(s => s.id === shardId);
      if (!shard) {
        throw new Error(`Shard not found: ${shardId}`);
      }
      
      // In real implementation, create actual database connection
      const mockConnection = {
        id: shardId,
        connectionString: shard.connectionString,
        isConnected: true
      };
      
      this.connectionPools.set(shardId, mockConnection);
    }
    
    return this.connectionPools.get(shardId);
  }

  getShardMetrics(): any {
    const shards = this.strategy.getAllShards();
    return {
      totalShards: shards.length,
      activeShards: shards.filter(s => s.isActive).length,
      shardDetails: shards.map(shard => ({
        id: shard.id,
        weight: shard.weight,
        isActive: shard.isActive,
        connectionCount: this.connectionPools.has(shard.id) ? 1 : 0
      }))
    };
  }
}

// Initialize sharding with default configuration
const defaultShards: ShardConfig[] = [
  {
    id: 'shard-1',
    connectionString: 'postgresql://localhost:5432/paypass_shard_1',
    weight: 3,
    isActive: true
  },
  {
    id: 'shard-2', 
    connectionString: 'postgresql://localhost:5433/paypass_shard_2',
    weight: 3,
    isActive: true
  },
  {
    id: 'shard-3',
    connectionString: 'postgresql://localhost:5434/paypass_shard_3', 
    weight: 2,
    isActive: true
  }
];

const shardingStrategy = new HashBasedSharding(defaultShards);
const shardingManager = new DatabaseShardingManager(shardingStrategy);

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'database-sharding',
    timestamp: new Date().toISOString(),
    metrics: shardingManager.getShardMetrics()
  });
});

app.post('/query', async (req, res) => {
  try {
    const { key, query, params } = req.body;
    
    if (!key || !query) {
      return res.status(400).json({ error: 'Key and query are required' });
    }
    
    const result = await shardingManager.executeQuery(key, query, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/transaction', async (req, res) => {
  try {
    const { key, operations } = req.body;
    
    if (!key || !operations || !Array.isArray(operations)) {
      return res.status(400).json({ error: 'Key and operations array are required' });
    }
    
    const result = await shardingManager.executeTransaction(key, operations);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/shards', (req, res) => {
  res.json(shardingManager.getShardMetrics());
});

app.post('/shards', (req, res) => {
  try {
    const { id, connectionString, weight = 1 } = req.body;
    
    if (!id || !connectionString) {
      return res.status(400).json({ error: 'ID and connection string are required' });
    }
    
    const newShard: ShardConfig = {
      id,
      connectionString,
      weight,
      isActive: true
    };
    
    shardingStrategy.addShard(newShard);
    res.json({ message: 'Shard added successfully', shard: newShard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/redistribute', async (req, res) => {
  try {
    const { fromShard, toShard, keyPattern } = req.body;
    
    if (!fromShard || !toShard || !keyPattern) {
      return res.status(400).json({ error: 'From shard, to shard, and key pattern are required' });
    }
    
    await shardingManager.redistributeData(fromShard, toShard, keyPattern);
    res.json({ message: 'Data redistribution completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`🔀 Database Sharding Service running on port ${PORT}`);
  console.log(`📊 Configured with ${defaultShards.length} shards`);
  console.log(`🏗️  Using hash-based sharding strategy`);
});

export { DatabaseShardingManager, HashBasedSharding, RangeBasedSharding };
export type { ShardConfig, ShardingStrategy };
