import { Server as SocketIOServer } from 'socket.io';
import { createClient, RedisClientType } from 'redis';
import winston from 'winston';
import { modelManager } from '../ml/ModelManager';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export interface RealTimeTransaction {
  transactionId: string;
  userId: string;
  amount: number;
  currency: string;
  merchantId?: string;
  timestamp: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    country: string;
  };
}

export interface FraudAlert {
  alertId: string;
  transactionId: string;
  riskScore: number;
  fraudProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
  explanation: string[];
  timestamp: string;
  processingTime: number;
}

export class RealTimeFraudProcessor {
  private io: SocketIOServer;
  private redis: RedisClientType;
  private isInitialized = false;
  private processingQueue: RealTimeTransaction[] = [];
  private alertHistory: FraudAlert[] = [];
  private maxHistorySize = 1000;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    this.setupSocketHandlers();
  }

  async initialize(): Promise<void> {
    try {
      await this.redis.connect();
      await this.startBackgroundProcessing();
      this.isInitialized = true;
      logger.info('RealTimeFraudProcessor initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RealTimeFraudProcessor:', error);
      throw error;
    }
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Send current statistics when client connects
      socket.emit('fraud_stats', this.getCurrentStats());
      
      // Handle real-time transaction analysis requests
      socket.on('analyze_transaction', async (transaction: RealTimeTransaction) => {
        try {
          const result = await this.analyzeTransactionRealTime(transaction);
          socket.emit('fraud_result', result);
          
          // Broadcast high-risk alerts to all connected clients
          if (result.riskLevel === 'HIGH') {
            this.io.emit('fraud_alert', result);
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to analyze transaction' });
          logger.error('Real-time analysis error:', error);
        }
      });
      
      // Handle subscription to fraud alerts
      socket.on('subscribe_alerts', (filters) => {
        socket.join('fraud_alerts');
        logger.info(`Client ${socket.id} subscribed to fraud alerts`);
      });
      
      // Handle unsubscription
      socket.on('unsubscribe_alerts', () => {
        socket.leave('fraud_alerts');
        logger.info(`Client ${socket.id} unsubscribed from fraud alerts`);
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  async analyzeTransactionRealTime(transaction: RealTimeTransaction): Promise<FraudAlert> {
    const startTime = Date.now();
    
    try {
      // Prepare feature vector for ML model
      const features = await this.extractFeatures(transaction);
      
      // Get ML prediction
      const prediction = await modelManager.predictFraud(features);
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Create fraud alert
      const alert: FraudAlert = {
        alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionId: transaction.transactionId,
        riskScore: prediction.riskScore,
        fraudProbability: prediction.fraudProbability,
        riskLevel: prediction.fraudProbability > 0.8 ? 'HIGH' : 
                   prediction.fraudProbability > 0.5 ? 'MEDIUM' : 'LOW',
        recommendation: prediction.fraudProbability > 0.8 ? 'BLOCK' :
                       prediction.fraudProbability > 0.5 ? 'REVIEW' : 'APPROVE',
        explanation: prediction.explanation,
        timestamp: new Date().toISOString(),
        processingTime
      };
      
      // Store alert in history
      this.addToHistory(alert);
      
      // Cache result in Redis
      await this.cacheResult(transaction.transactionId, alert);
      
      // Update real-time statistics
      await this.updateRealTimeStats(alert);
      
      // Log processing
      logger.info('Real-time fraud analysis completed', {
        transactionId: transaction.transactionId,
        riskLevel: alert.riskLevel,
        processingTime
      });
      
      return alert;
      
    } catch (error) {
      logger.error('Real-time fraud analysis failed:', error);
      throw error;
    }
  }

  private async extractFeatures(transaction: RealTimeTransaction): Promise<any> {
    // Extract features for ML model
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Get user transaction history from Redis
    const userHistory = await this.getUserTransactionHistory(transaction.userId);
    
    // Calculate velocity metrics
    const recentTransactions = userHistory.filter(tx => 
      new Date(tx.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    );
    
    const velocityScore = recentTransactions.length * 10 + 
                         recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / 1000;
    
    return {
      transactionAmount: transaction.amount,
      transactionFrequency: recentTransactions.length,
      timeOfDay: hour,
      dayOfWeek,
      merchantCategory: this.getMerchantCategory(transaction.merchantId),
      userAge: await this.getUserAge(transaction.userId),
      accountAge: await this.getAccountAge(transaction.userId),
      previousFraudHistory: await this.getPreviousFraudScore(transaction.userId),
      velocityScore: Math.min(velocityScore, 100),
      deviceFingerprint: this.getDeviceRisk(transaction.deviceFingerprint),
      geolocationRisk: this.getGeolocationRisk(transaction.geolocation),
      networkRisk: this.getNetworkRisk(transaction.ipAddress)
    };
  }

  private async getUserTransactionHistory(userId: string): Promise<any[]> {
    try {
      const historyKey = `user_tx_history:${userId}`;
      const history = await this.redis.lRange(historyKey, 0, 99); // Last 100 transactions
      return history.map(tx => JSON.parse(tx));
    } catch (error) {
      logger.error('Failed to get user transaction history:', error);
      return [];
    }
  }

  private getMerchantCategory(merchantId?: string): number {
    // Mock merchant category mapping
    const categories: Record<string, number> = {
      'retail': 1,
      'grocery': 2,
      'gas': 3,
      'restaurant': 4,
      'online': 5,
      'gambling': 10, // High risk
      'adult': 15,    // Very high risk
      'crypto': 12    // High risk
    };
    
    // Mock category assignment
    const randomCategory = Object.keys(categories)[Math.floor(Math.random() * Object.keys(categories).length)];
    return categories[randomCategory] || 1;
  }

  private async getUserAge(userId: string): Promise<number> {
    // Mock user age - would query user database
    return Math.floor(Math.random() * 50) + 18;
  }

  private async getAccountAge(userId: string): Promise<number> {
    // Mock account age in days - would query user database
    return Math.floor(Math.random() * 1000) + 1;
  }

  private async getPreviousFraudScore(userId: string): Promise<number> {
    try {
      const fraudKey = `user_fraud_score:${userId}`;
      const score = await this.redis.get(fraudKey);
      return score ? parseFloat(score) : 0;
    } catch (error) {
      return 0;
    }
  }

  private getDeviceRisk(deviceFingerprint?: string): number {
    if (!deviceFingerprint) return 0.7;
    
    // Mock device risk calculation
    const hash = deviceFingerprint.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 100) / 100;
  }

  private getGeolocationRisk(geolocation?: any): number {
    if (!geolocation) return 0.5;
    
    // High-risk countries
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Mock country codes
    if (highRiskCountries.includes(geolocation.country)) return 0.9;
    
    return Math.random() * 0.4; // Low to medium risk
  }

  private getNetworkRisk(ipAddress?: string): number {
    if (!ipAddress) return 0.5;
    
    // Mock IP risk assessment
    const isVPN = Math.random() > 0.8; // 20% chance of VPN
    const isTor = Math.random() > 0.95; // 5% chance of Tor
    
    if (isTor) return 0.9;
    if (isVPN) return 0.6;
    return Math.random() * 0.3;
  }

  private addToHistory(alert: FraudAlert): void {
    this.alertHistory.unshift(alert);
    
    // Keep only the most recent alerts
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(0, this.maxHistorySize);
    }
  }

  private async cacheResult(transactionId: string, alert: FraudAlert): Promise<void> {
    try {
      const cacheKey = `fraud_result:${transactionId}`;
      await this.redis.setEx(cacheKey, 3600, JSON.stringify(alert)); // Cache for 1 hour
    } catch (error) {
      logger.error('Failed to cache fraud result:', error);
    }
  }

  private async updateRealTimeStats(alert: FraudAlert): Promise<void> {
    try {
      const now = new Date();
      const hourKey = `fraud_stats:${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}`;
      
      // Increment counters
      await this.redis.hIncrBy(hourKey, 'total_transactions', 1);
      await this.redis.hIncrBy(hourKey, `${alert.riskLevel.toLowerCase()}_risk`, 1);
      await this.redis.hIncrBy(hourKey, `${alert.recommendation.toLowerCase()}_recommended`, 1);
      
      // Set expiry for 24 hours
      await this.redis.expire(hourKey, 24 * 60 * 60);
      
      // Broadcast updated stats to connected clients
      const stats = await this.getCurrentStats();
      this.io.emit('fraud_stats_update', stats);
      
    } catch (error) {
      logger.error('Failed to update real-time stats:', error);
    }
  }

  private async startBackgroundProcessing(): Promise<void> {
    // Process queued transactions every 100ms
    setInterval(async () => {
      if (this.processingQueue.length > 0) {
        const transaction = this.processingQueue.shift();
        if (transaction) {
          try {
            const result = await this.analyzeTransactionRealTime(transaction);
            this.io.emit('fraud_result', result);
          } catch (error) {
            logger.error('Background processing error:', error);
          }
        }
      }
    }, 100);
    
    // Send periodic statistics updates
    setInterval(async () => {
      try {
        const stats = await this.getCurrentStats();
        this.io.emit('fraud_stats_update', stats);
      } catch (error) {
        logger.error('Failed to send stats update:', error);
      }
    }, 5000); // Every 5 seconds
    
    logger.info('Background processing started');
  }

  async queueTransaction(transaction: RealTimeTransaction): Promise<void> {
    this.processingQueue.push(transaction);
  }

  private getCurrentStats(): any {
    const now = new Date();
    const recentAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > Date.now() - 60 * 60 * 1000 // Last hour
    );
    
    return {
      totalTransactions: this.alertHistory.length,
      recentTransactions: recentAlerts.length,
      highRiskCount: recentAlerts.filter(a => a.riskLevel === 'HIGH').length,
      mediumRiskCount: recentAlerts.filter(a => a.riskLevel === 'MEDIUM').length,
      lowRiskCount: recentAlerts.filter(a => a.riskLevel === 'LOW').length,
      blockedCount: recentAlerts.filter(a => a.recommendation === 'BLOCK').length,
      reviewCount: recentAlerts.filter(a => a.recommendation === 'REVIEW').length,
      approvedCount: recentAlerts.filter(a => a.recommendation === 'APPROVE').length,
      averageProcessingTime: recentAlerts.reduce((sum, a) => sum + a.processingTime, 0) / (recentAlerts.length || 1),
      fraudRate: (recentAlerts.filter(a => a.riskLevel === 'HIGH').length / (recentAlerts.length || 1)) * 100,
      timestamp: now.toISOString()
    };
  }

  async getAlertHistory(limit = 100): Promise<FraudAlert[]> {
    return this.alertHistory.slice(0, limit);
  }

  async getTransactionResult(transactionId: string): Promise<FraudAlert | null> {
    try {
      const cacheKey = `fraud_result:${transactionId}`;
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Failed to get cached result:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }
}
