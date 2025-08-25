import express from 'express';
import { FraudDetectionController } from '../controllers/FraudDetectionController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateTransaction, validateRiskAssessment } from '../middleware/validation';

const router = express.Router();
const fraudController = new FraudDetectionController();

// Real-time fraud detection
router.post('/detect/transaction', authMiddleware, validateTransaction, fraudController.detectTransactionFraud);
router.post('/detect/user-behavior', authMiddleware, fraudController.detectUserBehaviorFraud);
router.post('/detect/device', authMiddleware, fraudController.detectDeviceFraud);
router.post('/detect/velocity', authMiddleware, fraudController.detectVelocityFraud);

// Risk assessment
router.post('/assess/risk', authMiddleware, validateRiskAssessment, fraudController.assessRisk);
router.get('/assess/user/:userId/risk-profile', authMiddleware, fraudController.getUserRiskProfile);
router.post('/assess/transaction-pattern', authMiddleware, fraudController.assessTransactionPattern);

// Machine learning predictions
router.post('/predict/fraud-probability', authMiddleware, fraudController.predictFraudProbability);
router.post('/predict/anomaly', authMiddleware, fraudController.detectAnomaly);
router.post('/predict/risk-score', authMiddleware, fraudController.calculateRiskScore);

// Pattern analysis
router.post('/analyze/patterns', authMiddleware, fraudController.analyzePatterns);
router.get('/analyze/trends', authMiddleware, fraudController.getFraudTrends);
router.post('/analyze/network', authController.analyzeNetworkFraud);

// Alert management
router.get('/alerts', authMiddleware, fraudController.getFraudAlerts);
router.get('/alerts/:alertId', authMiddleware, fraudController.getFraudAlert);
router.put('/alerts/:alertId/status', authMiddleware, fraudController.updateAlertStatus);
router.post('/alerts/:alertId/investigate', authMiddleware, fraudController.investigateAlert);

// Model management
router.get('/models/status', authMiddleware, fraudController.getModelStatus);
router.post('/models/retrain', authMiddleware, fraudController.retrainModels);
router.get('/models/performance', authMiddleware, fraudController.getModelPerformance);

// Rules engine
router.get('/rules', authMiddleware, fraudController.getFraudRules);
router.post('/rules', authMiddleware, fraudController.createFraudRule);
router.put('/rules/:ruleId', authMiddleware, fraudController.updateFraudRule);
router.delete('/rules/:ruleId', authMiddleware, fraudController.deleteFraudRule);

// Whitelist/Blacklist management
router.get('/whitelist', authMiddleware, fraudController.getWhitelist);
router.post('/whitelist', authMiddleware, fraudController.addToWhitelist);
router.delete('/whitelist/:id', authMiddleware, fraudController.removeFromWhitelist);
router.get('/blacklist', authMiddleware, fraudController.getBlacklist);
router.post('/blacklist', authMiddleware, fraudController.addToBlacklist);
router.delete('/blacklist/:id', authMiddleware, fraudController.removeFromBlacklist);

// Analytics and reporting
router.get('/analytics/dashboard', authMiddleware, fraudController.getFraudDashboard);
router.get('/analytics/statistics', authMiddleware, fraudController.getFraudStatistics);
router.get('/analytics/performance', authMiddleware, fraudController.getDetectionPerformance);
router.post('/reports/generate', authMiddleware, fraudController.generateFraudReport);

// False positive feedback
router.post('/feedback/false-positive', authMiddleware, fraudController.reportFalsePositive);
router.post('/feedback/confirm-fraud', authMiddleware, fraudController.confirmFraud);
router.get('/feedback/learning-data', authMiddleware, fraudController.getLearningData);

// Configuration
router.get('/config/thresholds', authMiddleware, fraudController.getThresholds);
router.put('/config/thresholds', authMiddleware, fraudController.updateThresholds);
router.get('/config/features', authMiddleware, fraudController.getFeatureConfig);
router.put('/config/features', authMiddleware, fraudController.updateFeatureConfig);

export default router;