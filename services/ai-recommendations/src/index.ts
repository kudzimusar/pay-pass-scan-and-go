/**
 * AI-Powered Recommendations Service
 * Provides intelligent recommendations for users based on behavior, preferences, and patterns
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import cron from 'node-cron';

import { RecommendationEngine } from './services/RecommendationEngine';
import { UserBehaviorAnalyzer } from './services/UserBehaviorAnalyzer';
import { PersonalizationService } from './services/PersonalizationService';
import { PredictiveAnalytics } from './services/PredictiveAnalytics';
import { NLPProcessor } from './services/NLPProcessor';
import { recommendationRoutes } from './routes/recommendationRoutes';

dotenv.config();

const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-recommendations-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/ai-recommendations-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize AI services
const recommendationEngine = new RecommendationEngine();
const behaviorAnalyzer = new UserBehaviorAnalyzer();
const personalizationService = new PersonalizationService();
const predictiveAnalytics = new PredictiveAnalytics();
const nlpProcessor = new NLPProcessor();

// Make services available to routes
app.locals.recommendationEngine = recommendationEngine;
app.locals.behaviorAnalyzer = behaviorAnalyzer;
app.locals.personalizationService = personalizationService;
app.locals.predictiveAnalytics = predictiveAnalytics;
app.locals.nlpProcessor = nlpProcessor;
app.locals.logger = logger;

// Routes
app.use('/api', recommendationRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-recommendations',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    aiModels: {
      collaborative_filtering: 'active',
      content_based: 'active',
      deep_learning: 'active',
      nlp_processing: 'active'
    },
    features: [
      'personalized-recommendations',
      'behavior-analysis',
      'predictive-analytics',
      'sentiment-analysis',
      'smart-suggestions',
      'preference-learning'
    ]
  });
});

// Scheduled tasks for model training and updates
cron.schedule('0 2 * * *', async () => {
  logger.info('Running daily model training...');
  try {
    await recommendationEngine.trainModels();
    await behaviorAnalyzer.updateUserProfiles();
    await predictiveAnalytics.refreshPredictions();
    logger.info('Daily model training completed successfully');
  } catch (error) {
    logger.error('Daily model training failed:', error);
  }
});

// Real-time recommendation updates
cron.schedule('*/15 * * * *', async () => {
  try {
    await recommendationEngine.updateRealtimeRecommendations();
    logger.info('Real-time recommendations updated');
  } catch (error) {
    logger.error('Real-time recommendation update failed:', error);
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('AI recommendations service error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal AI service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'AI service temporarily unavailable'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'AI recommendations endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/recommendations/:userId',
      'POST /api/behavior/track',
      'GET /api/insights/:userId',
      'POST /api/preferences/update',
      'GET /api/predictions/:userId'
    ]
  });
});

const PORT = process.env.AI_RECOMMENDATIONS_PORT || 3012;

async function startServer() {
  try {
    // Initialize AI models and services
    await recommendationEngine.initialize();
    await behaviorAnalyzer.initialize();
    await personalizationService.initialize();
    await predictiveAnalytics.initialize();
    await nlpProcessor.initialize();
    
    app.listen(PORT, () => {
      logger.info(`🤖 AI Recommendations Service running on port ${PORT}`);
      logger.info(`🧠 Machine learning models: Loaded and active`);
      logger.info(`📊 User behavior analysis: Enabled`);
      logger.info(`🎯 Personalization engine: Running`);
      logger.info(`🔮 Predictive analytics: Active`);
      logger.info(`💬 Natural language processing: Available`);
      logger.info(`⚡ Real-time recommendations: Enabled`);
    });
  } catch (error) {
    logger.error('Failed to start AI recommendations service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down AI recommendations service gracefully');
  await recommendationEngine.shutdown();
  await behaviorAnalyzer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down AI recommendations service gracefully');
  await recommendationEngine.shutdown();
  await behaviorAnalyzer.shutdown();
  process.exit(0);
});

startServer();

export default app;
