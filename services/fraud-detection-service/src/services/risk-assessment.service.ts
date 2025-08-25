import express, { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export class RiskAssessmentService {
  public router = express.Router();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post('/assess', this.assessRisk.bind(this));
    this.router.get('/history/:userId', this.getRiskHistory.bind(this));
    this.router.post('/batch-assess', this.batchAssessRisk.bind(this));
  }

  private async assessRisk(req: Request, res: Response): Promise<void> {
    try {
      const { transaction, userProfile, historicalData } = req.body;

      const riskAssessment = await this.performRiskAssessment(
        transaction,
        userProfile,
        historicalData
      );

      res.json({
        success: true,
        data: riskAssessment,
      });
    } catch (error) {
      logger.error('Error in risk assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assess risk',
      });
    }
  }

  private async performRiskAssessment(
    transaction: any,
    userProfile: any,
    historicalData: any
  ): Promise<any> {
    const riskFactors = await this.analyzeRiskFactors(transaction, userProfile, historicalData);
    const overallRisk = this.calculateOverallRisk(riskFactors);

    return {
      transactionId: transaction.id,
      riskScore: overallRisk,
      riskLevel: this.getRiskLevel(overallRisk),
      riskFactors,
      recommendations: this.generateRecommendations(overallRisk, riskFactors),
      timestamp: new Date().toISOString(),
    };
  }

  private async analyzeRiskFactors(
    transaction: any,
    userProfile: any,
    historicalData: any
  ): Promise<any> {
    const factors = {
      amountRisk: this.calculateAmountRisk(transaction.amount),
      locationRisk: this.calculateLocationRisk(transaction.location, userProfile),
      timeRisk: this.calculateTimeRisk(transaction.timestamp),
      userHistoryRisk: this.calculateUserHistoryRisk(historicalData),
      deviceRisk: this.calculateDeviceRisk(transaction.deviceInfo),
      velocityRisk: this.calculateVelocityRisk(historicalData),
    };

    return factors;
  }

  private calculateAmountRisk(amount: number): number {
    if (amount > 10000) return 0.8;
    if (amount > 5000) return 0.6;
    if (amount > 1000) return 0.4;
    return 0.2;
  }

  private calculateLocationRisk(location: any, userProfile: any): number {
    if (!location || !userProfile) return 0.5;

    // Check if location matches user's usual locations
    const usualCountries = userProfile.usualCountries || ['US'];
    if (!usualCountries.includes(location.country)) {
      return 0.7;
    }

    return 0.2;
  }

  private calculateTimeRisk(timestamp: string): number {
    const hour = new Date(timestamp).getHours();
    
    // Unusual hours (2 AM - 6 AM)
    if (hour >= 2 && hour <= 6) return 0.6;
    
    // Normal business hours (9 AM - 5 PM)
    if (hour >= 9 && hour <= 17) return 0.2;
    
    return 0.4;
  }

  private calculateUserHistoryRisk(historicalData: any): number {
    if (!historicalData || !historicalData.transactions) return 0.5;

    const transactions = historicalData.transactions;
    const recentTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    if (recentTransactions.length > 20) return 0.8;
    if (recentTransactions.length > 10) return 0.6;
    if (recentTransactions.length > 5) return 0.4;

    return 0.2;
  }

  private calculateDeviceRisk(deviceInfo: any): number {
    if (!deviceInfo) return 0.5;

    // Check for suspicious device characteristics
    if (deviceInfo.isVirtualMachine) return 0.8;
    if (deviceInfo.isProxy) return 0.7;
    if (deviceInfo.isTor) return 0.9;

    return 0.2;
  }

  private calculateVelocityRisk(historicalData: any): number {
    if (!historicalData || !historicalData.transactions) return 0.5;

    const transactions = historicalData.transactions;
    const lastHour = transactions.filter((tx: any) => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return (now.getTime() - txDate.getTime()) < 60 * 60 * 1000; // Last hour
    });

    if (lastHour.length > 5) return 0.8;
    if (lastHour.length > 3) return 0.6;
    if (lastHour.length > 1) return 0.4;

    return 0.2;
  }

  private calculateOverallRisk(riskFactors: any): number {
    const weights = {
      amountRisk: 0.25,
      locationRisk: 0.20,
      timeRisk: 0.15,
      userHistoryRisk: 0.20,
      deviceRisk: 0.10,
      velocityRisk: 0.10,
    };

    let overallRisk = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      overallRisk += riskFactors[factor] * weight;
    }

    return Math.min(overallRisk, 1.0);
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    if (riskScore >= 0.2) return 'low';
    return 'minimal';
  }

  private generateRecommendations(riskScore: number, riskFactors: any): string[] {
    const recommendations: string[] = [];

    if (riskScore >= 0.8) {
      recommendations.push('Block transaction - critical risk detected');
      recommendations.push('Require manual review and additional verification');
    } else if (riskScore >= 0.6) {
      recommendations.push('Flag for manual review');
      recommendations.push('Request additional authentication');
    } else if (riskScore >= 0.4) {
      recommendations.push('Monitor transaction closely');
      recommendations.push('Consider additional verification');
    } else {
      recommendations.push('Proceed with standard processing');
    }

    // Specific recommendations based on risk factors
    if (riskFactors.amountRisk > 0.6) {
      recommendations.push('Large amount - consider enhanced due diligence');
    }

    if (riskFactors.locationRisk > 0.6) {
      recommendations.push('Unusual location - verify transaction details');
    }

    if (riskFactors.velocityRisk > 0.6) {
      recommendations.push('High transaction velocity - monitor for suspicious activity');
    }

    return recommendations;
  }

  private async getRiskHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const history = await this.getUserRiskHistory(userId, Number(limit));

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error('Error getting risk history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk history',
      });
    }
  }

  private async getUserRiskHistory(userId: string, limit: number): Promise<any[]> {
    // Mock risk history data
    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: `risk_${userId}_${i}`,
      transactionId: `tx_${Date.now()}_${i}`,
      riskScore: Math.random() * 0.8 + 0.1,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      factors: {
        amountRisk: Math.random(),
        locationRisk: Math.random(),
        timeRisk: Math.random(),
      },
    }));
  }

  private async batchAssessRisk(req: Request, res: Response): Promise<void> {
    try {
      const { transactions } = req.body;

      if (!Array.isArray(transactions) || transactions.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid transactions array',
        });
        return;
      }

      const assessments = await Promise.all(
        transactions.map(async (transaction) => {
          const riskAssessment = await this.performRiskAssessment(
            transaction,
            transaction.userProfile,
            transaction.historicalData
          );
          return riskAssessment;
        })
      );

      res.json({
        success: true,
        data: assessments,
        summary: {
          total: assessments.length,
          lowRisk: assessments.filter(a => a.riskLevel === 'low').length,
          mediumRisk: assessments.filter(a => a.riskLevel === 'medium').length,
          highRisk: assessments.filter(a => a.riskLevel === 'high').length,
          criticalRisk: assessments.filter(a => a.riskLevel === 'critical').length,
        },
      });
    } catch (error) {
      logger.error('Error in batch risk assessment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform batch risk assessment',
      });
    }
  }
}