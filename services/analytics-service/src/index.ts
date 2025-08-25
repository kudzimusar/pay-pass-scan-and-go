/**
 * PayPass Analytics Service
 * 
 * Handles data analytics and reporting across the platform including:
 * - Transaction analytics
 * - User analytics
 * - Revenue analytics
 * - Performance metrics
 * - Business intelligence
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsRouter } from './routes/analytics.routes';
import { HealthController } from './controllers/health.controller';
import { ErrorHandler } from './middleware/error.handler';
import { RequestLogger } from './middleware/request.logger';
import { RateLimiter } from './middleware/rate.limiter';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(RequestLogger);
app.use(RateLimiter);

// Initialize services
const analyticsService = new AnalyticsService();

// Initialize controllers
const analyticsController = new AnalyticsController(analyticsService);
const healthController = new HealthController();

// Initialize routes
const analyticsRouter = new AnalyticsRouter(analyticsController);

// Health check endpoint
app.get('/health', healthController.getHealth.bind(healthController));

// API routes
app.use('/api/v1/analytics', analyticsRouter.getRouter());

// Error handling
app.use(ErrorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
});

// Start server
app.listen(port, () => {
  console.log(`📊 PayPass Analytics Service running on port ${port}`);
  console.log(`📈 Transaction analytics: Enabled`);
  console.log(`👥 User analytics: Enabled`);
  console.log(`💰 Revenue analytics: Enabled`);
  console.log(`⚡ Performance metrics: Enabled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await analyticsService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await analyticsService.cleanup();
  process.exit(0);
});

export default app;