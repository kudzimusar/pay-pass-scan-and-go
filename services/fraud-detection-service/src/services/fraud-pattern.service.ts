import express, { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

export class FraudPatternService {
  public router = express.Router();
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
    this.setupRoutes();
  }

  private setupRoutes() {
    this.router.post('/analyze', this.analyzePatterns.bind(this));
    this.router.get('/patterns', this.getKnownPatterns.bind(this));
    this.router.post('/patterns', this.addPattern.bind(this));
    this.router.put('/patterns/:id', this.updatePattern.bind(this));
    this.router.delete('/patterns/:id', this.deletePattern.bind(this));
    this.router.get('/statistics', this.getPatternStatistics.bind(this));
  }

  private async analyzePatterns(req: Request, res: Response): Promise<void> {
    try {
      const { transaction, userProfile, historicalData } = req.body;

      const patternAnalysis = await this.performPatternAnalysis(
        transaction,
        userProfile,
        historicalData
      );

      res.json({
        success: true,
        data: patternAnalysis,
      });
    } catch (error) {
      logger.error('Error in pattern analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze patterns',
      });
    }
  }

  private async performPatternAnalysis(
    transaction: any,
    userProfile: any,
    historicalData: any
  ): Promise<any> {
    const patterns = await this.getKnownFraudPatterns();
    const matchedPatterns = this.matchPatterns(transaction, patterns);
    const userPatterns = this.analyzeUserPatterns(transaction, userProfile, historicalData);
    const riskScore = this.calculatePatternRiskScore(matchedPatterns, userPatterns);

    return {
      transactionId: transaction.id,
      matchedPatterns,
      userPatterns,
      riskScore,
      riskLevel: this.getRiskLevel(riskScore),
      recommendations: this.generatePatternRecommendations(matchedPatterns, userPatterns),
      timestamp: new Date().toISOString(),
    };
  }

  private async getKnownFraudPatterns(): Promise<any[]> {
    // Mock known fraud patterns - in real implementation, this would come from a database
    return [
      {
        id: 'pattern_001',
        name: 'Card Testing',
        description: 'Multiple small transactions to test card validity',
        indicators: ['small_amounts', 'rapid_frequency', 'multiple_merchants'],
        riskScore: 0.8,
        rules: [
          { field: 'amount', operator: '<', value: 10 },
          { field: 'frequency', operator: '>', value: 5 },
          { field: 'timeWindow', operator: '<', value: 3600 }, // 1 hour
        ],
      },
      {
        id: 'pattern_002',
        name: 'Account Takeover',
        description: 'Unusual activity after account access from new location',
        indicators: ['new_location', 'high_value', 'unusual_time'],
        riskScore: 0.9,
        rules: [
          { field: 'locationChange', operator: '==', value: true },
          { field: 'amount', operator: '>', value: 1000 },
          { field: 'hour', operator: '<', value: 6 },
        ],
      },
      {
        id: 'pattern_003',
        name: 'Money Laundering',
        description: 'Structured transactions to avoid reporting thresholds',
        indicators: ['structured_amounts', 'multiple_accounts', 'rapid_transfers'],
        riskScore: 0.85,
        rules: [
          { field: 'amount', operator: '<', value: 10000 },
          { field: 'frequency', operator: '>', value: 3 },
          { field: 'recipientVariety', operator: '>', value: 2 },
        ],
      },
      {
        id: 'pattern_004',
        name: 'Phishing Response',
        description: 'Transaction following suspicious login activity',
        indicators: ['suspicious_login', 'immediate_transaction', 'new_recipient'],
        riskScore: 0.75,
        rules: [
          { field: 'suspiciousLogin', operator: '==', value: true },
          { field: 'timeSinceLogin', operator: '<', value: 300 }, // 5 minutes
          { field: 'newRecipient', operator: '==', value: true },
        ],
      },
      {
        id: 'pattern_005',
        name: 'Velocity Fraud',
        description: 'Unusually high transaction velocity',
        indicators: ['high_velocity', 'multiple_currencies', 'geographic_spread'],
        riskScore: 0.7,
        rules: [
          { field: 'transactionsPerHour', operator: '>', value: 10 },
          { field: 'currencyCount', operator: '>', value: 2 },
          { field: 'countryCount', operator: '>', value: 1 },
        ],
      },
    ];
  }

  private matchPatterns(transaction: any, patterns: any[]): any[] {
    const matchedPatterns: any[] = [];

    for (const pattern of patterns) {
      const matchScore = this.calculatePatternMatch(transaction, pattern);
      if (matchScore > 0.6) { // Threshold for pattern matching
        matchedPatterns.push({
          patternId: pattern.id,
          patternName: pattern.name,
          matchScore,
          riskScore: pattern.riskScore,
          indicators: this.getMatchedIndicators(transaction, pattern),
        });
      }
    }

    return matchedPatterns.sort((a, b) => b.matchScore - a.matchScore);
  }

  private calculatePatternMatch(transaction: any, pattern: any): number {
    let matchScore = 0;
    let totalRules = pattern.rules.length;

    for (const rule of pattern.rules) {
      if (this.evaluateRule(transaction, rule)) {
        matchScore += 1;
      }
    }

    return matchScore / totalRules;
  }

  private evaluateRule(transaction: any, rule: any): boolean {
    const { field, operator, value } = rule;

    switch (field) {
      case 'amount':
        return this.compareValues(transaction.amount, operator, value);
      case 'frequency':
        // This would need historical data to evaluate
        return false;
      case 'timeWindow':
        // This would need historical data to evaluate
        return false;
      case 'locationChange':
        // This would need user profile data to evaluate
        return false;
      case 'hour':
        const hour = new Date(transaction.timestamp).getHours();
        return this.compareValues(hour, operator, value);
      case 'suspiciousLogin':
        // This would need security data to evaluate
        return false;
      case 'timeSinceLogin':
        // This would need security data to evaluate
        return false;
      case 'newRecipient':
        // This would need historical data to evaluate
        return false;
      case 'transactionsPerHour':
        // This would need historical data to evaluate
        return false;
      case 'currencyCount':
        // This would need historical data to evaluate
        return false;
      case 'countryCount':
        // This would need historical data to evaluate
        return false;
      default:
        return false;
    }
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '<':
        return actual < expected;
      case '<=':
        return actual <= expected;
      case '>':
        return actual > expected;
      case '>=':
        return actual >= expected;
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      default:
        return false;
    }
  }

  private getMatchedIndicators(transaction: any, pattern: any): string[] {
    const matchedIndicators: string[] = [];

    for (const indicator of pattern.indicators) {
      if (this.checkIndicator(transaction, indicator)) {
        matchedIndicators.push(indicator);
      }
    }

    return matchedIndicators;
  }

  private checkIndicator(transaction: any, indicator: string): boolean {
    switch (indicator) {
      case 'small_amounts':
        return transaction.amount < 10;
      case 'rapid_frequency':
        // Would need historical data
        return false;
      case 'multiple_merchants':
        // Would need historical data
        return false;
      case 'new_location':
        // Would need user profile data
        return false;
      case 'high_value':
        return transaction.amount > 1000;
      case 'unusual_time':
        const hour = new Date(transaction.timestamp).getHours();
        return hour < 6 || hour > 23;
      case 'structured_amounts':
        // Would need historical data
        return false;
      case 'multiple_accounts':
        // Would need historical data
        return false;
      case 'rapid_transfers':
        // Would need historical data
        return false;
      case 'suspicious_login':
        // Would need security data
        return false;
      case 'immediate_transaction':
        // Would need security data
        return false;
      case 'new_recipient':
        // Would need historical data
        return false;
      case 'high_velocity':
        // Would need historical data
        return false;
      case 'multiple_currencies':
        // Would need historical data
        return false;
      case 'geographic_spread':
        // Would need historical data
        return false;
      default:
        return false;
    }
  }

  private analyzeUserPatterns(
    transaction: any,
    userProfile: any,
    historicalData: any
  ): any {
    if (!historicalData || !historicalData.transactions) {
      return {
        hasHistory: false,
        patterns: [],
        riskFactors: [],
      };
    }

    const transactions = historicalData.transactions;
    const patterns = this.extractUserPatterns(transactions, transaction);
    const riskFactors = this.identifyRiskFactors(transactions, transaction);

    return {
      hasHistory: true,
      patterns,
      riskFactors,
      transactionCount: transactions.length,
      averageAmount: this.calculateAverageAmount(transactions),
      usualTimes: this.getUsualTransactionTimes(transactions),
      usualLocations: this.getUsualLocations(transactions),
    };
  }

  private extractUserPatterns(transactions: any[], currentTransaction: any): any[] {
    const patterns: any[] = [];

    // Amount pattern
    const amounts = transactions.map(tx => tx.amount);
    const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const amountDeviation = Math.abs(currentTransaction.amount - avgAmount) / avgAmount;

    if (amountDeviation > 2) {
      patterns.push({
        type: 'amount_deviation',
        severity: 'high',
        description: `Amount deviates ${(amountDeviation * 100).toFixed(1)}% from average`,
        value: amountDeviation,
      });
    }

    // Time pattern
    const hours = transactions.map(tx => new Date(tx.timestamp).getHours());
    const currentHour = new Date(currentTransaction.timestamp).getHours();
    const hourFrequency = hours.filter(h => h === currentHour).length / hours.length;

    if (hourFrequency < 0.1) {
      patterns.push({
        type: 'unusual_time',
        severity: 'medium',
        description: `Transaction at unusual hour (${currentHour}:00)`,
        value: currentHour,
        frequency: hourFrequency,
      });
    }

    // Frequency pattern
    const recentTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
    });

    if (recentTransactions.length > 10) {
      patterns.push({
        type: 'high_frequency',
        severity: 'medium',
        description: `High transaction frequency: ${recentTransactions.length} in 24 hours`,
        value: recentTransactions.length,
      });
    }

    return patterns;
  }

  private identifyRiskFactors(transactions: any[], currentTransaction: any): string[] {
    const riskFactors: string[] = [];

    // Check for recent failed transactions
    const recentFailures = transactions.filter(tx => 
      tx.status === 'failed' && 
      (Date.now() - new Date(tx.timestamp).getTime()) < 24 * 60 * 60 * 1000
    );

    if (recentFailures.length > 2) {
      riskFactors.push('recent_failures');
    }

    // Check for chargeback history
    const chargebacks = transactions.filter(tx => tx.status === 'chargeback');
    if (chargebacks.length > 0) {
      riskFactors.push('chargeback_history');
    }

    // Check for account age
    const firstTransaction = transactions[0];
    if (firstTransaction) {
      const accountAge = (Date.now() - new Date(firstTransaction.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAge < 7) {
        riskFactors.push('new_account');
      }
    }

    return riskFactors;
  }

  private calculateAverageAmount(transactions: any[]): number {
    const amounts = transactions.map(tx => tx.amount);
    return amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  }

  private getUsualTransactionTimes(transactions: any[]): any {
    const hours = transactions.map(tx => new Date(tx.timestamp).getHours());
    const hourCounts: { [key: number]: number } = {};

    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return hourCounts;
  }

  private getUsualLocations(transactions: any[]): any {
    const locations = transactions
      .filter(tx => tx.location?.country)
      .map(tx => tx.location.country);
    
    const locationCounts: { [key: string]: number } = {};

    locations.forEach(location => {
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });

    return locationCounts;
  }

  private calculatePatternRiskScore(matchedPatterns: any[], userPatterns: any): number {
    let riskScore = 0;

    // Pattern-based risk
    for (const pattern of matchedPatterns) {
      riskScore += pattern.riskScore * pattern.matchScore;
    }

    // User pattern risk
    if (userPatterns.patterns) {
      for (const pattern of userPatterns.patterns) {
        if (pattern.severity === 'high') {
          riskScore += 0.3;
        } else if (pattern.severity === 'medium') {
          riskScore += 0.2;
        }
      }
    }

    // Risk factors
    if (userPatterns.riskFactors) {
      riskScore += userPatterns.riskFactors.length * 0.1;
    }

    return Math.min(riskScore, 1.0);
  }

  private getRiskLevel(riskScore: number): string {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    if (riskScore >= 0.2) return 'low';
    return 'minimal';
  }

  private generatePatternRecommendations(matchedPatterns: any[], userPatterns: any): string[] {
    const recommendations: string[] = [];

    if (matchedPatterns.length > 0) {
      recommendations.push(`Matched ${matchedPatterns.length} fraud patterns - review required`);
      
      for (const pattern of matchedPatterns.slice(0, 3)) {
        recommendations.push(`Pattern "${pattern.patternName}" detected (${(pattern.matchScore * 100).toFixed(1)}% match)`);
      }
    }

    if (userPatterns.patterns) {
      for (const pattern of userPatterns.patterns) {
        if (pattern.severity === 'high') {
          recommendations.push(`High-risk user pattern: ${pattern.description}`);
        }
      }
    }

    if (userPatterns.riskFactors && userPatterns.riskFactors.length > 0) {
      recommendations.push(`User has ${userPatterns.riskFactors.length} risk factors`);
    }

    if (recommendations.length === 0) {
      recommendations.push('No suspicious patterns detected');
    }

    return recommendations;
  }

  private async getKnownPatterns(req: Request, res: Response): Promise<void> {
    try {
      const patterns = await this.getKnownFraudPatterns();

      res.json({
        success: true,
        data: patterns,
      });
    } catch (error) {
      logger.error('Error getting known patterns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get known patterns',
      });
    }
  }

  private async addPattern(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, indicators, riskScore, rules } = req.body;

      // Mock pattern addition
      const newPattern = {
        id: `pattern_${Date.now()}`,
        name,
        description,
        indicators,
        riskScore,
        rules,
        createdAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: newPattern,
        message: 'Fraud pattern added successfully',
      });
    } catch (error) {
      logger.error('Error adding pattern:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add pattern',
      });
    }
  }

  private async updatePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Mock pattern update
      const updatedPattern = {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        data: updatedPattern,
        message: 'Fraud pattern updated successfully',
      });
    } catch (error) {
      logger.error('Error updating pattern:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update pattern',
      });
    }
  }

  private async deletePattern(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Mock pattern deletion
      res.json({
        success: true,
        message: `Fraud pattern ${id} deleted successfully`,
      });
    } catch (error) {
      logger.error('Error deleting pattern:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete pattern',
      });
    }
  }

  private async getPatternStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.calculatePatternStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting pattern statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pattern statistics',
      });
    }
  }

  private async calculatePatternStatistics(): Promise<any> {
    // Mock pattern statistics
    return {
      totalPatterns: 15,
      activePatterns: 12,
      patternMatches: 234,
      averageMatchScore: 0.76,
      topPatterns: [
        { name: 'Card Testing', matches: 45, successRate: 0.89 },
        { name: 'Account Takeover', matches: 32, successRate: 0.94 },
        { name: 'Money Laundering', matches: 28, successRate: 0.82 },
      ],
      patternEffectiveness: {
        high: 0.92,
        medium: 0.78,
        low: 0.65,
      },
    };
  }
}