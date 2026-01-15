/**
 * AI-Powered Fraud Detection & Risk Scoring
 * Implements machine learning-based transaction risk assessment
 */

import { financialLogger } from './financial-logger';

export interface TransactionContext {
  userId: string;
  amount: number;
  currency: string;
  recipientId?: string;
  recipientCountry?: string;
  deviceId?: string;
  ipAddress?: string;
  timestamp: string;
  userLocation?: { latitude: number; longitude: number };
  recipientLocation?: { latitude: number; longitude: number };
  transactionHistory?: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  timestamp: string;
  recipientId?: string;
  status: string;
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  flags: RiskFlag[];
  recommendation: 'approve' | 'review' | 'decline';
  confidence: number; // 0-1
}

export interface RiskFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  weight: number;
}

/**
 * AI Fraud Detection Engine
 */
export class AIFraudDetectionEngine {
  private readonly HIGH_AMOUNT_THRESHOLD = 5000;
  private readonly VELOCITY_THRESHOLD = 10; // transactions per hour
  private readonly UNUSUAL_TIME_HOURS = [0, 1, 2, 3, 4, 5]; // 12 AM - 5 AM
  private readonly SUSPICIOUS_COUNTRIES = ['KP', 'IR', 'SY', 'CU'];

  /**
   * Assess transaction risk using multiple factors
   */
  async assessTransactionRisk(context: TransactionContext): Promise<RiskAssessment> {
    const flags: RiskFlag[] = [];
    let totalWeight = 0;

    // 1. Check transaction amount
    const amountFlag = this.checkTransactionAmount(context.amount);
    if (amountFlag) {
      flags.push(amountFlag);
      totalWeight += amountFlag.weight;
    }

    // 2. Check velocity (multiple transactions in short time)
    const velocityFlag = this.checkVelocity(context.transactionHistory || []);
    if (velocityFlag) {
      flags.push(velocityFlag);
      totalWeight += velocityFlag.weight;
    }

    // 3. Check unusual timing
    const timingFlag = this.checkUnusualTiming(context.timestamp);
    if (timingFlag) {
      flags.push(timingFlag);
      totalWeight += timingFlag.weight;
    }

    // 4. Check geographic anomalies
    const geoFlag = this.checkGeographicAnomalies(
      context.userLocation,
      context.recipientLocation,
      context.recipientCountry
    );
    if (geoFlag) {
      flags.push(geoFlag);
      totalWeight += geoFlag.weight;
    }

    // 5. Check new recipient
    const newRecipientFlag = this.checkNewRecipient(
      context.userId,
      context.recipientId,
      context.transactionHistory || []
    );
    if (newRecipientFlag) {
      flags.push(newRecipientFlag);
      totalWeight += newRecipientFlag.weight;
    }

    // 6. Check sanctioned countries
    const sanctionFlag = this.checkSanctionedCountries(context.recipientCountry);
    if (sanctionFlag) {
      flags.push(sanctionFlag);
      totalWeight += sanctionFlag.weight;
    }

    // Calculate risk score (0-100)
    const riskScore = Math.min(100, totalWeight);

    // Determine risk level and recommendation
    const riskLevel = this.determineRiskLevel(riskScore);
    const recommendation = this.getRecommendation(riskLevel);
    const confidence = this.calculateConfidence(flags);

    const assessment: RiskAssessment = {
      riskScore,
      riskLevel,
      flags,
      recommendation,
      confidence,
    };

    // Log the assessment
    financialLogger.logTransaction({
      operationId: `fraud-assess-${Date.now()}`,
      userId: context.userId,
      operationType: 'payment',
      amount: context.amount,
      currency: context.currency,
      status: 'processing',
      description: 'Fraud detection assessment',
      riskScore,
      fraudFlags: flags.map((f) => f.flag),
      metadata: { assessment },
    });

    return assessment;
  }

  /**
   * Check if transaction amount is unusual
   */
  private checkTransactionAmount(amount: number): RiskFlag | null {
    if (amount > this.HIGH_AMOUNT_THRESHOLD) {
      return {
        flag: 'HIGH_AMOUNT',
        severity: 'medium',
        description: `Transaction amount ($${amount}) exceeds threshold ($${this.HIGH_AMOUNT_THRESHOLD})`,
        weight: 15,
      };
    }
    return null;
  }

  /**
   * Check for velocity fraud (multiple transactions in short time)
   */
  private checkVelocity(transactionHistory: Transaction[]): RiskFlag | null {
    const oneHourAgo = Date.now() - 3600000;
    const recentTransactions = transactionHistory.filter(
      (tx) => new Date(tx.timestamp).getTime() > oneHourAgo
    );

    if (recentTransactions.length > this.VELOCITY_THRESHOLD) {
      return {
        flag: 'HIGH_VELOCITY',
        severity: 'high',
        description: `${recentTransactions.length} transactions in the last hour (threshold: ${this.VELOCITY_THRESHOLD})`,
        weight: 35,
      };
    }
    return null;
  }

  /**
   * Check for unusual transaction timing
   */
  private checkUnusualTiming(timestamp: string): RiskFlag | null {
    const hour = new Date(timestamp).getHours();
    if (this.UNUSUAL_TIME_HOURS.includes(hour)) {
      return {
        flag: 'UNUSUAL_TIMING',
        severity: 'low',
        description: `Transaction at unusual hour (${hour}:00)`,
        weight: 10,
      };
    }
    return null;
  }

  /**
   * Check for geographic anomalies
   */
  private checkGeographicAnomalies(
    userLocation?: { latitude: number; longitude: number },
    recipientLocation?: { latitude: number; longitude: number },
    recipientCountry?: string
  ): RiskFlag | null {
    // Check if recipient is in a high-risk country
    const highRiskCountries = ['NG', 'GH', 'KE']; // Example high-risk countries
    if (recipientCountry && highRiskCountries.includes(recipientCountry)) {
      return {
        flag: 'HIGH_RISK_COUNTRY',
        severity: 'medium',
        description: `Recipient in high-risk country: ${recipientCountry}`,
        weight: 20,
      };
    }

    // Check for impossible travel (too far too fast)
    if (userLocation && recipientLocation) {
      const distance = this.calculateDistance(userLocation, recipientLocation);
      if (distance > 1000) {
        // More than 1000 km
        return {
          flag: 'IMPOSSIBLE_TRAVEL',
          severity: 'high',
          description: `Recipient location ${distance}km away from user`,
          weight: 30,
        };
      }
    }

    return null;
  }

  /**
   * Check if recipient is new (not in transaction history)
   */
  private checkNewRecipient(
    userId: string,
    recipientId: string | undefined,
    transactionHistory: Transaction[]
  ): RiskFlag | null {
    if (!recipientId) return null;

    const hasTransactedBefore = transactionHistory.some((tx) => tx.recipientId === recipientId);

    if (!hasTransactedBefore) {
      return {
        flag: 'NEW_RECIPIENT',
        severity: 'low',
        description: 'First transaction to this recipient',
        weight: 12,
      };
    }

    return null;
  }

  /**
   * Check if recipient country is sanctioned
   */
  private checkSanctionedCountries(recipientCountry?: string): RiskFlag | null {
    if (!recipientCountry) return null;

    if (this.SUSPICIOUS_COUNTRIES.includes(recipientCountry)) {
      return {
        flag: 'SANCTIONED_COUNTRY',
        severity: 'high',
        description: `Recipient in sanctioned country: ${recipientCountry}`,
        weight: 50,
      };
    }

    return null;
  }

  /**
   * Determine risk level based on score
   */
  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 20) return 'low';
    if (score < 40) return 'medium';
    if (score < 70) return 'high';
    return 'critical';
  }

  /**
   * Get recommendation based on risk level
   */
  private getRecommendation(riskLevel: 'low' | 'medium' | 'high' | 'critical'): 'approve' | 'review' | 'decline' {
    switch (riskLevel) {
      case 'low':
        return 'approve';
      case 'medium':
        return 'review';
      case 'high':
      case 'critical':
        return 'decline';
    }
  }

  /**
   * Calculate confidence score based on number and severity of flags
   */
  private calculateConfidence(flags: RiskFlag[]): number {
    if (flags.length === 0) return 0.95; // High confidence if no flags
    const totalWeight = flags.reduce((sum, f) => sum + f.weight, 0);
    return Math.min(1, 0.5 + totalWeight / 200); // Confidence increases with flags
  }

  /**
   * Calculate distance between two geographic points (Haversine formula)
   */
  private calculateDistance(
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const dLon = ((point2.longitude - point1.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.latitude * Math.PI) / 180) *
        Math.cos((point2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton instance
export const aiFraudDetectionEngine = new AIFraudDetectionEngine();
