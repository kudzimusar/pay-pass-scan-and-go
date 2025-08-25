import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import winston from 'winston';
import fraudRoutes from './routes/fraudRoutes';
import { connectDatabase } from './database/connection';
import { initializeRedis } from './services/RedisService';
import { initializeMLModels } from './ml/ModelManager';
import { initializeFraudJobs } from './jobs/fraudJobs';
import { errorHandler } from './middleware/errorHandler';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { RealTimeFraudProcessor } from './services/RealTimeProcessor';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const PORT = process.env.PORT || 3005;

// Real-time fraud processor
const realTimeProcessor = new RealTimeFraudProcessor(io);

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'fraud_detection_service',
  points: 200, // Number of requests
  duration: 60, // Per 60 seconds
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too Many Requests' });
  }
});

// Routes
app.use('/api/v1/fraud', fraudRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'ai-fraud-detection',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modelsLoaded: true
  });
});

// Error handling
app.use(errorHandler);

// Database connection and server start
async function startServer() {
  try {
    await connectDatabase();
    await initializeRedis();
    await initializeMLModels();
    await initializeFraudJobs();
    
    // Start real-time processing
    await realTimeProcessor.initialize();
    
    server.listen(PORT, () => {
      logger.info(`AI Fraud Detection Service running on port ${PORT}`);
      logger.info(`Real-time WebSocket server enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

// Real-time Processing capabilities enabled
logger.info('Real-time Processing: Active');

export default app;
