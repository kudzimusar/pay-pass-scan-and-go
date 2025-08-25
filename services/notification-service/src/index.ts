/**
 * PayPass Notification Service
 * 
 * Handles all notifications across the platform including:
 * - Email notifications
 * - SMS notifications
 * - Push notifications
 * - In-app notifications
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { NotificationRouter } from './routes/notification.routes';
import { HealthController } from './controllers/health.controller';
import { ErrorHandler } from './middleware/error.handler';
import { RequestLogger } from './middleware/request.logger';
import { RateLimiter } from './middleware/rate.limiter';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom middleware
app.use(RequestLogger);
app.use(RateLimiter);

// Initialize services
const notificationService = new NotificationService();

// Initialize controllers
const notificationController = new NotificationController(notificationService);
const healthController = new HealthController();

// Initialize routes
const notificationRouter = new NotificationRouter(notificationController);

// Health check endpoint
app.get('/health', healthController.getHealth.bind(healthController));

// API routes
app.use('/api/v1/notifications', notificationRouter.getRouter());

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
  console.log(`🚀 PayPass Notification Service running on port ${port}`);
  console.log(`📧 Email notifications: ${process.env.EMAIL_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`📱 SMS notifications: ${process.env.SMS_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`🔔 Push notifications: ${process.env.PUSH_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await notificationService.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await notificationService.cleanup();
  process.exit(0);
});

export default app;