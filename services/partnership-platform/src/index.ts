/**
 * Partnership Platform Service
 * Provides APIs, SDKs, and integration tools for PayPass partners
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import { PartnerManager } from './services/PartnerManager';
import { APIKeyManager } from './services/APIKeyManager';
import { WebhookManager } from './services/WebhookManager';
import { SDKGenerator } from './services/SDKGenerator';
import { AnalyticsCollector } from './services/AnalyticsCollector';
import { partnerRoutes } from './routes/partnerRoutes';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/partnership-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/partnership-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Load API documentation
const swaggerDocument = YAML.load('./docs/partner-api.yaml');

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Speed limiting
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 100
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(speedLimiter);

// Initialize partnership services
const partnerManager = new PartnerManager();
const apiKeyManager = new APIKeyManager();
const webhookManager = new WebhookManager();
const sdkGenerator = new SDKGenerator();
const analyticsCollector = new AnalyticsCollector();

// Make services available to routes
app.locals.partnerManager = partnerManager;
app.locals.apiKeyManager = apiKeyManager;
app.locals.webhookManager = webhookManager;
app.locals.sdkGenerator = sdkGenerator;
app.locals.analyticsCollector = analyticsCollector;
app.locals.logger = logger;
app.locals.io = io;

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Authentication middleware
const authenticatePartner = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please provide a valid API key in the Authorization header'
      });
    }

    const apiKey = authHeader.substring(7);
    const partner = await apiKeyManager.validateAPIKey(apiKey);
    
    if (!partner) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or expired'
      });
    }

    req.partner = partner;
    
    // Track API usage
    await analyticsCollector.trackAPICall({
      partnerId: partner.id,
      endpoint: req.path,
      method: req.method,
      timestamp: new Date(),
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Internal authentication error'
    });
  }
};

// Public routes (no authentication required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'partnership-platform',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'partner-management',
      'api-key-management',
      'webhook-integration',
      'sdk-generation',
      'real-time-notifications',
      'analytics-tracking'
    ],
    endpoints: {
      documentation: '/docs',
      authentication: '/auth',
      partners: '/api/partners',
      webhooks: '/api/webhooks',
      sdks: '/api/sdks'
    }
  });
});

// Partner registration
app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { companyName, email, website, description, integrationType } = req.body;
    
    if (!companyName || !email || !integrationType) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['companyName', 'email', 'integrationType']
      });
    }

    const partner = await partnerManager.registerPartner({
      companyName,
      email,
      website,
      description,
      integrationType,
      status: 'pending'
    });

    const apiKey = await apiKeyManager.generateAPIKey(partner.id);

    res.status(201).json({
      success: true,
      message: 'Partner registration successful',
      partner: {
        id: partner.id,
        companyName: partner.companyName,
        status: partner.status
      },
      apiKey: {
        key: apiKey.key,
        environment: apiKey.environment,
        expiresAt: apiKey.expiresAt
      },
      nextSteps: [
        'Review our API documentation at /docs',
        'Test your integration in sandbox mode',
        'Submit for production approval'
      ]
    });
  } catch (error) {
    logger.error('Partner registration failed:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Internal server error during registration'
    });
  }
});

// Protected routes (require authentication)
app.use('/api', apiLimiter, authenticatePartner, partnerRoutes);

// SDK download endpoints
app.get('/sdks/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const supportedLanguages = ['javascript', 'python', 'php', 'java', 'ruby', 'go'];
    
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        error: 'Unsupported language',
        supported: supportedLanguages
      });
    }

    const sdk = await sdkGenerator.generateSDK(language);
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=paypass-${language}-sdk.zip`);
    res.send(sdk);
  } catch (error) {
    logger.error('SDK generation failed:', error);
    res.status(500).json({
      error: 'SDK generation failed',
      message: 'Unable to generate SDK for the specified language'
    });
  }
});

// Webhook endpoint for testing
app.post('/webhooks/test', upload.single('file'), async (req, res) => {
  try {
    const webhookData = {
      event: req.body.event || 'test',
      data: req.body.data || {},
      timestamp: new Date().toISOString(),
      file: req.file ? {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    };

    // Test webhook delivery
    const result = await webhookManager.testWebhook(req.body.url, webhookData);
    
    res.json({
      success: true,
      message: 'Webhook test completed',
      result
    });
  } catch (error) {
    logger.error('Webhook test failed:', error);
    res.status(500).json({
      error: 'Webhook test failed',
      message: error.message
    });
  }
});

// Real-time partner notifications
io.on('connection', (socket) => {
  logger.info(`Partner connected: ${socket.id}`);
  
  socket.on('authenticate', async (data) => {
    try {
      const partner = await apiKeyManager.validateAPIKey(data.apiKey);
      if (partner) {
        socket.join(`partner:${partner.id}`);
        socket.emit('authenticated', { partnerId: partner.id });
        logger.info(`Partner ${partner.id} authenticated for real-time updates`);
      } else {
        socket.emit('authentication_failed', { error: 'Invalid API key' });
      }
    } catch (error) {
      socket.emit('authentication_failed', { error: 'Authentication error' });
    }
  });

  socket.on('subscribe', (data) => {
    const { events } = data;
    if (Array.isArray(events)) {
      events.forEach(event => socket.join(`event:${event}`));
      socket.emit('subscribed', { events });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Partner disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Partnership platform error:', error);
  res.status(500).json({
    error: 'Internal partnership platform error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested API endpoint does not exist',
    documentation: '/docs',
    availableEndpoints: [
      'GET /health',
      'POST /auth/register',
      'GET /docs',
      'GET /sdks/:language',
      'POST /webhooks/test',
      'GET /api/partners',
      'POST /api/webhooks'
    ]
  });
});

const PORT = process.env.PARTNERSHIP_SERVICE_PORT || 3014;

async function startServer() {
  try {
    // Initialize partnership services
    await partnerManager.initialize();
    await apiKeyManager.initialize();
    await webhookManager.initialize();
    await sdkGenerator.initialize();
    await analyticsCollector.initialize();
    
    server.listen(PORT, () => {
      logger.info(`🤝 Partnership Platform Service running on port ${PORT}`);
      logger.info(`📚 API Documentation available at: http://localhost:${PORT}/docs`);
      logger.info(`🔑 Partner authentication: API key based`);
      logger.info(`🪝 Webhook support: Real-time event delivery`);
      logger.info(`📦 SDK generation: 6 programming languages`);
      logger.info(`📊 Analytics tracking: Comprehensive usage metrics`);
      logger.info(`⚡ Real-time notifications: WebSocket enabled`);
    });
  } catch (error) {
    logger.error('Failed to start partnership platform service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down partnership platform service gracefully');
  await partnerManager.disconnect();
  await webhookManager.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down partnership platform service gracefully');
  await partnerManager.disconnect();
  await webhookManager.disconnect();
  process.exit(0);
});

startServer();

export default app;
