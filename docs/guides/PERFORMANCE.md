# Performance Standards & Optimization 🚀

## Table of Contents
- [Performance Philosophy](#performance-philosophy)
- [Performance Targets](#performance-targets)
- [Frontend Performance](#frontend-performance)
- [Backend Performance](#backend-performance)
- [Database Performance](#database-performance)
- [Payment Processing Performance](#payment-processing-performance)
- [Monitoring & Observability](#monitoring--observability)
- [Performance Testing](#performance-testing)
- [Optimization Strategies](#optimization-strategies)

## Performance Philosophy

### Core Principles
1. **User-Centric Performance** - Optimize for user experience first
2. **Progressive Enhancement** - Start fast, enhance progressively
3. **Measure Everything** - Data-driven performance optimization
4. **Performance Budget** - Set and enforce performance limits
5. **Continuous Monitoring** - Real-time performance tracking
6. **Mobile-First** - Optimize for mobile devices and networks

### Performance Culture
- **Performance is a Feature** - Treat performance as a key requirement
- **Shift-Left Performance** - Consider performance from design phase
- **Performance Champions** - Team members advocate for performance
- **Regular Audits** - Weekly performance reviews and optimizations

## Performance Targets

### Frontend Performance Standards
```typescript
interface FrontendPerformanceTargets {
  // Core Web Vitals
  largestContentfulPaint: number;    // < 2.5s
  firstInputDelay: number;           // < 100ms
  cumulativeLayoutShift: number;     // < 0.1
  
  // Loading Performance
  firstContentfulPaint: number;      // < 1.8s
  timeToInteractive: number;         // < 3.5s
  totalBlockingTime: number;         // < 200ms
  
  // Resource Performance
  bundleSize: {
    initial: number;                 // < 200KB gzipped
    route: number;                   // < 100KB gzipped per route
  };
  
  // Network Performance
  requestCount: number;              // < 50 requests for initial load
  imageOptimization: number;         // < 500KB total images
}

const PERFORMANCE_TARGETS: FrontendPerformanceTargets = {
  largestContentfulPaint: 2500,
  firstInputDelay: 100,
  cumulativeLayoutShift: 0.1,
  firstContentfulPaint: 1800,
  timeToInteractive: 3500,
  totalBlockingTime: 200,
  bundleSize: {
    initial: 200 * 1024, // 200KB
    route: 100 * 1024,   // 100KB
  },
  requestCount: 50,
  imageOptimization: 500 * 1024, // 500KB
};
```

### Backend Performance Standards
```typescript
interface BackendPerformanceTargets {
  // API Response Times
  authEndpoints: number;             // < 500ms
  paymentEndpoints: number;          // < 1000ms
  dataQueries: number;               // < 200ms
  healthChecks: number;              // < 50ms
  
  // Throughput
  requestsPerSecond: number;         // > 1000 RPS
  concurrentUsers: number;           // > 10,000 users
  
  // Database Performance
  queryResponseTime: number;         // < 100ms (95th percentile)
  connectionPoolSize: number;        // Optimized based on load
  
  // Memory and CPU
  memoryUsage: number;               // < 80% of allocated
  cpuUsage: number;                  // < 70% average
}

const BACKEND_TARGETS: BackendPerformanceTargets = {
  authEndpoints: 500,
  paymentEndpoints: 1000,
  dataQueries: 200,
  healthChecks: 50,
  requestsPerSecond: 1000,
  concurrentUsers: 10000,
  queryResponseTime: 100,
  connectionPoolSize: 20,
  memoryUsage: 80,
  cpuUsage: 70,
};
```

### Payment Processing Standards
```typescript
interface PaymentPerformanceTargets {
  // Transaction Processing
  paymentProcessing: number;         // < 3s end-to-end
  fraudAnalysis: number;             // < 500ms
  crossBorderPayments: number;       // < 5s end-to-end
  
  // Success Rates
  paymentSuccessRate: number;        // > 99.5%
  uptime: number;                    // > 99.9%
  
  // Scalability
  transactionsPerSecond: number;     // > 500 TPS
  peakLoadHandling: number;          // 5x normal load
}

const PAYMENT_TARGETS: PaymentPerformanceTargets = {
  paymentProcessing: 3000,
  fraudAnalysis: 500,
  crossBorderPayments: 5000,
  paymentSuccessRate: 99.5,
  uptime: 99.9,
  transactionsPerSecond: 500,
  peakLoadHandling: 5,
};
```

## Frontend Performance

### React Performance Optimization
```typescript
// Lazy loading and code splitting
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy components
const PaymentDashboard = lazy(() => import('@/components/dashboard/payment-dashboard'));
const AnalyticsChart = lazy(() => import('@/components/analytics/analytics-chart'));

// Route-based code splitting
const Dashboard = lazy(() => 
  import('@/pages/dashboard').then(module => ({ default: module.Dashboard }))
);

// Component with proper memoization
const PaymentList = memo<PaymentListProps>(({ 
  payments, 
  onPaymentClick, 
  filters 
}) => {
  // Memoize expensive computations
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      if (filters.status && payment.status !== filters.status) return false;
      if (filters.dateRange && !isWithinDateRange(payment.createdAt, filters.dateRange)) return false;
      return true;
    });
  }, [payments, filters]);

  // Memoize callback functions
  const handlePaymentClick = useCallback((paymentId: string) => {
    onPaymentClick(paymentId);
  }, [onPaymentClick]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="payment-list">
        {filteredPayments.map(payment => (
          <PaymentItem
            key={payment.id}
            payment={payment}
            onClick={handlePaymentClick}
          />
        ))}
      </div>
    </Suspense>
  );
});

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedTransactionList: React.FC<{ transactions: Transaction[] }> = ({ 
  transactions 
}) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TransactionItem transaction={transactions[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={transactions.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### Image Optimization
```typescript
// Next.js Image component with optimization
import Image from 'next/image';

const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}> = ({ src, alt, width, height, priority = false }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      style={{
        objectFit: 'cover',
      }}
    />
  );
};

// Progressive image loading
const ProgressiveImage: React.FC<{
  lowResSrc: string;
  highResSrc: string;
  alt: string;
}> = ({ lowResSrc, highResSrc, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(lowResSrc);

  useEffect(() => {
    const img = new window.Image();
    img.src = highResSrc;
    img.onload = () => {
      setCurrentSrc(highResSrc);
      setIsLoaded(true);
    };
  }, [highResSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`progressive-image ${isLoaded ? 'loaded' : 'loading'}`}
      style={{
        filter: isLoaded ? 'none' : 'blur(5px)',
        transition: 'filter 0.3s ease',
      }}
    />
  );
};
```

### Bundle Optimization
```typescript
// webpack.config.js (if using custom webpack)
const config = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
  
  // Tree shaking configuration
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                modules: false, // Enable tree shaking
                useBuiltIns: 'usage',
                corejs: 3,
              }],
            ],
          },
        },
      },
    ],
  },
};

// Dynamic imports for heavy libraries
const loadChartLibrary = async () => {
  const { Chart } = await import('chart.js');
  return Chart;
};

// Service worker for caching
// public/sw.js
const CACHE_NAME = 'paypass-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/styles/globals.css',
  '/scripts/app.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
```

### Client-Side Caching
```typescript
// React Query configuration for optimized caching
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests
      retry: (failureCount, error) => {
        if (error.status === 404) return false;
        return failureCount < 3;
      },
      // Background refetch
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

// Optimistic updates for payments
const usePaymentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    
    // Optimistic update
    onMutate: async (newPayment) => {
      await queryClient.cancelQueries({ queryKey: ['payments'] });
      
      const previousPayments = queryClient.getQueryData(['payments']);
      
      queryClient.setQueryData(['payments'], (old: Payment[]) => [
        ...old,
        { ...newPayment, id: 'temp', status: 'pending' },
      ]);
      
      return { previousPayments };
    },
    
    // Rollback on error
    onError: (err, newPayment, context) => {
      queryClient.setQueryData(['payments'], context.previousPayments);
    },
    
    // Refetch on success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

// Local storage caching
class LocalStorageCache {
  private prefix = 'paypass_';
  private ttl = 60 * 60 * 1000; // 1 hour

  set<T>(key: string, value: T, customTTL?: number): void {
    const item = {
      value,
      expiry: Date.now() + (customTTL || this.ttl),
    };
    localStorage.setItem(this.prefix + key, JSON.stringify(item));
  }

  get<T>(key: string): T | null {
    const itemStr = localStorage.getItem(this.prefix + key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(this.prefix + key);
      return null;
    }

    return item.value;
  }

  clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => localStorage.removeItem(key));
  }
}
```

## Backend Performance

### API Optimization
```typescript
// Response caching middleware
import { Redis } from 'ioredis';

class CacheMiddleware {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  cache(duration: number = 300) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateCacheKey(req);
      
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
        
        // Store original json method
        const originalJson = res.json;
        
        // Override json method to cache response
        res.json = function(data: any) {
          // Cache the response
          this.redis.setex(key, duration, JSON.stringify(data));
          
          // Call original json method
          return originalJson.call(this, data);
        }.bind({ redis: this.redis });
        
        next();
      } catch (error) {
        console.error('Cache error:', error);
        next();
      }
    };
  }

  private generateCacheKey(req: Request): string {
    const { method, url, query } = req;
    return `cache:${method}:${url}:${JSON.stringify(query)}`;
  }
}

// Rate limiting with Redis
class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  limit(options: {
    windowMs: number;
    max: number;
    keyGenerator?: (req: Request) => string;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = options.keyGenerator ? 
        options.keyGenerator(req) : 
        `ratelimit:${req.ip}`;

      const current = await this.redis.incr(key);
      
      if (current === 1) {
        await this.redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      if (current > options.max) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: options.windowMs / 1000,
        });
      }

      res.setHeader('X-RateLimit-Limit', options.max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - current));
      
      next();
    };
  }
}

// Connection pooling for database
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Connection pool settings
  min: 5,                    // Minimum connections
  max: 20,                   // Maximum connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout after 2s
  
  // Performance settings
  statement_timeout: 5000,   // 5s statement timeout
  query_timeout: 5000,       // 5s query timeout
  application_name: 'paypass',
});

// Optimized database queries
class OptimizedPaymentRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // Use prepared statements for repeated queries
  async findUserPayments(userId: string, limit: number = 20, offset: number = 0) {
    const query = `
      SELECT 
        p.id,
        p.amount,
        p.currency,
        p.status,
        p.description,
        p.created_at,
        u.display_name as recipient_name
      FROM payments p
      JOIN users u ON p.recipient_id = u.id
      WHERE p.sender_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  // Batch operations for better performance
  async createMultiplePayments(payments: PaymentData[]): Promise<Payment[]> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results: Payment[] = [];
      
      for (const payment of payments) {
        const query = `
          INSERT INTO payments (sender_id, recipient_id, amount, currency, description)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        
        const result = await client.query(query, [
          payment.senderId,
          payment.recipientId,
          payment.amount,
          payment.currency,
          payment.description,
        ]);
        
        results.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

### Microservice Communication Optimization
```typescript
// HTTP client with connection pooling
import axios from 'axios';
import { Agent } from 'https';

const httpClient = axios.create({
  timeout: 5000,
  httpsAgent: new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
  }),
});

// Circuit breaker for service resilience
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitoringPeriod: number = 120000
  ) {}

  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
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

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime &&
      Date.now() - this.lastFailureTime.getTime() >= this.timeout;
  }
}

// Service discovery and load balancing
class ServiceDiscovery {
  private services = new Map<string, ServiceInstance[]>();

  registerService(name: string, instance: ServiceInstance): void {
    if (!this.services.has(name)) {
      this.services.set(name, []);
    }
    this.services.get(name)!.push(instance);
  }

  getService(name: string): ServiceInstance | null {
    const instances = this.services.get(name);
    if (!instances || instances.length === 0) {
      return null;
    }

    // Round-robin load balancing
    const healthyInstances = instances.filter(i => i.healthy);
    if (healthyInstances.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[index];
  }

  async healthCheck(): Promise<void> {
    for (const [serviceName, instances] of this.services) {
      for (const instance of instances) {
        try {
          const response = await axios.get(`${instance.url}/health`, {
            timeout: 2000,
          });
          instance.healthy = response.status === 200;
        } catch (error) {
          instance.healthy = false;
        }
      }
    }
  }
}
```

## Database Performance

### Query Optimization
```sql
-- Indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_payments_sender_created 
ON payments (sender_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_payments_recipient_status 
ON payments (recipient_id, status) 
WHERE status IN ('pending', 'completed');

CREATE INDEX CONCURRENTLY idx_payments_amount_currency 
ON payments (amount, currency) 
WHERE amount > 1000;

-- Partial indexes for specific conditions
CREATE INDEX CONCURRENTLY idx_payments_high_value 
ON payments (created_at, amount) 
WHERE amount > 10000;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_users_active_type 
ON users (user_type, is_active, created_at) 
WHERE is_active = true;

-- Function-based indexes
CREATE INDEX CONCURRENTLY idx_users_phone_normalized 
ON users (LOWER(REPLACE(phone_number, '+', '')));
```

```typescript
// Database query optimization strategies
class OptimizedQueries {
  // Use EXPLAIN ANALYZE to optimize queries
  async analyzeQuery(query: string, params: any[]): Promise<QueryAnalysis> {
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
    const result = await this.pool.query(explainQuery, params);
    
    const plan = result.rows[0]['QUERY PLAN'][0];
    
    return {
      executionTime: plan['Execution Time'],
      planningTime: plan['Planning Time'],
      totalCost: plan.Plan['Total Cost'],
      actualRows: plan.Plan['Actual Rows'],
      estimatedRows: plan.Plan['Plan Rows'],
      bufferHits: plan['Buffer Usage']['Shared Hit Blocks'],
      bufferReads: plan['Buffer Usage']['Shared Read Blocks'],
    };
  }

  // Optimized pagination with cursor-based approach
  async getPaginatedPayments(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<PaginatedResult<Payment>> {
    let query = `
      SELECT p.*, u.display_name as recipient_name
      FROM payments p
      JOIN users u ON p.recipient_id = u.id
      WHERE p.sender_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (cursor) {
      query += ` AND p.created_at < $2`;
      params.push(new Date(cursor));
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1); // Fetch one extra to check if there's a next page
    
    const result = await this.pool.query(query, params);
    const payments = result.rows;
    
    const hasMore = payments.length > limit;
    if (hasMore) {
      payments.pop(); // Remove the extra row
    }
    
    const nextCursor = hasMore && payments.length > 0 ? 
      payments[payments.length - 1].created_at : null;
    
    return {
      data: payments,
      hasMore,
      nextCursor,
    };
  }

  // Batch operations to reduce round trips
  async batchUpdateBalances(updates: BalanceUpdate[]): Promise<void> {
    const query = `
      UPDATE users 
      SET balance = balance + updates.amount
      FROM (VALUES ${updates.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}) 
      AS updates(user_id, amount)
      WHERE users.id = updates.user_id::uuid
    `;
    
    const params = updates.flatMap(update => [update.userId, update.amount]);
    await this.pool.query(query, params);
  }

  // Use materialized views for complex aggregations
  async refreshAnalyticsMaterializedView(): Promise<void> {
    await this.pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY payment_analytics_daily');
  }
}

-- Materialized view for analytics
CREATE MATERIALIZED VIEW payment_analytics_daily AS
SELECT 
  DATE(created_at) as date,
  currency,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  COUNT(DISTINCT sender_id) as unique_senders,
  COUNT(DISTINCT recipient_id) as unique_recipients
FROM payments 
WHERE status = 'completed'
GROUP BY DATE(created_at), currency
ORDER BY date DESC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_payment_analytics_daily_unique 
ON payment_analytics_daily (date, currency);
```

### Connection Management
```typescript
// Optimized connection pool configuration
import { Pool, PoolConfig } from 'pg';

class DatabaseManager {
  private pools: Map<string, Pool> = new Map();

  createPool(name: string, config: PoolConfig): Pool {
    const optimizedConfig: PoolConfig = {
      ...config,
      
      // Connection limits
      min: 5,
      max: 20,
      
      // Timeouts
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      
      // Statement timeout
      statement_timeout: 10000,
      query_timeout: 10000,
      
      // Performance settings
      application_name: 'paypass-api',
      
      // Connection validation
      allowExitOnIdle: true,
    };

    const pool = new Pool(optimizedConfig);
    
    // Monitor pool health
    pool.on('connect', (client) => {
      console.log('Database client connected');
    });
    
    pool.on('error', (err, client) => {
      console.error('Database pool error:', err);
    });
    
    this.pools.set(name, pool);
    return pool;
  }

  async withTransaction<T>(
    poolName: string,
    operation: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Monitor pool metrics
  getPoolMetrics(poolName: string): PoolMetrics {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool ${poolName} not found`);
    }

    return {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
  }
}
```

## Payment Processing Performance

### Asynchronous Payment Processing
```typescript
// Queue-based payment processing
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';

interface PaymentJobData {
  paymentId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

class PaymentProcessor {
  private paymentQueue: Queue;
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    
    this.paymentQueue = new Queue('payment-processing', {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    });

    this.setupWorkers();
  }

  async processPayment(paymentData: PaymentJobData): Promise<void> {
    // Add to queue for async processing
    await this.paymentQueue.add('process-payment', paymentData, {
      priority: this.calculatePriority(paymentData),
      delay: 0,
    });
  }

  private setupWorkers(): void {
    // Payment processing worker
    const paymentWorker = new Worker(
      'payment-processing',
      async (job: Job<PaymentJobData>) => {
        const { data } = job;
        
        try {
          // Step 1: Fraud analysis (parallel)
          const fraudAnalysisPromise = this.analyzeFraud(data);
          
          // Step 2: Validate users (parallel)
          const userValidationPromise = this.validateUsers(data.senderId, data.recipientId);
          
          // Wait for parallel operations
          const [fraudAnalysis, userValidation] = await Promise.all([
            fraudAnalysisPromise,
            userValidationPromise,
          ]);

          if (!fraudAnalysis.approved) {
            throw new Error(`Payment blocked: ${fraudAnalysis.reason}`);
          }

          if (!userValidation.valid) {
            throw new Error(`Invalid users: ${userValidation.reason}`);
          }

          // Step 3: Process payment
          await this.executePayment(data);
          
          // Step 4: Send notifications (async, don't wait)
          this.sendNotifications(data).catch(console.error);
          
        } catch (error) {
          console.error('Payment processing failed:', error);
          
          // Update payment status to failed
          await this.updatePaymentStatus(data.paymentId, 'failed', error.message);
          
          throw error; // Re-throw for retry mechanism
        }
      },
      {
        connection: this.redis,
        concurrency: 10, // Process 10 payments concurrently
      }
    );

    paymentWorker.on('completed', (job) => {
      console.log(`Payment ${job.data.paymentId} processed successfully`);
    });

    paymentWorker.on('failed', (job, err) => {
      console.error(`Payment ${job?.data?.paymentId} failed:`, err);
    });
  }

  private calculatePriority(paymentData: PaymentJobData): number {
    // High-value payments get higher priority
    if (paymentData.amount > 10000) return 100;
    if (paymentData.amount > 1000) return 50;
    return 10;
  }

  private async analyzeFraud(data: PaymentJobData): Promise<FraudAnalysis> {
    // Parallel fraud checks
    const [velocityCheck, amountCheck, locationCheck] = await Promise.all([
      this.fraudService.checkVelocity(data.senderId),
      this.fraudService.checkAmount(data.amount, data.senderId),
      this.fraudService.checkLocation(data.senderId),
    ]);

    const riskScore = velocityCheck.risk + amountCheck.risk + locationCheck.risk;
    
    return {
      approved: riskScore < 70,
      riskScore,
      reason: riskScore >= 70 ? 'High fraud risk detected' : undefined,
    };
  }
}

// Optimized cross-border payment processing
class CrossBorderPaymentProcessor {
  async processCrossBorderPayment(data: CrossBorderPaymentData): Promise<void> {
    // Step 1: Parallel operations
    const [exchangeRate, complianceCheck, kycValidation] = await Promise.all([
      this.getExchangeRate(data.fromCurrency, data.toCurrency),
      this.performComplianceCheck(data),
      this.validateKYC(data.senderId, data.recipientId),
    ]);

    // Step 2: Calculate fees and final amounts
    const conversionResult = this.calculateConversion(
      data.amount,
      exchangeRate.rate,
      exchangeRate.fees
    );

    // Step 3: Execute cross-border transfer
    await this.executeCrossBorderTransfer({
      ...data,
      exchangeRate: exchangeRate.rate,
      fees: conversionResult.fees,
      convertedAmount: conversionResult.convertedAmount,
    });
  }

  private async getExchangeRate(
    fromCurrency: string,
    toCurrency: string
  ): Promise<ExchangeRateResult> {
    // Try cache first
    const cacheKey = `exchange_rate:${fromCurrency}:${toCurrency}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from multiple providers for best rate
    const ratePromises = [
      this.provider1.getRate(fromCurrency, toCurrency),
      this.provider2.getRate(fromCurrency, toCurrency),
      this.provider3.getRate(fromCurrency, toCurrency),
    ];

    const rates = await Promise.allSettled(ratePromises);
    const validRates = rates
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<ExchangeRate>).value);

    if (validRates.length === 0) {
      throw new Error('No exchange rate providers available');
    }

    // Select best rate (lowest cost for customer)
    const bestRate = validRates.reduce((best, current) => 
      current.totalCost < best.totalCost ? current : best
    );

    // Cache for 30 seconds
    await this.redis.setex(cacheKey, 30, JSON.stringify(bestRate));

    return bestRate;
  }
}
```

### Real-time Transaction Processing
```typescript
// WebSocket-based real-time updates
import { WebSocketServer, WebSocket } from 'ws';

class RealTimeTransactionService {
  private wss: WebSocketServer;
  private userConnections = new Map<string, WebSocket[]>();

  constructor() {
    this.wss = new WebSocketServer({ port: 8080 });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws, req) => {
      const userId = this.extractUserIdFromRequest(req);
      
      if (!userId) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Add connection to user's connection list
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, []);
      }
      this.userConnections.get(userId)!.push(ws);

      ws.on('close', () => {
        this.removeConnection(userId, ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeConnection(userId, ws);
      });

      // Send initial data
      this.sendInitialData(ws, userId);
    });
  }

  async notifyPaymentUpdate(
    paymentId: string,
    status: PaymentStatus,
    details: PaymentDetails
  ): Promise<void> {
    const payment = await this.paymentService.getPayment(paymentId);
    
    // Notify both sender and recipient
    const usersToNotify = [payment.senderId, payment.recipientId];
    
    for (const userId of usersToNotify) {
      const connections = this.userConnections.get(userId) || [];
      
      const message = {
        type: 'payment_update',
        paymentId,
        status,
        details,
        timestamp: new Date().toISOString(),
      };

      // Send to all user's connections (multiple devices)
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }

    // Also update dashboard metrics
    this.updateDashboardMetrics(payment);
  }

  private async sendInitialData(ws: WebSocket, userId: string): Promise<void> {
    const [balance, recentTransactions, notifications] = await Promise.all([
      this.userService.getBalance(userId),
      this.transactionService.getRecentTransactions(userId, 10),
      this.notificationService.getUnreadNotifications(userId),
    ]);

    const initialData = {
      type: 'initial_data',
      balance,
      recentTransactions,
      notifications,
    };

    ws.send(JSON.stringify(initialData));
  }

  private removeConnection(userId: string, ws: WebSocket): void {
    const connections = this.userConnections.get(userId);
    if (connections) {
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      if (connections.length === 0) {
        this.userConnections.delete(userId);
      }
    }
  }
}
```

## Monitoring & Observability

### Performance Monitoring
```typescript
// Application performance monitoring
import { createPrometheusMetrics } from 'prom-client';

class PerformanceMonitor {
  private metrics: PrometheusMetrics;

  constructor() {
    this.metrics = createPrometheusMetrics();
    this.setupMetrics();
  }

  private setupMetrics(): void {
    // HTTP request duration
    this.httpRequestDuration = new this.metrics.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });

    // Payment processing metrics
    this.paymentProcessingDuration = new this.metrics.Histogram({
      name: 'payment_processing_duration_seconds',
      help: 'Duration of payment processing in seconds',
      labelNames: ['payment_type', 'currency'],
      buckets: [0.5, 1, 2, 3, 5, 10],
    });

    // Database query metrics
    this.databaseQueryDuration = new this.metrics.Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1],
    });

    // Error rate metrics
    this.errorRate = new this.metrics.Counter({
      name: 'errors_total',
      help: 'Total number of errors',
      labelNames: ['service', 'error_type'],
    });

    // Active connections
    this.activeConnections = new this.metrics.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['connection_type'],
    });
  }

  measureHttpRequest(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      
      this.httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
        .observe(duration);
    });
    
    next();
  }

  async measurePaymentProcessing<T>(
    paymentType: string,
    currency: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const end = this.paymentProcessingDuration
      .labels(paymentType, currency)
      .startTimer();

    try {
      const result = await operation();
      end();
      return result;
    } catch (error) {
      end();
      this.errorRate.labels('payment_service', error.constructor.name).inc();
      throw error;
    }
  }

  recordDatabaseQuery(
    queryType: string,
    table: string,
    duration: number
  ): void {
    this.databaseQueryDuration
      .labels(queryType, table)
      .observe(duration / 1000);
  }

  updateActiveConnections(type: string, count: number): void {
    this.activeConnections.labels(type).set(count);
  }
}

// Health check endpoints
class HealthCheckService {
  async getSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalServices(),
      this.checkDiskSpace(),
      this.checkMemoryUsage(),
    ]);

    const results = checks.map((check, index) => ({
      name: ['database', 'redis', 'external_services', 'disk_space', 'memory'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      details: check.status === 'fulfilled' ? check.value : check.reason.message,
    }));

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'unhealthy';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  private async checkDatabase(): Promise<DatabaseHealth> {
    const start = Date.now();
    await this.db.query('SELECT 1');
    const responseTime = Date.now() - start;

    const poolMetrics = this.dbPool.getMetrics();

    return {
      responseTime,
      connectionPool: {
        total: poolMetrics.totalCount,
        idle: poolMetrics.idleCount,
        waiting: poolMetrics.waitingCount,
      },
    };
  }

  private async checkRedis(): Promise<RedisHealth> {
    const start = Date.now();
    await this.redis.ping();
    const responseTime = Date.now() - start;

    const info = await this.redis.info('memory');
    const memoryUsage = this.parseRedisMemoryInfo(info);

    return {
      responseTime,
      memoryUsage,
    };
  }
}
```

### Performance Alerting
```typescript
// Alert system for performance issues
class PerformanceAlerting {
  private thresholds: PerformanceThresholds;
  private alertHistory = new Map<string, AlertRecord[]>();

  constructor(thresholds: PerformanceThresholds) {
    this.thresholds = thresholds;
    this.startMonitoring();
  }

  private startMonitoring(): void {
    // Check performance metrics every minute
    setInterval(() => {
      this.checkPerformanceMetrics();
    }, 60000);
  }

  private async checkPerformanceMetrics(): Promise<void> {
    const metrics = await this.gatherMetrics();

    // Check API response times
    if (metrics.avgApiResponseTime > this.thresholds.apiResponseTime) {
      await this.sendAlert('api_slow_response', {
        current: metrics.avgApiResponseTime,
        threshold: this.thresholds.apiResponseTime,
        severity: 'warning',
      });
    }

    // Check payment processing times
    if (metrics.avgPaymentProcessingTime > this.thresholds.paymentProcessingTime) {
      await this.sendAlert('payment_slow_processing', {
        current: metrics.avgPaymentProcessingTime,
        threshold: this.thresholds.paymentProcessingTime,
        severity: 'critical',
      });
    }

    // Check error rates
    if (metrics.errorRate > this.thresholds.errorRate) {
      await this.sendAlert('high_error_rate', {
        current: metrics.errorRate,
        threshold: this.thresholds.errorRate,
        severity: 'critical',
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      await this.sendAlert('high_memory_usage', {
        current: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage,
        severity: 'warning',
      });
    }
  }

  private async sendAlert(type: string, details: AlertDetails): Promise<void> {
    // Check if we've sent this alert recently (avoid spam)
    if (this.shouldSuppressAlert(type)) {
      return;
    }

    const alert: Alert = {
      type,
      severity: details.severity,
      message: this.generateAlertMessage(type, details),
      timestamp: new Date(),
      details,
    };

    // Send to multiple channels
    await Promise.all([
      this.sendSlackAlert(alert),
      this.sendEmailAlert(alert),
      this.logAlert(alert),
    ]);

    // Record alert in history
    this.recordAlert(type, alert);
  }

  private shouldSuppressAlert(type: string): boolean {
    const history = this.alertHistory.get(type) || [];
    const recentAlerts = history.filter(
      alert => Date.now() - alert.timestamp.getTime() < 300000 // 5 minutes
    );

    return recentAlerts.length >= 3; // Max 3 alerts per 5 minutes
  }

  private generateAlertMessage(type: string, details: AlertDetails): string {
    switch (type) {
      case 'api_slow_response':
        return `API response time is ${details.current}ms (threshold: ${details.threshold}ms)`;
      case 'payment_slow_processing':
        return `Payment processing time is ${details.current}ms (threshold: ${details.threshold}ms)`;
      case 'high_error_rate':
        return `Error rate is ${details.current}% (threshold: ${details.threshold}%)`;
      case 'high_memory_usage':
        return `Memory usage is ${details.current}% (threshold: ${details.threshold}%)`;
      default:
        return `Performance alert: ${type}`;
    }
  }
}
```

---

This comprehensive performance guide ensures that the PayPass platform maintains high performance standards across all layers of the application, from frontend user experience to backend processing and database operations. Regular monitoring and optimization based on these guidelines will ensure the platform can scale effectively while maintaining excellent user experience.