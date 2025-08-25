import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { createClient } from 'redis';
import winston from 'winston';
import jwt from 'jsonwebtoken';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'api-gateway.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3000;

// Redis client for rate limiting and caching
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect();

// Service discovery registry
interface ServiceEndpoint {
  name: string;
  url: string;
  version: string;
  health: string;
  weight: number;
  lastHealthCheck: Date;
}

const serviceRegistry: Map<string, ServiceEndpoint[]> = new Map();

// Register default services
serviceRegistry.set('user-service', [{
  name: 'user-service',
  url: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  version: '1.0.0',
  health: '/health',
  weight: 1,
  lastHealthCheck: new Date()
}]);

serviceRegistry.set('payment-service', [{
  name: 'payment-service',
  url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
  version: '1.0.0',
  health: '/health',
  weight: 1,
  lastHealthCheck: new Date()
}]);

serviceRegistry.set('wallet-service', [{
  name: 'wallet-service',
  url: process.env.WALLET_SERVICE_URL || 'http://localhost:3003',
  version: '1.0.0',
  health: '/health',
  weight: 1,
  lastHealthCheck: new Date()
}]);

serviceRegistry.set('compliance-service', [{
  name: 'compliance-service',
  url: process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3004',
  version: '1.0.0',
  health: '/health',
  weight: 1,
  lastHealthCheck: new Date()
}]);

serviceRegistry.set('ai-fraud-detection', [{
  name: 'ai-fraud-detection',
  url: process.env.AI_FRAUD_SERVICE_URL || 'http://localhost:3005',
  version: '1.0.0',
  health: '/health',
  weight: 1,
  lastHealthCheck: new Date()
}]);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting middleware
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new rateLimit.MemoryStore() // In production, use Redis store
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter(15 * 60 * 1000, 100, 'Too many requests'); // 100 requests per 15 minutes
const authLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Too many auth attempts'); // 20 requests per 15 minutes
const paymentLimiter = createRateLimiter(60 * 1000, 10, 'Too many payment requests'); // 10 payments per minute

// Slow down middleware for progressive delays
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per windowMs without delay
  delayMs: (used, req) => {
    const delayAfter = req.slowDown?.delayAfter || 50;
    return (used - delayAfter) * 100; // add 100ms delay for each request after delayAfter
  }
});

// Circuit breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000
  ) {}
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

const circuitBreakers: Map<string, CircuitBreaker> = new Map();

// Load balancer - round robin implementation
class LoadBalancer {
  private currentIndex = 0;
  
  getNextEndpoint(serviceName: string): ServiceEndpoint | null {
    const endpoints = serviceRegistry.get(serviceName);
    if (!endpoints || endpoints.length === 0) {
      return null;
    }
    
    // Filter healthy endpoints
    const healthyEndpoints = endpoints.filter(endpoint => 
      Date.now() - endpoint.lastHealthCheck.getTime() < 30000 // 30 seconds
    );
    
    if (healthyEndpoints.length === 0) {
      return endpoints[0]; // Fallback to first endpoint
    }
    
    const endpoint = healthyEndpoints[this.currentIndex % healthyEndpoints.length];
    this.currentIndex = (this.currentIndex + 1) % healthyEndpoints.length;
    
    return endpoint;
  }
}

const loadBalancer = new LoadBalancer();

// Authentication middleware
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Service discovery endpoints
app.post('/services/register', (req, res) => {
  const schema = z.object({
    name: z.string(),
    url: z.string().url(),
    version: z.string(),
    health: z.string(),
    weight: z.number().min(1).default(1)
  });
  
  const validation = schema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid service registration data' });
  }
  
  const { name, url, version, health, weight } = validation.data;
  
  const endpoint: ServiceEndpoint = {
    name,
    url,
    version,
    health,
    weight,
    lastHealthCheck: new Date()
  };
  
  const existingEndpoints = serviceRegistry.get(name) || [];
  existingEndpoints.push(endpoint);
  serviceRegistry.set(name, existingEndpoints);
  
  logger.info('Service registered', { name, url, version });
  
  res.status(201).json({
    success: true,
    message: 'Service registered successfully',
    endpoint
  });
});

app.get('/services', (req, res) => {
  const services = Array.from(serviceRegistry.entries()).map(([name, endpoints]) => ({
    name,
    endpoints: endpoints.length,
    lastHealthCheck: Math.max(...endpoints.map(e => e.lastHealthCheck.getTime()))
  }));
  
  res.json({ services });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthChecks = await Promise.allSettled(
    Array.from(serviceRegistry.entries()).map(async ([serviceName, endpoints]) => {
      const endpoint = endpoints[0];
      try {
        const response = await fetch(`${endpoint.url}${endpoint.health}`, {
          timeout: 5000
        });
        return {
          service: serviceName,
          status: response.ok ? 'healthy' : 'unhealthy',
          url: endpoint.url
        };
      } catch (error) {
        return {
          service: serviceName,
          status: 'unhealthy',
          url: endpoint.url,
          error: error.message
        };
      }
    })
  );
  
  const results = healthChecks.map(result => 
    result.status === 'fulfilled' ? result.value : { 
      service: 'unknown', 
      status: 'error', 
      error: result.reason 
    }
  );
  
  const allHealthy = results.every(result => result.status === 'healthy');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: results
  });
});

// API versioning
app.use('/api/v1', express.Router());

// Monitoring endpoint
app.get('/metrics', async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    circuitBreakers: Array.from(circuitBreakers.entries()).map(([service, cb]) => ({
      service,
      ...cb.getState()
    })),
    services: Array.from(serviceRegistry.entries()).map(([name, endpoints]) => ({
      name,
      endpoints: endpoints.length,
      healthy: endpoints.filter(e => 
        Date.now() - e.lastHealthCheck.getTime() < 30000
      ).length
    }))
  };
  
  res.json(metrics);
});

// Create proxy middleware for each service
const createServiceProxy = (serviceName: string, pathRewrite?: any): express.RequestHandler => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const endpoint = loadBalancer.getNextEndpoint(serviceName);
    
    if (!endpoint) {
      return res.status(503).json({
        error: `Service ${serviceName} is unavailable`
      });
    }
    
    let circuitBreaker = circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker();
      circuitBreakers.set(serviceName, circuitBreaker);
    }
    
    const proxyOptions: Options = {
      target: endpoint.url,
      changeOrigin: true,
      pathRewrite: pathRewrite || {},
      onError: (err, req, res) => {
        logger.error(`Proxy error for ${serviceName}`, { error: err.message });
        if (!res.headersSent) {
          res.status(503).json({
            error: `Service ${serviceName} error`,
            details: err.message
          });
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info(`Proxied request to ${serviceName}`, {
          method: req.method,
          url: req.url,
          status: proxyRes.statusCode
        });
      }
    };
    
    const proxy = createProxyMiddleware(proxyOptions);
    
    circuitBreaker.call(async () => {
      return new Promise((resolve, reject) => {
        proxy(req, res, (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    }).catch((error) => {
      if (!res.headersSent) {
        res.status(503).json({
          error: `Circuit breaker open for ${serviceName}`,
          details: error.message
        });
      }
    });
  };
};

// Apply rate limiting and authentication to different routes
app.use('/api/auth', authLimiter);
app.use('/api/payment', paymentLimiter, authenticateToken);
app.use('/api', generalLimiter, speedLimiter);

// Route configurations
app.use('/api/users', createServiceProxy('user-service', { '^/api/users': '' }));
app.use('/api/payments', createServiceProxy('payment-service', { '^/api/payments': '' }));
app.use('/api/wallets', createServiceProxy('wallet-service', { '^/api/wallets': '' }));
app.use('/api/compliance', createServiceProxy('compliance-service', { '^/api/compliance': '' }));
app.use('/api/fraud-detection', createServiceProxy('ai-fraud-detection', { '^/api/fraud-detection': '' }));

// API Documentation
try {
  const swaggerDocument = YAML.load('./docs/api/openapi.yaml');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('Could not load Swagger documentation', { error: error.message });
  
  // Fallback API documentation
  app.get('/api-docs', (req, res) => {
    res.json({
      info: {
        title: 'PayPass API Gateway',
        version: '1.0.0',
        description: 'Central API Gateway for PayPass microservices'
      },
      services: Array.from(serviceRegistry.keys()),
      endpoints: {
        '/api/users': 'User management service',
        '/api/payments': 'Payment processing service',
        '/api/wallets': 'Wallet management service',
        '/api/compliance': 'Compliance and KYC service',
        '/api/fraud-detection': 'AI fraud detection service'
      }
    });
  });
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error in API Gateway', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Internal gateway error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  redisClient.quit();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`);
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api-docs`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

export default app;
