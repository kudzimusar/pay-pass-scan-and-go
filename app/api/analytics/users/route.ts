import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

<<<<<<< HEAD
// Validation schema for user analytics request
const userAnalyticsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['day', 'week', 'month', 'year']).optional(),
  segment: z.string().optional(),
  country: z.string().optional(),
  tier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  kycStatus: z.enum(['pending', 'approved', 'rejected']).optional()
});

// Mock user data generator
const generateMockUserData = (params: any) => {
  const mockData = {
    summary: {
      totalUsers: 23456,
      activeUsers: 18723,
      newUsers: 1234,
      retentionRate: 78.5,
      churnRate: 2.8,
      growthRate: 12.3
    },
    demographics: {
      byCountry: {
        US: { count: 8234, percentage: 35.1, growth: 15.2 },
        UK: { count: 4687, percentage: 20.0, growth: 18.5 },
        ZW: { count: 3521, percentage: 15.0, growth: 25.8 },
        ZA: { count: 2812, percentage: 12.0, growth: 20.1 },
        KE: { count: 2109, percentage: 9.0, growth: 22.3 },
        Others: { count: 2093, percentage: 8.9, growth: 16.7 }
      },
      byAge: {
        '18-25': { count: 5864, percentage: 25.0, avgTransactions: 12.5 },
        '26-35': { count: 9382, percentage: 40.0, avgTransactions: 18.7 },
        '36-45': { count: 5161, percentage: 22.0, avgTransactions: 22.1 },
        '46-55': { count: 2110, percentage: 9.0, avgTransactions: 15.3 },
        '55+': { count: 939, percentage: 4.0, avgTransactions: 8.9 }
      },
      byTier: {
        basic: { count: 15620, percentage: 66.6, revenue: 234000 },
        premium: { count: 6572, percentage: 28.0, revenue: 892000 },
        enterprise: { count: 1264, percentage: 5.4, revenue: 1456000 }
      }
    },
    engagement: {
      dailyActiveUsers: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5000) + 15000,
        newUsers: Math.floor(Math.random() * 200) + 50
      })),
      sessionMetrics: {
        averageSessionDuration: 8.5, // minutes
        averageSessionsPerUser: 3.2,
        bounceRate: 12.8,
        pageViews: 156234
      },
      featureUsage: {
        payForFriend: { users: 8923, percentage: 38.1, frequency: 2.3 },
        qrPayments: { users: 15634, percentage: 66.7, frequency: 5.1 },
        crossBorder: { users: 4521, percentage: 19.3, frequency: 1.8 },
        billPayments: { users: 12890, percentage: 55.0, frequency: 3.7 },
        topUp: { users: 18456, percentage: 78.7, frequency: 4.2 }
      }
    },
    cohortAnalysis: {
      retention: {
        week1: 85.2,
        week2: 72.8,
        week4: 65.3,
        week8: 58.7,
        week12: 52.1,
        week24: 45.8,
        week52: 38.9
      },
      ltv: {
        month1: 45.50,
        month3: 156.75,
        month6: 312.45,
        month12: 567.89,
        month24: 892.34
      }
    },
    kycStatus: {
      pending: { count: 1234, percentage: 5.3, avgTime: 2.5 },
      approved: { count: 21456, percentage: 91.5, avgTime: 1.8 },
      rejected: { count: 766, percentage: 3.2, avgTime: 3.2 }
    }
  };

  return mockData;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams);
    
    // Parse and validate query parameters
    const validation = userAnalyticsSchema.safeParse(params);
    
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

    const { startDate, endDate, period, segment, country, tier, kycStatus } = validation.data;

    // Generate analytics data based on parameters
    const analyticsData = generateMockUserData({
      startDate,
      endDate,
      period,
      segment,
      country,
      tier,
      kycStatus
    });

    // Apply filters if specified
    let filteredData = { ...analyticsData };
    
    if (country) {
      // Filter by specific country
      const countryData = analyticsData.demographics.byCountry[country];
      if (countryData) {
        filteredData.summary.totalUsers = countryData.count;
        filteredData.demographics.byCountry = { [country]: countryData };
      }
    }

    if (tier) {
      // Filter by user tier
      const tierData = analyticsData.demographics.byTier[tier];
      if (tierData) {
        filteredData.summary.totalUsers = tierData.count;
        filteredData.demographics.byTier = { [tier]: tierData };
      }
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: { startDate, endDate, period },
        filters: { segment, country, tier, kycStatus }
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate user analytics',
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
    const validation = userAnalyticsSchema.safeParse(body);
    
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
    const mockData = generateMockUserData(dateRange, period);

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
    console.error('Analytics users API error:', error);
    
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
    // Generate custom user analytics report
    const customAnalytics = generateMockUserData(body);

    // Calculate additional insights based on request
    const insights = {
      highValueSegments: [
        {
          segment: 'Premium Cross-border Users',
          count: 892,
          revenue: 456789,
          characteristics: ['High transaction volume', 'International transfers', 'Premium tier']
        },
        {
          segment: 'Enterprise API Users',
          count: 234,
          revenue: 234567,
          characteristics: ['API integration', 'Bulk transactions', 'Enterprise tier']
        }
      ],
      churnRisk: {
        highRisk: 156,
        mediumRisk: 423,
        lowRisk: 18144,
        factors: ['Reduced activity', 'Failed transactions', 'Support tickets']
      },
      recommendations: [
        'Increase mobile app engagement for 26-35 age group',
        'Implement retention campaign for users with <2 transactions',
        'Focus expansion efforts on African markets showing high growth',
        'Develop premium features for enterprise segment'
      ]
    };

    return NextResponse.json({
      success: true,
      message: 'Custom user analytics report generated',
      reportId: `user_report_${Date.now()}`,
      data: customAnalytics,
      insights
    });

  } catch (error) {
    console.error('Custom user analytics error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate custom user analytics report'
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

function generateMockUserData(dateRange: { from: string; to: string }, period: string) {
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const data = [];
  let runningTotal = 10000; // Starting user base
  
  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    
    const newUsers = Math.floor(Math.random() * 50) + 10;
    const churnedUsers = Math.floor(Math.random() * 20) + 5;
    const activeUsers = Math.floor(runningTotal * 0.7) + Math.floor(Math.random() * runningTotal * 0.2);
    
    runningTotal += newUsers - churnedUsers;
    
    data.push({
      date: date.toISOString().split('T')[0],
      total: runningTotal,
      active: activeUsers,
      new: newUsers,
      churned: churnedUsers,
    });
  }
  
  return data;
}
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
