import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import winston from 'winston';
import { createClient } from 'redis';
import cron from 'node-cron';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import _ from 'lodash';
import promClient from 'prom-client';
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
    new winston.transports.File({ filename: 'analytics-service.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3006;

// Redis client for caching
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.connect();

// Prometheus metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const transactionMetrics = new promClient.Gauge({
  name: 'paypass_transactions_total',
  help: 'Total number of transactions',
  labelNames: ['type', 'status', 'currency'],
  registers: [register]
});

const revenueMetrics = new promClient.Gauge({
  name: 'paypass_revenue_total',
  help: 'Total revenue generated',
  labelNames: ['currency', 'period'],
  registers: [register]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestsTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode.toString()
    });
  });
  
  next();
});

// Mock data for analytics (replace with actual database queries)
interface TransactionData {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'payment' | 'transfer' | 'exchange' | 'topup';
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  country?: string;
  merchant?: string;
}

interface UserData {
  id: string;
  country: string;
  registrationDate: Date;
  lastActiveDate: Date;
  kycStatus: 'pending' | 'approved' | 'rejected';
  tier: 'basic' | 'premium' | 'enterprise';
}

const mockTransactions: TransactionData[] = [];
const mockUsers: UserData[] = [];

// Generate mock data
const generateMockData = () => {
  const currencies = ['USD', 'EUR', 'GBP', 'ZWL', 'ZAR'];
  const countries = ['US', 'UK', 'ZW', 'ZA', 'KE'];
  const types: TransactionData['type'][] = ['payment', 'transfer', 'exchange', 'topup'];
  const statuses: TransactionData['status'][] = ['completed', 'pending', 'failed'];
  
  // Generate transactions for the last 30 days
  for (let i = 0; i < 1000; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const timestamp = subDays(new Date(), daysAgo);
    
    mockTransactions.push({
      id: `txn_${i}`,
      userId: `user_${Math.floor(Math.random() * 100)}`,
      amount: Math.random() * 1000,
      currency: currencies[Math.floor(Math.random() * currencies.length)],
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp,
      country: countries[Math.floor(Math.random() * countries.length)]
    });
  }
  
  // Generate users
  for (let i = 0; i < 100; i++) {
    const registrationDaysAgo = Math.floor(Math.random() * 365);
    const lastActiveDaysAgo = Math.floor(Math.random() * 7);
    
    mockUsers.push({
      id: `user_${i}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      registrationDate: subDays(new Date(), registrationDaysAgo),
      lastActiveDate: subDays(new Date(), lastActiveDaysAgo),
      kycStatus: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)] as UserData['kycStatus'],
      tier: ['basic', 'premium', 'enterprise'][Math.floor(Math.random() * 3)] as UserData['tier']
    });
  }
  
  logger.info('Generated mock data', {
    transactions: mockTransactions.length,
    users: mockUsers.length
  });
};

// Initialize mock data
generateMockData();

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional()
});

const analyticsQuerySchema = z.object({
  metrics: z.array(z.string()).optional(),
  groupBy: z.array(z.string()).optional(),
  filters: z.record(z.any()).optional()
}).merge(dateRangeSchema);

// Helper functions
const getDateRange = (period?: string, startDate?: string, endDate?: string) => {
  const end = endDate ? new Date(endDate) : new Date();
  let start: Date;
  
  switch (period) {
    case 'day':
      start = startOfDay(end);
      break;
    case 'week':
      start = subDays(end, 7);
      break;
    case 'month':
      start = subDays(end, 30);
      break;
    case 'year':
      start = subDays(end, 365);
      break;
    default:
      start = startDate ? new Date(startDate) : subDays(end, 30);
  }
  
  return { start, end };
};

const cacheKey = (prefix: string, params: any) => {
  return `${prefix}:${JSON.stringify(params)}`;
};

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Transaction Analytics
app.get('/analytics/transactions', async (req, res) => {
  try {
    const validation = analyticsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }
    
    const { period, startDate, endDate, groupBy = ['date'], filters = {} } = validation.data;
    const { start, end } = getDateRange(period, startDate, endDate);
    
    const cacheKeyStr = cacheKey('transactions', { start, end, groupBy, filters });
    const cached = await redisClient.get(cacheKeyStr);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Filter transactions
    let filteredTransactions = mockTransactions.filter(txn => 
      txn.timestamp >= start && txn.timestamp <= end
    );
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredTransactions = filteredTransactions.filter(txn => 
          txn[key as keyof TransactionData] === value
        );
      }
    });
    
    // Group and aggregate data
    const groupedData = _.groupBy(filteredTransactions, (txn) => {
      if (groupBy.includes('date')) {
        return format(txn.timestamp, 'yyyy-MM-dd');
      }
      if (groupBy.includes('currency')) {
        return txn.currency;
      }
      if (groupBy.includes('type')) {
        return txn.type;
      }
      return 'all';
    });
    
    const analytics = Object.entries(groupedData).map(([key, transactions]) => ({
      key,
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, txn) => sum + txn.amount, 0),
      averageAmount: transactions.reduce((sum, txn) => sum + txn.amount, 0) / transactions.length,
      successRate: transactions.filter(txn => txn.status === 'completed').length / transactions.length * 100,
      currencies: _.uniq(transactions.map(txn => txn.currency)),
      types: _.countBy(transactions, 'type'),
      statuses: _.countBy(transactions, 'status')
    }));
    
    const result = {
      success: true,
      period: { start, end },
      totalTransactions: filteredTransactions.length,
      analytics: analytics.sort((a, b) => a.key.localeCompare(b.key))
    };
    
    // Cache for 5 minutes
    await redisClient.setEx(cacheKeyStr, 300, JSON.stringify(result));
    
    logger.info('Transaction analytics generated', {
      period: { start, end },
      groupBy,
      totalRecords: analytics.length
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating transaction analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate transaction analytics'
    });
  }
});

// User Analytics
app.get('/analytics/users', async (req, res) => {
  try {
    const validation = analyticsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }
    
    const { period, startDate, endDate } = validation.data;
    const { start, end } = getDateRange(period, startDate, endDate);
    
    const cacheKeyStr = cacheKey('users', { start, end });
    const cached = await redisClient.get(cacheKeyStr);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const activeUsers = mockUsers.filter(user => 
      user.lastActiveDate >= start && user.lastActiveDate <= end
    );
    
    const newUsers = mockUsers.filter(user => 
      user.registrationDate >= start && user.registrationDate <= end
    );
    
    const analytics = {
      success: true,
      period: { start, end },
      totalUsers: mockUsers.length,
      activeUsers: activeUsers.length,
      newUsers: newUsers.length,
      usersByCountry: _.countBy(mockUsers, 'country'),
      usersByTier: _.countBy(mockUsers, 'tier'),
      kycStatusDistribution: _.countBy(mockUsers, 'kycStatus'),
      retentionRate: activeUsers.length / mockUsers.length * 100,
      growthRate: newUsers.length / mockUsers.length * 100
    };
    
    // Cache for 10 minutes
    await redisClient.setEx(cacheKeyStr, 600, JSON.stringify(analytics));
    
    logger.info('User analytics generated', {
      period: { start, end },
      activeUsers: activeUsers.length,
      newUsers: newUsers.length
    });
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error generating user analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate user analytics'
    });
  }
});

// Revenue Analytics
app.get('/analytics/revenue', async (req, res) => {
  try {
    const validation = analyticsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }
    
    const { period, startDate, endDate, groupBy = ['currency'] } = validation.data;
    const { start, end } = getDateRange(period, startDate, endDate);
    
    const cacheKeyStr = cacheKey('revenue', { start, end, groupBy });
    const cached = await redisClient.get(cacheKeyStr);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const completedTransactions = mockTransactions.filter(txn => 
      txn.timestamp >= start && 
      txn.timestamp <= end && 
      txn.status === 'completed'
    );
    
    // Calculate revenue (assuming 2% fee)
    const revenueTransactions = completedTransactions.map(txn => ({
      ...txn,
      revenue: txn.amount * 0.02
    }));
    
    const groupedRevenue = _.groupBy(revenueTransactions, (txn) => {
      if (groupBy.includes('currency')) {
        return txn.currency;
      }
      if (groupBy.includes('date')) {
        return format(txn.timestamp, 'yyyy-MM-dd');
      }
      return 'all';
    });
    
    const revenueAnalytics = Object.entries(groupedRevenue).map(([key, transactions]) => ({
      key,
      totalRevenue: transactions.reduce((sum, txn) => sum + txn.revenue, 0),
      transactionCount: transactions.length,
      averageRevenuePerTransaction: transactions.reduce((sum, txn) => sum + txn.revenue, 0) / transactions.length,
      totalVolume: transactions.reduce((sum, txn) => sum + txn.amount, 0)
    }));
    
    const totalRevenue = revenueTransactions.reduce((sum, txn) => sum + txn.revenue, 0);
    
    const result = {
      success: true,
      period: { start, end },
      totalRevenue,
      totalTransactions: completedTransactions.length,
      averageRevenuePerTransaction: totalRevenue / completedTransactions.length,
      analytics: revenueAnalytics.sort((a, b) => b.totalRevenue - a.totalRevenue)
    };
    
    // Update Prometheus metrics
    revenueAnalytics.forEach(item => {
      revenueMetrics.set(
        { currency: item.key, period: period || 'custom' },
        item.totalRevenue
      );
    });
    
    // Cache for 15 minutes
    await redisClient.setEx(cacheKeyStr, 900, JSON.stringify(result));
    
    logger.info('Revenue analytics generated', {
      period: { start, end },
      totalRevenue,
      groupBy
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error generating revenue analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue analytics'
    });
  }
});

// Fraud Analytics
app.get('/analytics/fraud', async (req, res) => {
  try {
    const validation = dateRangeSchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors
      });
    }
    
    const { period, startDate, endDate } = validation.data;
    const { start, end } = getDateRange(period, startDate, endDate);
    
    const cacheKeyStr = cacheKey('fraud', { start, end });
    const cached = await redisClient.get(cacheKeyStr);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const periodTransactions = mockTransactions.filter(txn => 
      txn.timestamp >= start && txn.timestamp <= end
    );
    
    // Mock fraud detection results
    const suspiciousTransactions = periodTransactions.filter(() => Math.random() < 0.05); // 5% fraud rate
    const fraudRate = suspiciousTransactions.length / periodTransactions.length * 100;
    
    const fraudAnalytics = {
      success: true,
      period: { start, end },
      totalTransactions: periodTransactions.length,
      suspiciousTransactions: suspiciousTransactions.length,
      fraudRate,
      riskDistribution: {
        low: Math.floor(periodTransactions.length * 0.8),
        medium: Math.floor(periodTransactions.length * 0.15),
        high: Math.floor(periodTransactions.length * 0.05)
      },
      fraudByCountry: _.countBy(suspiciousTransactions, 'country'),
      fraudByAmount: {
        small: suspiciousTransactions.filter(txn => txn.amount < 100).length,
        medium: suspiciousTransactions.filter(txn => txn.amount >= 100 && txn.amount < 1000).length,
        large: suspiciousTransactions.filter(txn => txn.amount >= 1000).length
      },
      averageFraudAmount: suspiciousTransactions.reduce((sum, txn) => sum + txn.amount, 0) / suspiciousTransactions.length || 0
    };
    
    // Cache for 5 minutes
    await redisClient.setEx(cacheKeyStr, 300, JSON.stringify(fraudAnalytics));
    
    logger.info('Fraud analytics generated', {
      period: { start, end },
      fraudRate,
      suspiciousCount: suspiciousTransactions.length
    });
    
    res.json(fraudAnalytics);
  } catch (error) {
    logger.error('Error generating fraud analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate fraud analytics'
    });
  }
});

// Performance Analytics
app.get('/analytics/performance', async (req, res) => {
  try {
    const performanceMetrics = {
      success: true,
      timestamp: new Date().toISOString(),
      apiMetrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      transactionMetrics: {
        averageProcessingTime: 150, // ms
        successRate: 99.2,
        throughput: 1250, // transactions per minute
        errorRate: 0.8
      },
      systemHealth: {
        databaseConnections: 45,
        redisConnections: 12,
        activeUsers: mockUsers.filter(user => 
          new Date().getTime() - user.lastActiveDate.getTime() < 24 * 60 * 60 * 1000
        ).length
      }
    };
    
    logger.info('Performance analytics generated');
    
    res.json(performanceMetrics);
  } catch (error) {
    logger.error('Error generating performance analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance analytics'
    });
  }
});

// Real-time metrics endpoint
app.get('/analytics/real-time', async (req, res) => {
  try {
    const now = new Date();
    const lastHour = subDays(now, 0);
    lastHour.setHours(now.getHours() - 1);
    
    const recentTransactions = mockTransactions.filter(txn => 
      txn.timestamp >= lastHour
    );
    
    const realTimeMetrics = {
      success: true,
      timestamp: now.toISOString(),
      period: 'last_hour',
      metrics: {
        transactionsPerMinute: recentTransactions.length / 60,
        totalVolume: recentTransactions.reduce((sum, txn) => sum + txn.amount, 0),
        successRate: recentTransactions.filter(txn => txn.status === 'completed').length / recentTransactions.length * 100,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Mock active users
        averageTransactionValue: recentTransactions.reduce((sum, txn) => sum + txn.amount, 0) / recentTransactions.length || 0
      },
      alerts: [
        // Mock alerts
        ...(Math.random() > 0.7 ? [{
          type: 'warning',
          message: 'High transaction volume detected',
          timestamp: now.toISOString()
        }] : [])
      ]
    };
    
    res.json(realTimeMetrics);
  } catch (error) {
    logger.error('Error generating real-time metrics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate real-time metrics'
    });
  }
});

// Scheduled tasks for data aggregation
cron.schedule('0 * * * *', async () => {
  logger.info('Running hourly analytics aggregation');
  
  try {
    // Clear old cache entries
    const keys = await redisClient.keys('*analytics*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    // Update Prometheus metrics
    const completedTransactions = mockTransactions.filter(txn => txn.status === 'completed');
    transactionMetrics.set(
      { type: 'all', status: 'completed', currency: 'all' },
      completedTransactions.length
    );
    
    logger.info('Hourly aggregation completed');
  } catch (error) {
    logger.error('Error in hourly aggregation', { error: error.message });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error in analytics service', { 
    error: err.message, 
    stack: err.stack 
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal analytics service error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Analytics Service started on port ${PORT}`);
  console.log(`🚀 Analytics Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});

export default app;
