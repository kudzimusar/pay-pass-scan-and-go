import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for fraud detection request
const fraudDetectionSchema = z.object({
  transactionId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  merchantId: z.string().optional(),
  merchantCategory: z.string().optional(),
  deviceId: z.string().optional(),
  ipAddress: z.string().optional(),
  geolocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    country: z.string(),
    city: z.string().optional()
  }).optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime().optional()
});

const batchFraudDetectionSchema = z.object({
  transactions: z.array(fraudDetectionSchema),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

// Mock fraud detection engine - replace with actual ML service calls
const analyzeTransaction = async (transaction: any) => {
  const {
    transactionId,
    userId,
    amount,
    currency,
    merchantCategory,
    deviceId,
    ipAddress,
    geolocation
  } = transaction;

  // Calculate risk factors
  const riskFactors = {
    amountRisk: calculateAmountRisk(amount, currency),
    velocityRisk: await calculateVelocityRisk(userId),
    deviceRisk: calculateDeviceRisk(deviceId),
    geoRisk: calculateGeolocationRisk(geolocation),
    timeRisk: calculateTimeRisk(),
    merchantRisk: calculateMerchantRisk(merchantCategory),
    behaviorRisk: await calculateBehaviorRisk(userId)
  };

  // Calculate overall risk score
  const overallRiskScore = Object.values(riskFactors).reduce((sum, risk) => sum + risk, 0) / Object.keys(riskFactors).length;
  
  // Determine fraud probability using ML model (mocked)
  const fraudProbability = await mockMLPrediction(riskFactors);
  
  // Generate risk assessment
  const riskLevel = fraudProbability > 0.8 ? 'HIGH' : 
                   fraudProbability > 0.5 ? 'MEDIUM' : 'LOW';
  
  const recommendation = fraudProbability > 0.8 ? 'BLOCK' :
                        fraudProbability > 0.5 ? 'REVIEW' : 'APPROVE';

  // Generate explanations
  const explanations = generateExplanations(riskFactors, fraudProbability);
  
  return {
    transactionId,
    fraudProbability: Math.round(fraudProbability * 100) / 100,
    riskScore: Math.round(overallRiskScore * 100) / 100,
    riskLevel,
    recommendation,
    riskFactors,
    explanations,
    confidence: Math.round((Math.max(fraudProbability, 1 - fraudProbability)) * 100) / 100,
    processingTime: Math.round(Math.random() * 100 + 50), // ms
    modelVersion: '2.1.0',
    timestamp: new Date().toISOString()
  };
};

const calculateAmountRisk = (amount: number, currency: string): number => {
  // Convert to USD equivalent for standardization
  const exchangeRates: Record<string, number> = {
    USD: 1.0,
    EUR: 1.1,
    GBP: 1.25,
    ZWL: 0.003,
    ZAR: 0.055
  };
  
  const usdAmount = amount * (exchangeRates[currency] || 1.0);
  
  if (usdAmount > 10000) return 0.9;
  if (usdAmount > 5000) return 0.7;
  if (usdAmount > 1000) return 0.5;
  if (usdAmount > 100) return 0.3;
  return 0.1;
};

const calculateVelocityRisk = async (userId: string): Promise<number> => {
  // Mock velocity calculation - would query real transaction history
  const mockTransactionCount = Math.floor(Math.random() * 20);
  const mockAmountSum = Math.random() * 50000;
  
  if (mockTransactionCount > 15 || mockAmountSum > 25000) return 0.8;
  if (mockTransactionCount > 10 || mockAmountSum > 10000) return 0.6;
  if (mockTransactionCount > 5 || mockAmountSum > 5000) return 0.4;
  return 0.2;
};

const calculateDeviceRisk = (deviceId?: string): number => {
  if (!deviceId) return 0.7; // Unknown device = higher risk
  
  // Mock device reputation check
  const deviceReputation = Math.random();
  return 1 - deviceReputation;
};

const calculateGeolocationRisk = (geolocation?: any): number => {
  if (!geolocation) return 0.5;
  
  // High-risk countries (mock data)
  const highRiskCountries = ['XX', 'YY', 'ZZ']; // Mock country codes
  if (highRiskCountries.includes(geolocation.country)) return 0.9;
  
  // Distance-based risk (mock calculation)
  const distanceRisk = Math.random() * 0.5;
  return distanceRisk;
};

const calculateTimeRisk = (): number => {
  const hour = new Date().getHours();
  // Higher risk during unusual hours
  if (hour < 6 || hour > 22) return 0.6;
  return 0.2;
};

const calculateMerchantRisk = (merchantCategory?: string): number => {
  const highRiskCategories = ['gambling', 'adult', 'cryptocurrency', 'money_transfer'];
  if (merchantCategory && highRiskCategories.includes(merchantCategory)) return 0.8;
  return 0.3;
};

const calculateBehaviorRisk = async (userId: string): Promise<number> => {
  // Mock behavioral analysis
  const userProfile = {
    avgTransactionAmount: Math.random() * 1000,
    avgTransactionFrequency: Math.random() * 10,
    preferredMerchants: ['merchant1', 'merchant2'],
    preferredTimes: [9, 10, 11, 14, 15, 16, 17, 18, 19]
  };
  
  // Calculate deviation from normal behavior
  const deviationScore = Math.random() * 0.8;
  return deviationScore;
};

const mockMLPrediction = async (riskFactors: Record<string, number>): Promise<number> => {
  // Mock ML model prediction
  const weights = {
    amountRisk: 0.2,
    velocityRisk: 0.25,
    deviceRisk: 0.15,
    geoRisk: 0.15,
    timeRisk: 0.1,
    merchantRisk: 0.1,
    behaviorRisk: 0.05
  };
  
  let prediction = 0;
  Object.entries(riskFactors).forEach(([factor, value]) => {
    prediction += value * (weights[factor as keyof typeof weights] || 0.1);
  });
  
  // Add some ML model uncertainty
  prediction += (Math.random() - 0.5) * 0.1;
  
  return Math.max(0, Math.min(1, prediction));
};

const generateExplanations = (riskFactors: Record<string, number>, fraudProbability: number): string[] => {
  const explanations: string[] = [];
  
  if (riskFactors.amountRisk > 0.7) {
    explanations.push('High transaction amount detected');
  }
  
  if (riskFactors.velocityRisk > 0.6) {
    explanations.push('Unusual transaction velocity pattern');
  }
  
  if (riskFactors.deviceRisk > 0.7) {
    explanations.push('Unknown or suspicious device');
  }
  
  if (riskFactors.geoRisk > 0.7) {
    explanations.push('High-risk geographic location');
  }
  
  if (riskFactors.timeRisk > 0.5) {
    explanations.push('Transaction made during unusual hours');
  }
  
  if (riskFactors.merchantRisk > 0.6) {
    explanations.push('High-risk merchant category');
  }
  
  if (riskFactors.behaviorRisk > 0.6) {
    explanations.push('Deviation from normal user behavior');
  }
  
  if (fraudProbability > 0.8) {
    explanations.push('Multiple high-risk factors detected');
  } else if (fraudProbability < 0.3) {
    explanations.push('Transaction matches normal user behavior');
  }
  
  return explanations;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's a batch request
    const isBatch = Array.isArray(body.transactions);
    
    if (isBatch) {
      // Validate batch request
      const validation = batchFraudDetectionSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid batch request format',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }
      
      const { transactions, priority } = validation.data;
      
      // Process batch transactions
      const results = await Promise.all(
        transactions.map(transaction => analyzeTransaction(transaction))
      );
      
      // Calculate batch statistics
      const batchStats = {
        total: results.length,
        highRisk: results.filter(r => r.riskLevel === 'HIGH').length,
        mediumRisk: results.filter(r => r.riskLevel === 'MEDIUM').length,
        lowRisk: results.filter(r => r.riskLevel === 'LOW').length,
        blocked: results.filter(r => r.recommendation === 'BLOCK').length,
        approved: results.filter(r => r.recommendation === 'APPROVE').length,
        review: results.filter(r => r.recommendation === 'REVIEW').length,
        averageFraudProbability: results.reduce((sum, r) => sum + r.fraudProbability, 0) / results.length
      };
      
      return NextResponse.json({
        success: true,
        batchId: `batch_${Date.now()}`,
        priority,
        statistics: batchStats,
        results,
        processingTime: Math.round(Math.random() * 500 + 200), // ms
        timestamp: new Date().toISOString()
      });
      
    } else {
      // Validate single transaction request
      const validation = fraudDetectionSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid transaction format',
            details: validation.error.errors
          },
          { status: 400 }
        );
      }
      
      // Analyze single transaction
      const result = await analyzeTransaction(validation.data);
      
      return NextResponse.json({
        success: true,
        ...result
      });
    }
    
  } catch (error) {
    console.error('Fraud detection error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fraud detection service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const userId = searchParams.get('userId');
    const timeRange = searchParams.get('timeRange') || '24h';
    
    if (transactionId) {
      // Get specific transaction fraud analysis
      const mockResult = {
        transactionId,
        fraudProbability: Math.random(),
        riskLevel: Math.random() > 0.5 ? 'LOW' : 'MEDIUM',
        recommendation: 'APPROVE',
        processingTime: Math.round(Math.random() * 100 + 50),
        timestamp: new Date().toISOString()
      };
      
      return NextResponse.json({
        success: true,
        result: mockResult
      });
    }
    
    if (userId) {
      // Get user fraud risk profile
      const userProfile = {
        userId,
        riskScore: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
        riskLevel: 'LOW',
        totalTransactions: Math.floor(Math.random() * 1000 + 100),
        flaggedTransactions: Math.floor(Math.random() * 10),
        lastRiskAssessment: new Date().toISOString(),
        behaviorProfile: {
          avgAmount: Math.floor(Math.random() * 500 + 50),
          avgFrequency: Math.floor(Math.random() * 10 + 1),
          preferredCurrency: 'USD',
          riskFactors: []
        }
      };
      
      return NextResponse.json({
        success: true,
        profile: userProfile
      });
    }
    
    // Return fraud detection statistics
    const stats = {
      timeRange,
      summary: {
        totalAnalyzed: Math.floor(Math.random() * 10000 + 5000),
        flaggedAsFraud: Math.floor(Math.random() * 100 + 20),
        blocked: Math.floor(Math.random() * 50 + 10),
        falsePositives: Math.floor(Math.random() * 5 + 1),
        accuracy: 0.92 + Math.random() * 0.05,
        precision: 0.89 + Math.random() * 0.05,
        recall: 0.87 + Math.random() * 0.05
      },
      modelPerformance: {
        version: '2.1.0',
        lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        accuracy: 0.921,
        f1Score: 0.895
      },
      alerts: [
        {
          id: 'alert_1',
          type: 'pattern_detected',
          message: 'Unusual transaction pattern detected in US region',
          severity: 'medium',
          timestamp: new Date().toISOString()
        }
      ]
    };
    
    return NextResponse.json({
      success: true,
      statistics: stats
    });
    
  } catch (error) {
    console.error('Fraud detection query error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve fraud detection data'
      },
      { status: 500 }
    );
  }
}
