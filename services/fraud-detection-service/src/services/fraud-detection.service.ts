import express, { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { logger } from '../utils/logger';

// Input validation schemas
const TransactionSchema = z.object({
  transactionId: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  currency: z.string(),
  merchantId: z.string().optional(),
  location: z.object({
    country: z.string(),
    city: z.string().optional(),
    ipAddress: z.string().optional(),
  }).optional(),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    userAgent: z.string().optional(),
    fingerprint: z.string().optional(),
  }).optional(),
  timestamp: z.string().datetime(),
});

const RiskAssessmentRequestSchema = z.object({
  transaction: TransactionSchema,
  userHistory: z.array(z.object({
    transactionId: z.string(),
    amount: z.number(),
    timestamp: z.string(),
    status: z.string(),
  })).optional(),
});

export class FraudDetectionService {
  public router = express.Router();
  private redis: Redis;
  private riskThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
  };

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupRoutes();
  }

  private setupRoutes() {
    // Real-time risk assessment
    this.router.post('/assess-risk', this.assessRisk.bind(this));
    
    // Fraud pattern analysis
    this.router.post('/analyze-patterns', this.analyzePatterns.bind(this));
    
    // Anomaly detection
    this.router.post('/detect-anomalies', this.detectAnomalies.bind(this));
    
    // Get fraud statistics
    this.router.get('/statistics', this.getStatistics.bind(this));
    
    // Update risk thresholds
    this.router.put('/thresholds', this.updateThresholds.bind(this));
    
    // Get fraud alerts
    this.router.get('/alerts', this.getAlerts.bind(this));
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize ML models and load training data
      await this.loadModels();
      logger.info('Fraud detection models loaded successfully');
    } catch (error) {
      logger.error('Failed to initialize fraud detection service:', error);
      throw error;
    }
  }

  private async loadModels(): Promise<void> {
    // In a real implementation, this would load trained ML models
    // For now, we'll use rule-based detection with mock ML scoring
    logger.info('Loading fraud detection models...');
    
    // Simulate model loading time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = RiskAssessmentRequestSchema.parse(req.body);
      const { transaction, userHistory } = validatedData;

      // Perform risk assessment using multiple factors
      const riskScore = await this.calculateRiskScore(transaction, userHistory);
      const riskLevel = this.determineRiskLevel(riskScore);
      const recommendations = this.generateRecommendations(riskScore, transaction);

      // Store assessment result
      await this.storeAssessment(transaction.transactionId, {
        riskScore,
        riskLevel,
        recommendations,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          riskScore: Math.round(riskScore * 100) / 100,
          riskLevel,
          recommendations,
          assessmentTimestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      logger.error('Error in risk assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess risk',
      });
    }
  }

  private async calculateRiskScore(
    transaction: any,
    userHistory?: any[]
  ): Promise<number> {
    let riskScore = 0;

    // Amount-based risk (higher amounts = higher risk)
    const amountRisk = Math.min(transaction.amount / 10000, 0.3);
    riskScore += amountRisk;

    // Location-based risk (international transactions)
    if (transaction.location?.country && transaction.location.country !== 'US') {
      riskScore += 0.2;
    }

    // Time-based risk (unusual hours)
    const hour = new Date(transaction.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      riskScore += 0.15;
    }

    // User history analysis
    if (userHistory && userHistory.length > 0) {
      const recentTransactions = userHistory
        .filter(tx => {
          const txDate = new Date(tx.timestamp);
          const now = new Date();
          return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
        });

      // Frequency risk
      if (recentTransactions.length > 10) {
        riskScore += 0.25;
      }

      // Amount pattern risk
      const avgAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length;
      if (transaction.amount > avgAmount * 3) {
        riskScore += 0.3;
      }
    }

    // Device fingerprint risk (simplified)
    if (transaction.deviceInfo?.fingerprint) {
      // In real implementation, this would check against known fraudulent fingerprints
      riskScore += Math.random() * 0.1;
    }

    // ML-based scoring (mock)
    const mlScore = await this.getMLScore(transaction);
    riskScore += mlScore * 0.4;

    return Math.min(riskScore, 1.0);
  }

  private async getMLScore(transaction: any): Promise<number> {
    // Mock ML scoring - in real implementation, this would use trained models
    const features = [
      transaction.amount,
      transaction.location?.country === 'US' ? 0 : 1,
      new Date(transaction.timestamp).getHours(),
      transaction.deviceInfo?.fingerprint ? 1 : 0,
    ];

    // Simple mock ML algorithm
    const score = features.reduce((sum, feature) => sum + feature * Math.random(), 0) / features.length;
    return Math.min(score, 1.0);
  }

  private determineRiskLevel(riskScore: number): string {
    if (riskScore <= this.riskThresholds.low) return 'low';
    if (riskScore <= this.riskThresholds.medium) return 'medium';
    if (riskScore <= this.riskThresholds.high) return 'high';
    return 'critical';
  }

  private generateRecommendations(riskScore: number, transaction: any): string[] {
    const recommendations: string[] = [];

    if (riskScore > this.riskThresholds.high) {
      recommendations.push('Block transaction - high risk detected');
      recommendations.push('Require additional verification');
    } else if (riskScore > this.riskThresholds.medium) {
      recommendations.push('Flag for manual review');
      recommendations.push('Request additional authentication');
    } else if (riskScore > this.riskThresholds.low) {
      recommendations.push('Monitor transaction closely');
    } else {
      recommendations.push('Proceed with transaction');
    }

    // Specific recommendations based on risk factors
    if (transaction.amount > 5000) {
      recommendations.push('Large amount - consider enhanced due diligence');
    }

    if (transaction.location?.country && transaction.location.country !== 'US') {
      recommendations.push('International transaction - verify recipient details');
    }

    return recommendations;
  }

  private async storeAssessment(transactionId: string, assessment: any): Promise<void> {
    const key = `fraud_assessment:${transactionId}`;
    await this.redis.setex(key, 86400, JSON.stringify(assessment)); // 24 hours TTL
  }

  private async analyzePatterns(req: Request, res: Response): Promise<void> {
    try {
      const { userId, timeRange } = req.body;

      // Analyze transaction patterns for the user
      const patterns = await this.analyzeUserPatterns(userId, timeRange);

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      logger.error('Error in pattern analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze patterns',
      });
    }
  }

  private async analyzeUserPatterns(userId: string, timeRange: string): Promise<any> {
    // Mock pattern analysis
    return {
      userId,
      timeRange,
      patterns: {
        transactionFrequency: 'normal',
        amountDistribution: 'consistent',
        locationPatterns: 'stable',
        deviceUsage: 'consistent',
        riskTrend: 'decreasing',
      },
      anomalies: [],
      recommendations: ['Continue monitoring', 'User behavior appears normal'],
    };
  }

  private async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { transaction } = req.body;

      const anomalies = await this.findAnomalies(transaction);

      res.json({
        success: true,
        data: {
          transactionId: transaction.transactionId,
          anomalies,
          anomalyCount: anomalies.length,
        },
      });
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to detect anomalies',
      });
    }
  }

  private async findAnomalies(transaction: any): Promise<any[]> {
    const anomalies: any[] = [];

    // Check for amount anomalies
    if (transaction.amount > 10000) {
      anomalies.push({
        type: 'amount_anomaly',
        severity: 'high',
        description: 'Transaction amount exceeds normal threshold',
        value: transaction.amount,
      });
    }

    // Check for time anomalies
    const hour = new Date(transaction.timestamp).getHours();
    if (hour < 4 || hour > 23) {
      anomalies.push({
        type: 'time_anomaly',
        severity: 'medium',
        description: 'Transaction at unusual hour',
        value: hour,
      });
    }

    // Check for location anomalies
    if (transaction.location?.country && transaction.location.country !== 'US') {
      anomalies.push({
        type: 'location_anomaly',
        severity: 'medium',
        description: 'International transaction',
        value: transaction.location.country,
      });
    }

    return anomalies;
  }

  private async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.calculateFraudStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting fraud statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get statistics',
      });
    }
  }

  private async calculateFraudStatistics(): Promise<any> {
    // Mock statistics
    return {
      totalTransactions: 15420,
      flaggedTransactions: 1234,
      blockedTransactions: 89,
      falsePositives: 23,
      truePositives: 66,
      accuracy: 0.92,
      averageRiskScore: 0.34,
      riskDistribution: {
        low: 0.65,
        medium: 0.25,
        high: 0.08,
        critical: 0.02,
      },
    };
  }

  private async updateThresholds(req: Request, res: Response): Promise<void> {
    try {
      const { low, medium, high } = req.body;

      if (low !== undefined) this.riskThresholds.low = low;
      if (medium !== undefined) this.riskThresholds.medium = medium;
      if (high !== undefined) this.riskThresholds.high = high;

      // Store updated thresholds
      await this.redis.set('fraud_thresholds', JSON.stringify(this.riskThresholds));

      res.json({
        success: true,
        data: this.riskThresholds,
        message: 'Risk thresholds updated successfully',
      });
    } catch (error) {
      logger.error('Error updating thresholds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update thresholds',
      });
    }
  }

  private async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50, severity } = req.query;

      const alerts = await this.getFraudAlerts(Number(limit), severity as string);

      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      logger.error('Error getting fraud alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get alerts',
      });
    }
  }

  private async getFraudAlerts(limit: number, severity?: string): Promise<any[]> {
    // Mock fraud alerts
    const alerts = [
      {
        id: 'alert_001',
        transactionId: 'tx_123456',
        severity: 'high',
        type: 'suspicious_pattern',
        description: 'Multiple high-value transactions in short time',
        timestamp: new Date().toISOString(),
        status: 'open',
      },
      {
        id: 'alert_002',
        transactionId: 'tx_123457',
        severity: 'medium',
        type: 'location_anomaly',
        description: 'Transaction from new country',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'investigating',
      },
    ];

    if (severity) {
      return alerts.filter(alert => alert.severity === severity).slice(0, limit);
    }

    return alerts.slice(0, limit);
  }
}