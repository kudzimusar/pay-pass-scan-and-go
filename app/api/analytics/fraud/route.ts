import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

<<<<<<< HEAD
// Validation schema for fraud analytics request
const fraudAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['hour', 'day', 'week', 'month']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['approved', 'blocked', 'review']).optional(),
  region: z.string().optional()
});

// Mock fraud analytics data generator
const generateFraudAnalyticsData = (params: any) => {
  const mockData = {
    summary: {
      totalTransactions: 45678,
      fraudulentTransactions: 234,
      fraudRate: 0.51,
      blockedTransactions: 156,
      reviewedTransactions: 78,
      falsePositives: 12,
      falseNegatives: 8,
      accuracy: 94.2,
      precision: 89.7,
      recall: 91.3,
      f1Score: 90.5
    },
    riskDistribution: {
      LOW: { count: 40123, percentage: 87.8, avgAmount: 156.78 },
      MEDIUM: { count: 5321, percentage: 11.6, avgAmount: 245.67 },
      HIGH: { count: 234, percentage: 0.6, avgAmount: 1234.56 }
    },
    trends: {
      daily: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          totalTransactions: Math.floor(Math.random() * 2000) + 1000,
          fraudulent: Math.floor(Math.random() * 20) + 5,
          fraudRate: (Math.floor(Math.random() * 20) + 5) / (Math.floor(Math.random() * 2000) + 1000) * 100,
          blocked: Math.floor(Math.random() * 15) + 2,
          reviewed: Math.floor(Math.random() * 10) + 1
        };
      }),
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        fraudRate: Math.random() * 2 + 0.2,
        transactions: Math.floor(Math.random() * 500) + 100,
        riskScore: Math.random() * 0.8 + 0.1
      }))
    },
    topRiskFactors: [
      { factor: 'High Transaction Amount', frequency: 156, impact: 0.85 },
      { factor: 'Unusual Time Pattern', frequency: 134, impact: 0.72 },
      { factor: 'New Device/Location', frequency: 98, impact: 0.68 },
      { factor: 'High Velocity', frequency: 87, impact: 0.65 },
      { factor: 'Suspicious Merchant', frequency: 76, impact: 0.62 },
      { factor: 'IP/VPN Risk', frequency: 65, impact: 0.58 }
    ],
    geographicAnalysis: {
      byCountry: [
        { country: 'US', fraudRate: 0.45, transactions: 15234, blocked: 68 },
        { country: 'UK', fraudRate: 0.38, transactions: 8567, blocked: 32 },
        { country: 'CA', fraudRate: 0.42, transactions: 5432, blocked: 23 },
        { country: 'AU', fraudRate: 0.51, transactions: 3456, blocked: 18 },
        { country: 'DE', fraudRate: 0.35, transactions: 4321, blocked: 15 }
      ],
      byRegion: [
        { region: 'North America', fraudRate: 0.43, riskScore: 0.65 },
        { region: 'Europe', fraudRate: 0.37, riskScore: 0.58 },
        { region: 'Asia Pacific', fraudRate: 0.52, riskScore: 0.71 },
        { region: 'Latin America', fraudRate: 0.68, riskScore: 0.79 },
        { region: 'Africa', fraudRate: 0.74, riskScore: 0.83 }
      ]
    },
    merchantAnalysis: {
      byCategory: [
        { category: 'E-commerce', fraudRate: 0.48, volume: 18234 },
        { category: 'Digital Services', fraudRate: 0.52, volume: 12456 },
        { category: 'Financial Services', fraudRate: 0.31, volume: 8765 },
        { category: 'Travel & Hospitality', fraudRate: 0.67, volume: 4321 },
        { category: 'Gaming', fraudRate: 0.89, volume: 2109 }
      ],
      highRiskMerchants: [
        { merchantId: 'MERCH_001', name: 'High-Risk Vendor A', fraudRate: 2.34, status: 'monitoring' },
        { merchantId: 'MERCH_002', name: 'Suspicious Store B', fraudRate: 1.89, status: 'restricted' },
        { merchantId: 'MERCH_003', name: 'Flagged Business C', fraudRate: 1.56, status: 'investigation' }
      ]
    },
    deviceAnalysis: {
      riskByDeviceType: [
        { deviceType: 'Mobile', fraudRate: 0.42, count: 28456 },
        { deviceType: 'Desktop', fraudRate: 0.38, count: 12890 },
        { deviceType: 'Tablet', fraudRate: 0.45, count: 3456 },
        { deviceType: 'Unknown', fraudRate: 1.23, count: 876 }
      ],
      suspiciousDevices: [
        { deviceId: 'DEV_001', fraudCount: 15, riskScore: 0.95 },
        { deviceId: 'DEV_002', fraudCount: 12, riskScore: 0.89 },
        { deviceId: 'DEV_003', fraudCount: 9, riskScore: 0.82 }
      ]
    },
    modelPerformance: {
      currentModel: {
        version: '2.1.0',
        accuracy: 94.2,
        precision: 89.7,
        recall: 91.3,
        f1Score: 90.5,
        lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trainingDataSize: 1250000
      },
      historicalPerformance: Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (11 - i));
        return {
          month: date.toISOString().slice(0, 7),
          accuracy: 90 + Math.random() * 5,
          precision: 85 + Math.random() * 8,
          recall: 87 + Math.random() * 6,
          fraudCaught: Math.floor(Math.random() * 200) + 150,
          falsePositives: Math.floor(Math.random() * 30) + 10
        };
      })
    },
    alertsAndPatterns: {
      activeAlerts: [
        {
          id: 'ALERT_001',
          type: 'velocity_spike',
          description: 'Unusual transaction velocity detected in US East region',
          severity: 'HIGH',
          affectedTransactions: 45,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'ALERT_002',
          type: 'new_attack_pattern',
          description: 'Emerging fraud pattern involving cryptocurrency merchants',
          severity: 'MEDIUM',
          affectedTransactions: 23,
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'ALERT_003',
          type: 'device_fingerprint',
          description: 'Multiple accounts using similar device fingerprints',
          severity: 'MEDIUM',
          affectedTransactions: 18,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ],
      emergingPatterns: [
        {
          pattern: 'Cross-border micro-transactions',
          confidence: 0.87,
          firstDetected: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: 156,
          riskLevel: 'HIGH'
        },
        {
          pattern: 'Mobile app automation',
          confidence: 0.73,
          firstDetected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: 89,
          riskLevel: 'MEDIUM'
        }
      ]
    },
    recommendations: [
      {
        type: 'model_improvement',
        priority: 'HIGH',
        description: 'Retrain model with recent attack patterns',
        estimatedImpact: '+2.3% accuracy',
        effort: 'Medium'
      },
      {
        type: 'rule_optimization',
        priority: 'MEDIUM',
        description: 'Adjust velocity thresholds for mobile transactions',
        estimatedImpact: '-15% false positives',
        effort: 'Low'
      },
      {
        type: 'feature_enhancement',
        priority: 'MEDIUM',
        description: 'Add behavioral biometrics for mobile app',
        estimatedImpact: '+5.1% fraud detection',
        effort: 'High'
      },
      {
        type: 'monitoring',
        priority: 'LOW',
        description: 'Implement real-time merchant risk scoring',
        estimatedImpact: '+1.8% precision',
        effort: 'Medium'
      }
    ]
  };

  return mockData;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    // Parse and validate query parameters
    const validation = fraudAnalyticsSchema.safeParse(params);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, period, riskLevel, status, region } = validation.data;

    // Generate analytics data based on parameters
    const analyticsData = generateFraudAnalyticsData({
      startDate,
      endDate,
      period,
      riskLevel,
      status,
      region
    });

    // Apply filters if specified
    let filteredData = { ...analyticsData };
    
    if (riskLevel) {
      // Filter by risk level
      const riskData = analyticsData.riskDistribution[riskLevel];
      if (riskData) {
        filteredData.summary.totalTransactions = riskData.count;
        filteredData.riskDistribution = { [riskLevel]: riskData };
      }
    }

    if (region) {
      // Filter by region
      const regionData = analyticsData.geographicAnalysis.byRegion.find(r => 
        r.region.toLowerCase().includes(region.toLowerCase())
      );
      if (regionData) {
        filteredData.geographicAnalysis.byRegion = [regionData];
      }
    }

    // Calculate additional insights
    const insights = {
      keyFindings: [
        `Fraud rate decreased by ${(Math.random() * 0.1 + 0.05).toFixed(2)}% compared to last period`,
        `${analyticsData.topRiskFactors[0].factor} is the most significant risk indicator`,
        `${analyticsData.geographicAnalysis.byRegion.sort((a, b) => b.fraudRate - a.fraudRate)[0].region} shows highest fraud rate at ${analyticsData.geographicAnalysis.byRegion.sort((a, b) => b.fraudRate - a.fraudRate)[0].fraudRate}%`,
        `Model accuracy improved to ${analyticsData.modelPerformance.currentModel.accuracy}%`
      ],
      riskTrends: {
        increasing: ['Cross-border transactions', 'Mobile app usage'],
        decreasing: ['Desktop transactions', 'Repeat customers'],
        stable: ['E-commerce payments', 'Small transactions']
      },
      actionItems: [
        'Review high-risk merchant categories',
        'Update device fingerprinting rules',
        'Enhance velocity detection for mobile',
        'Implement new behavioral features'
      ]
    };

    return NextResponse.json({
      success: true,
      data: filteredData,
      insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate, period },
        filters: { riskLevel, status, region },
        dataQuality: {
          completeness: 0.98,
          accuracy: 0.95,
          freshness: 'real-time'
        }
      }
    });

  } catch (error) {
    console.error('Fraud analytics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate fraud analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = fraudAnalyticsSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validation.error.errors
=======
const analyticsRequestSchema = z.object({
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  period: z.enum(['7d', '30d', '90d']).optional().default('7d'),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateRange, period, userId } = analyticsRequestSchema.parse(body);

    // Mock data for demonstration - in production this would come from the analytics service
    const mockData = generateMockFraudData(dateRange, period);

    return NextResponse.json({
      success: true,
      data: mockData,
      metadata: {
        dateRange,
        period,
        totalRecords: mockData.length,
      },
    });
  } catch (error) {
    console.error('Analytics fraud API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
        },
        { status: 400 }
      );
    }

<<<<<<< HEAD
    // Generate custom fraud analytics report
    const customAnalytics = generateFraudAnalyticsData(body);

    // Generate executive summary for fraud analytics
    const executiveSummary = {
      overallHealth: {
        status: customAnalytics.summary.fraudRate < 0.6 ? 'GOOD' : 
                customAnalytics.summary.fraudRate < 1.0 ? 'MODERATE' : 'CONCERNING',
        fraudRate: customAnalytics.summary.fraudRate,
        trend: 'IMPROVING', // Mock trend
        confidence: 0.92
      },
      criticalIssues: [
        {
          issue: 'Emerging fraud pattern in gaming category',
          severity: 'HIGH',
          impact: 'Medium',
          recommendation: 'Implement enhanced rules for gaming merchants'
        },
        {
          issue: 'False positive rate above target',
          severity: 'MEDIUM',
          impact: 'Low',
          recommendation: 'Fine-tune velocity detection parameters'
        }
      ],
      successMetrics: [
        `Model accuracy: ${customAnalytics.modelPerformance.currentModel.accuracy}%`,
        `Fraud prevention: $${(Math.random() * 500000 + 250000).toFixed(0)} saved`,
        `Customer satisfaction: 94.2% (minimal friction)`,
        `Processing speed: <100ms average response time`
      ],
      recommendations: customAnalytics.recommendations.slice(0, 3)
    };

    return NextResponse.json({
      success: true,
      message: 'Custom fraud analytics report generated',
      reportId: `fraud_report_${Date.now()}`,
      data: customAnalytics,
      executiveSummary
    });

  } catch (error) {
    console.error('Custom fraud analytics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate custom fraud analytics report'
=======
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
      },
      { status: 500 }
    );
  }
}
<<<<<<< HEAD
=======

function generateMockFraudData(dateRange: { from: string; to: string }, period: string) {
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    
    const totalTransactions = Math.floor(Math.random() * 1000) + 100;
    const flaggedTransactions = Math.floor(totalTransactions * 0.05) + Math.floor(Math.random() * totalTransactions * 0.03);
    const blockedTransactions = Math.floor(flaggedTransactions * 0.3) + Math.floor(Math.random() * flaggedTransactions * 0.2);
    const falsePositives = Math.floor(flaggedTransactions * 0.1) + Math.floor(Math.random() * flaggedTransactions * 0.05);
    const riskScore = Math.floor(Math.random() * 40) + 20; // 20-60 range
    
    data.push({
      date: date.toISOString().split('T')[0],
      totalTransactions,
      flaggedTransactions,
      blockedTransactions,
      falsePositives,
      riskScore,
    });
  }
  
  return data;
}
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
