/**
 * Unit tests for AI Fraud Detection System
 * Tests individual fraud detection models and algorithms
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  VelocityMLModel, 
  BehavioralAnomalyModel, 
  NetworkAnalysisModel,
  AIFraudDetectionEngine,
  type TransactionPattern,
  ML_MODELS
} from '../../app/api/_lib/ai-fraud-detection';

describe('Fraud Detection Models', () => {
  let sampleTransactionPattern: TransactionPattern;

  beforeEach(() => {
    sampleTransactionPattern = {
      userId: 'user-123',
      transactionId: 'tx-456',
      amount: 500,
      currency: 'USD',
      timestamp: new Date(),
      
      userMetrics: {
        accountAge: 90,
        totalTransactions: 50,
        averageTransactionAmount: 200,
        frequentCountries: ['ZW'],
        deviceFingerprints: ['device-1'],
        ipAddresses: ['192.168.1.1'],
      },
      
      context: {
        deviceType: 'mobile',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Android)',
        location: {
          country: 'ZW',
          city: 'Harare',
          timezone: 'Africa/Harare',
        },
        sessionDuration: 10,
      },
      
      financial: {
        timeOfDay: 14,
        dayOfWeek: 2,
        velocityLast24h: 3,
        amountLast24h: 800,
        isNewRecipient: false,
        recipientRiskScore: 20,
        crossBorderIndicator: false,
      },
      
      network: {
        connectionType: 'wifi',
        vpnDetected: false,
        torDetected: false,
        proxyDetected: false,
        geolocationMatch: true,
      },
    };
  });

  describe('VelocityMLModel', () => {
    let velocityModel: VelocityMLModel;

    beforeEach(() => {
      velocityModel = new VelocityMLModel(ML_MODELS.velocity_v1);
    });

    it('should identify high velocity transactions', async () => {
      const highVelocityPattern = {
        ...sampleTransactionPattern,
        financial: {
          ...sampleTransactionPattern.financial,
          velocityLast24h: 15, // High velocity
        },
      };

      const prediction = await velocityModel.predict(highVelocityPattern);

      expect(prediction.riskScore).toBeGreaterThan(25);
      expect(prediction.riskFactors).toContain('high_transaction_velocity');
      expect(prediction.recommendation).not.toBe('allow');
    });

    it('should flag unusual amount patterns', async () => {
      const unusualAmountPattern = {
        ...sampleTransactionPattern,
        amount: 1500, // 7.5x average
      };

      const prediction = await velocityModel.predict(unusualAmountPattern);

      expect(prediction.riskScore).toBeGreaterThan(20);
      expect(prediction.riskFactors).toContain('unusual_amount_pattern');
    });

    it('should detect unusual time patterns', async () => {
      const nightTimePattern = {
        ...sampleTransactionPattern,
        financial: {
          ...sampleTransactionPattern.financial,
          timeOfDay: 3, // 3 AM
        },
      };

      const prediction = await velocityModel.predict(nightTimePattern);

      expect(prediction.riskFactors).toContain('unusual_time_pattern');
    });

    it('should flag new accounts with cross-border transactions', async () => {
      const newAccountCrossBorderPattern = {
        ...sampleTransactionPattern,
        userMetrics: {
          ...sampleTransactionPattern.userMetrics,
          accountAge: 15, // New account
        },
        financial: {
          ...sampleTransactionPattern.financial,
          crossBorderIndicator: true,
        },
      };

      const prediction = await velocityModel.predict(newAccountCrossBorderPattern);

      expect(prediction.riskFactors).toContain('new_account_cross_border');
    });

    it('should allow normal transactions', async () => {
      const normalPattern = sampleTransactionPattern;

      const prediction = await velocityModel.predict(normalPattern);

      expect(prediction.riskScore).toBeLessThan(40);
      expect(prediction.recommendation).toBe('allow');
    });
  });

  describe('BehavioralAnomalyModel', () => {
    let behavioralModel: BehavioralAnomalyModel;

    beforeEach(() => {
      behavioralModel = new BehavioralAnomalyModel(ML_MODELS.behavioral_v1);
    });

    it('should detect new device patterns', async () => {
      const newDevicePattern = {
        ...sampleTransactionPattern,
        userMetrics: {
          ...sampleTransactionPattern.userMetrics,
          deviceFingerprints: ['device-1'], // Only one known device
        },
        context: {
          ...sampleTransactionPattern.context,
          deviceType: 'desktop', // Different from usual mobile
        },
      };

      const prediction = await behavioralModel.predict(newDevicePattern);

      expect(prediction.riskFactors).toContain('new_device_pattern');
    });

    it('should flag geographic anomalies', async () => {
      const geoAnomalyPattern = {
        ...sampleTransactionPattern,
        network: {
          ...sampleTransactionPattern.network,
          geolocationMatch: false,
        },
      };

      const prediction = await behavioralModel.predict(geoAnomalyPattern);

      expect(prediction.riskFactors).toContain('geographic_anomaly');
    });

    it('should detect suspicious networks', async () => {
      const suspiciousNetworkPattern = {
        ...sampleTransactionPattern,
        network: {
          ...sampleTransactionPattern.network,
          vpnDetected: true,
          torDetected: true,
        },
      };

      const prediction = await behavioralModel.predict(suspiciousNetworkPattern);

      expect(prediction.riskFactors).toContain('suspicious_network');
      expect(prediction.riskScore).toBeGreaterThan(30);
    });

    it('should flag rushed transactions', async () => {
      const rushedPattern = {
        ...sampleTransactionPattern,
        context: {
          ...sampleTransactionPattern.context,
          sessionDuration: 1, // Very short session
        },
      };

      const prediction = await behavioralModel.predict(rushedPattern);

      expect(prediction.riskFactors).toContain('rushed_transaction');
    });

    it('should flag large amounts to new recipients', async () => {
      const largeNewRecipientPattern = {
        ...sampleTransactionPattern,
        amount: 2000,
        financial: {
          ...sampleTransactionPattern.financial,
          isNewRecipient: true,
        },
      };

      const prediction = await behavioralModel.predict(largeNewRecipientPattern);

      expect(prediction.riskFactors).toContain('large_amount_new_recipient');
    });
  });

  describe('NetworkAnalysisModel', () => {
    let networkModel: NetworkAnalysisModel;

    beforeEach(() => {
      networkModel = new NetworkAnalysisModel(ML_MODELS.network_v1);
    });

    it('should detect VPN usage', async () => {
      const vpnPattern = {
        ...sampleTransactionPattern,
        network: {
          ...sampleTransactionPattern.network,
          vpnDetected: true,
          connectionType: 'vpn' as const,
        },
      };

      const prediction = await networkModel.predict(vpnPattern);

      expect(prediction.riskFactors).toContain('vpn_usage');
    });

    it('should flag Tor network usage', async () => {
      const torPattern = {
        ...sampleTransactionPattern,
        network: {
          ...sampleTransactionPattern.network,
          torDetected: true,
        },
      };

      const prediction = await networkModel.predict(torPattern);

      expect(prediction.riskFactors).toContain('tor_network_usage');
      expect(prediction.riskScore).toBeGreaterThan(35);
    });

    it('should detect excessive country hopping', async () => {
      const countryHoppingPattern = {
        ...sampleTransactionPattern,
        userMetrics: {
          ...sampleTransactionPattern.userMetrics,
          frequentCountries: ['ZW', 'ZA', 'US', 'UK'],
          accountAge: 60, // Young account with many countries
        },
      };

      const prediction = await networkModel.predict(countryHoppingPattern);

      expect(prediction.riskFactors).toContain('excessive_country_hopping');
    });
  });

  describe('AIFraudDetectionEngine', () => {
    let fraudEngine: AIFraudDetectionEngine;

    beforeEach(() => {
      fraudEngine = new AIFraudDetectionEngine();
    });

    it('should assess transaction with multiple models', async () => {
      const assessment = await fraudEngine.assessTransaction(sampleTransactionPattern);

      expect(assessment.transactionId).toBe(sampleTransactionPattern.transactionId);
      expect(assessment.predictions).toHaveLength(3); // Three models
      expect(assessment.overallRiskScore).toBeGreaterThanOrEqual(0);
      expect(assessment.overallRiskScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(assessment.riskLevel);
      expect(['allow', 'review', 'block']).toContain(assessment.finalRecommendation);
    });

    it('should block high-risk transactions', async () => {
      const highRiskPattern = {
        ...sampleTransactionPattern,
        amount: 5000, // Large amount
        userMetrics: {
          ...sampleTransactionPattern.userMetrics,
          accountAge: 5, // Very new account
        },
        financial: {
          ...sampleTransactionPattern.financial,
          velocityLast24h: 20, // High velocity
          isNewRecipient: true,
          crossBorderIndicator: true,
        },
        network: {
          ...sampleTransactionPattern.network,
          vpnDetected: true,
          torDetected: true,
          geolocationMatch: false,
        },
      };

      const assessment = await fraudEngine.assessTransaction(highRiskPattern);

      expect(assessment.riskLevel).toBe('critical');
      expect(assessment.finalRecommendation).toBe('block');
    });

    it('should allow low-risk transactions', async () => {
      const lowRiskPattern = {
        ...sampleTransactionPattern,
        amount: 50, // Small amount
        userMetrics: {
          ...sampleTransactionPattern.userMetrics,
          accountAge: 365, // Old account
          totalTransactions: 200,
        },
        financial: {
          ...sampleTransactionPattern.financial,
          velocityLast24h: 1,
          isNewRecipient: false,
          recipientRiskScore: 10,
        },
      };

      const assessment = await fraudEngine.assessTransaction(lowRiskPattern);

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.finalRecommendation).toBe('allow');
    });

    it('should provide processing time metrics', async () => {
      const assessment = await fraudEngine.assessTransaction(sampleTransactionPattern);

      expect(assessment.processingTime).toBeGreaterThan(0);
      expect(assessment.processingTime).toBeLessThan(5000); // Should be fast
    });

    it('should provide explanations for risk factors', async () => {
      const assessment = await fraudEngine.assessTransaction(sampleTransactionPattern);

      expect(Array.isArray(assessment.explanations)).toBe(true);
      if (assessment.explanations.length > 0) {
        expect(typeof assessment.explanations[0]).toBe('string');
      }
    });
  });

  describe('Risk Level Calculation', () => {
    it('should correctly categorize risk levels', () => {
      expect(new AIFraudDetectionEngine()['getRiskLevel'](10)).toBe('low');
      expect(new AIFraudDetectionEngine()['getRiskLevel'](40)).toBe('medium');
      expect(new AIFraudDetectionEngine()['getRiskLevel'](70)).toBe('high');
      expect(new AIFraudDetectionEngine()['getRiskLevel'](90)).toBe('critical');
    });
  });

  describe('Model Performance Monitoring', () => {
    let fraudEngine: AIFraudDetectionEngine;

    beforeEach(() => {
      fraudEngine = new AIFraudDetectionEngine();
    });

    it('should return model performance metrics', () => {
      const metrics = fraudEngine.getModelPerformanceMetrics();

      expect(Object.keys(metrics)).toContain('velocity_v1');
      expect(Object.keys(metrics)).toContain('behavioral_v1');
      expect(Object.keys(metrics)).toContain('network_v1');

      Object.values(metrics).forEach((metric: any) => {
        expect(metric).toHaveProperty('modelInfo');
        expect(metric).toHaveProperty('isActive');
        expect(metric).toHaveProperty('lastPrediction');
      });
    });
  });
});
