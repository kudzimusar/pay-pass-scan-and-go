import express, { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export class AnomalyDetectionService {
  public router = express.Router();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post('/detect', this.detectAnomalies.bind(this));
    this.router.get('/patterns/:userId', this.getAnomalyPatterns.bind(this));
    this.router.post('/train', this.trainModel.bind(this));
    this.router.get('/statistics', this.getAnomalyStatistics.bind(this));
  }

  private async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const { transaction, userProfile, historicalData } = req.body;

      const anomalies = await this.performAnomalyDetection(
        transaction,
        userProfile,
        historicalData
      );

      res.json({
        success: true,
        data: {
          transactionId: transaction.id,
          anomalies,
          anomalyCount: anomalies.length,
          severity: this.calculateOverallSeverity(anomalies),
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

  private async performAnomalyDetection(
    transaction: any,
    userProfile: any,
    historicalData: any
  ): Promise<any[]> {
    const anomalies: any[] = [];

    // Amount anomalies
    const amountAnomalies = this.detectAmountAnomalies(transaction, historicalData);
    anomalies.push(...amountAnomalies);

    // Time anomalies
    const timeAnomalies = this.detectTimeAnomalies(transaction, userProfile);
    anomalies.push(...timeAnomalies);

    // Location anomalies
    const locationAnomalies = this.detectLocationAnomalies(transaction, userProfile);
    anomalies.push(...locationAnomalies);

    // Device anomalies
    const deviceAnomalies = this.detectDeviceAnomalies(transaction, userProfile);
    anomalies.push(...deviceAnomalies);

    // Behavioral anomalies
    const behavioralAnomalies = this.detectBehavioralAnomalies(transaction, historicalData);
    anomalies.push(...behavioralAnomalies);

    // Pattern anomalies
    const patternAnomalies = this.detectPatternAnomalies(transaction, historicalData);
    anomalies.push(...patternAnomalies);

    return anomalies;
  }

  private detectAmountAnomalies(transaction: any, historicalData: any): any[] {
    const anomalies: any[] = [];

    if (!historicalData || !historicalData.transactions) {
      return anomalies;
    }

    const transactions = historicalData.transactions;
    const amounts = transactions.map((tx: any) => tx.amount);
    const avgAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length;
    const stdDev = this.calculateStandardDeviation(amounts, avgAmount);

    // Check if current amount is significantly different from historical average
    const zScore = Math.abs(transaction.amount - avgAmount) / stdDev;
    
    if (zScore > 3) {
      anomalies.push({
        type: 'amount_anomaly',
        severity: 'high',
        description: `Transaction amount (${transaction.amount}) is ${zScore.toFixed(2)} standard deviations from average (${avgAmount.toFixed(2)})`,
        value: transaction.amount,
        threshold: avgAmount + (3 * stdDev),
        zScore: zScore,
      });
    } else if (zScore > 2) {
      anomalies.push({
        type: 'amount_anomaly',
        severity: 'medium',
        description: `Transaction amount (${transaction.amount}) is ${zScore.toFixed(2)} standard deviations from average (${avgAmount.toFixed(2)})`,
        value: transaction.amount,
        threshold: avgAmount + (2 * stdDev),
        zScore: zScore,
      });
    }

    // Check for unusually large amounts
    if (transaction.amount > avgAmount * 5) {
      anomalies.push({
        type: 'amount_anomaly',
        severity: 'high',
        description: `Transaction amount (${transaction.amount}) is more than 5x the average amount (${avgAmount.toFixed(2)})`,
        value: transaction.amount,
        threshold: avgAmount * 5,
        ratio: transaction.amount / avgAmount,
      });
    }

    return anomalies;
  }

  private detectTimeAnomalies(transaction: any, userProfile: any): any[] {
    const anomalies: any[] = [];

    const timestamp = new Date(transaction.timestamp);
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    // Check for unusual hours
    if (hour < 6 || hour > 23) {
      anomalies.push({
        type: 'time_anomaly',
        severity: 'medium',
        description: `Transaction at unusual hour: ${hour}:00`,
        value: hour,
        threshold: '6:00 - 23:00',
      });
    }

    // Check for weekend transactions if user typically doesn't transact on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const weekendTransactions = userProfile?.weekendTransactions || 0;
      const totalTransactions = userProfile?.totalTransactions || 1;
      const weekendRatio = weekendTransactions / totalTransactions;

      if (weekendRatio < 0.1) {
        anomalies.push({
          type: 'time_anomaly',
          severity: 'medium',
          description: 'Transaction on weekend (unusual for this user)',
          value: dayOfWeek,
          threshold: 'Weekday transactions',
        });
      }
    }

    return anomalies;
  }

  private detectLocationAnomalies(transaction: any, userProfile: any): any[] {
    const anomalies: any[] = [];

    if (!transaction.location || !userProfile) {
      return anomalies;
    }

    const usualLocations = userProfile.usualLocations || [];
    const currentLocation = transaction.location.country;

    if (!usualLocations.includes(currentLocation)) {
      anomalies.push({
        type: 'location_anomaly',
        severity: 'high',
        description: `Transaction from new country: ${currentLocation}`,
        value: currentLocation,
        threshold: usualLocations,
      });
    }

    // Check for rapid location changes
    if (transaction.location.ipAddress) {
      const lastLocation = userProfile.lastLocation;
      if (lastLocation && lastLocation.country !== currentLocation) {
        const timeDiff = Date.now() - new Date(userProfile.lastTransactionTime).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 2) {
          anomalies.push({
            type: 'location_anomaly',
            severity: 'high',
            description: `Rapid location change: ${lastLocation.country} to ${currentLocation} in ${hoursDiff.toFixed(1)} hours`,
            value: currentLocation,
            threshold: '2+ hours between location changes',
            timeDiff: hoursDiff,
          });
        }
      }
    }

    return anomalies;
  }

  private detectDeviceAnomalies(transaction: any, userProfile: any): any[] {
    const anomalies: any[] = [];

    if (!transaction.deviceInfo || !userProfile) {
      return anomalies;
    }

    const usualDevices = userProfile.usualDevices || [];
    const currentDevice = transaction.deviceInfo.deviceId;

    if (currentDevice && !usualDevices.includes(currentDevice)) {
      anomalies.push({
        type: 'device_anomaly',
        severity: 'medium',
        description: `Transaction from new device: ${currentDevice}`,
        value: currentDevice,
        threshold: usualDevices,
      });
    }

    // Check for suspicious device characteristics
    if (transaction.deviceInfo.isVirtualMachine) {
      anomalies.push({
        type: 'device_anomaly',
        severity: 'high',
        description: 'Transaction from virtual machine',
        value: 'Virtual Machine',
        threshold: 'Physical device',
      });
    }

    if (transaction.deviceInfo.isProxy) {
      anomalies.push({
        type: 'device_anomaly',
        severity: 'high',
        description: 'Transaction through proxy',
        value: 'Proxy detected',
        threshold: 'Direct connection',
      });
    }

    return anomalies;
  }

  private detectBehavioralAnomalies(transaction: any, historicalData: any): any[] {
    const anomalies: any[] = [];

    if (!historicalData || !historicalData.transactions) {
      return anomalies;
    }

    const transactions = historicalData.transactions;
    const recentTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    // Check for unusual transaction frequency
    if (recentTransactions.length > 20) {
      anomalies.push({
        type: 'behavioral_anomaly',
        severity: 'high',
        description: `High transaction frequency: ${recentTransactions.length} transactions in 24 hours`,
        value: recentTransactions.length,
        threshold: 20,
      });
    }

    // Check for unusual transaction timing patterns
    const timeIntervals = [];
    for (let i = 1; i < recentTransactions.length; i++) {
      const interval = new Date(recentTransactions[i].timestamp).getTime() - 
                      new Date(recentTransactions[i-1].timestamp).getTime();
      timeIntervals.push(interval / (1000 * 60)); // Convert to minutes
    }

    if (timeIntervals.length > 0) {
      const avgInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;
      const currentInterval = (Date.now() - new Date(recentTransactions[recentTransactions.length - 1].timestamp).getTime()) / (1000 * 60);

      if (currentInterval < avgInterval * 0.1) {
        anomalies.push({
          type: 'behavioral_anomaly',
          severity: 'medium',
          description: `Unusually rapid transaction timing: ${currentInterval.toFixed(1)} minutes vs average ${avgInterval.toFixed(1)} minutes`,
          value: currentInterval,
          threshold: avgInterval * 0.1,
        });
      }
    }

    return anomalies;
  }

  private detectPatternAnomalies(transaction: any, historicalData: any): any[] {
    const anomalies: any[] = [];

    if (!historicalData || !historicalData.transactions) {
      return anomalies;
    }

    const transactions = historicalData.transactions;
    
    // Check for repeated small amounts (testing behavior)
    const recentSmallTransactions = transactions.filter((tx: any) => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 1 && tx.amount < 10; // Small amounts in last hour
    });

    if (recentSmallTransactions.length > 5) {
      anomalies.push({
        type: 'pattern_anomaly',
        severity: 'medium',
        description: `Multiple small test transactions: ${recentSmallTransactions.length} transactions under $10 in 1 hour`,
        value: recentSmallTransactions.length,
        threshold: 5,
      });
    }

    // Check for round number amounts (suspicious pattern)
    if (transaction.amount % 100 === 0 || transaction.amount % 1000 === 0) {
      anomalies.push({
        type: 'pattern_anomaly',
        severity: 'low',
        description: `Round number transaction amount: ${transaction.amount}`,
        value: transaction.amount,
        threshold: 'Non-round amounts',
      });
    }

    return anomalies;
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateOverallSeverity(anomalies: any[]): string {
    if (anomalies.length === 0) return 'none';

    const severityScores = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
    };

    const totalScore = anomalies.reduce((sum, anomaly) => {
      return sum + (severityScores[anomaly.severity as keyof typeof severityScores] || 0);
    }, 0);

    const avgScore = totalScore / anomalies.length;

    if (avgScore >= 3.5) return 'critical';
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private async getAnomalyPatterns(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { timeRange = '30d' } = req.query;

      const patterns = await this.analyzeAnomalyPatterns(userId, timeRange as string);

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      logger.error('Error getting anomaly patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get anomaly patterns',
      });
    }
  }

  private async analyzeAnomalyPatterns(userId: string, timeRange: string): Promise<any> {
    // Mock anomaly pattern analysis
    return {
      userId,
      timeRange,
      totalAnomalies: 15,
      anomalyTypes: {
        amount_anomaly: 5,
        time_anomaly: 3,
        location_anomaly: 4,
        device_anomaly: 2,
        behavioral_anomaly: 1,
      },
      severityDistribution: {
        low: 3,
        medium: 7,
        high: 4,
        critical: 1,
      },
      trends: {
        increasing: false,
        decreasing: true,
        stable: false,
      },
      recommendations: [
        'Monitor location changes more closely',
        'Review device authentication patterns',
        'Consider implementing additional verification for high-amount transactions',
      ],
    };
  }

  private async trainModel(req: Request, res: Response): Promise<void> {
    try {
      const { trainingData } = req.body;

      // Mock model training
      const trainingResult = await this.performModelTraining(trainingData);

      res.json({
        success: true,
        data: trainingResult,
        message: 'Anomaly detection model trained successfully',
      });
    } catch (error) {
      logger.error('Error training model:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to train model',
      });
    }
  }

  private async performModelTraining(trainingData: any): Promise<any> {
    // Mock training process
    return {
      modelVersion: '1.2.3',
      trainingSamples: trainingData.length,
      accuracy: 0.94,
      precision: 0.91,
      recall: 0.89,
      f1Score: 0.90,
      trainingTime: '2.5 minutes',
      features: [
        'transaction_amount',
        'transaction_time',
        'location_data',
        'device_fingerprint',
        'user_behavior_patterns',
      ],
    };
  }

  private async getAnomalyStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.calculateAnomalyStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting anomaly statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get anomaly statistics',
      });
    }
  }

  private async calculateAnomalyStatistics(): Promise<any> {
    // Mock anomaly statistics
    return {
      totalDetections: 1234,
      falsePositives: 89,
      truePositives: 1145,
      accuracy: 0.93,
      detectionRate: 0.95,
      averageResponseTime: '150ms',
      anomalyTypes: {
        amount_anomaly: 0.35,
        time_anomaly: 0.25,
        location_anomaly: 0.20,
        device_anomaly: 0.15,
        behavioral_anomaly: 0.05,
      },
      severityDistribution: {
        low: 0.40,
        medium: 0.35,
        high: 0.20,
        critical: 0.05,
      },
    };
  }
}