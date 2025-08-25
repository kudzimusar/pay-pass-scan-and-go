import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const dashboardRequestSchema = z.object({
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  userId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateRange, userId } = dashboardRequestSchema.parse(body);

    // Generate comprehensive dashboard data
    const dashboardData = generateDashboardData(dateRange);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      metadata: {
        dateRange,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request data',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

function generateDashboardData(dateRange: { from: string; to: string }) {
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Generate transaction data
  let totalTransactions = 0;
  let successfulTransactions = 0;
  let failedTransactions = 0;
  let pendingTransactions = 0;
  
  for (let i = 0; i < days; i++) {
    const total = Math.floor(Math.random() * 1000) + 100;
    const successful = Math.floor(total * 0.85) + Math.floor(Math.random() * total * 0.1);
    const failed = Math.floor(total * 0.1) + Math.floor(Math.random() * total * 0.05);
    const pending = total - successful - failed;
    
    totalTransactions += total;
    successfulTransactions += successful;
    failedTransactions += failed;
    pendingTransactions += pending;
  }
  
  // Generate revenue data
  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;
  
  for (let i = 0; i < days; i++) {
    const revenue = Math.floor(Math.random() * 50000) + 10000;
    totalRevenue += revenue;
    
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    const now = new Date();
    
    if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      thisMonthRevenue += revenue;
    } else if (date.getMonth() === (now.getMonth() - 1 + 12) % 12 && date.getFullYear() === now.getFullYear()) {
      lastMonthRevenue += revenue;
    }
  }
  
  // Generate user data
  const totalUsers = 10000 + Math.floor(Math.random() * 5000);
  const activeUsers = Math.floor(totalUsers * 0.7) + Math.floor(Math.random() * totalUsers * 0.2);
  const newUsers = Math.floor(Math.random() * 500) + 100;
  
  // Calculate trends
  const transactionTrend = Math.floor(Math.random() * 20) - 10; // -10 to +10%
  const revenueTrend = Math.floor(Math.random() * 30) - 15; // -15 to +15%
  const userTrend = Math.floor(Math.random() * 25) - 12; // -12 to +13%
  
  // Generate performance data
  const avgResponseTime = Math.floor(Math.random() * 200) + 50;
  const uptime = 99.5 + (Math.random() * 0.4);
  const errorRate = Math.random() * 0.5;
  
  return {
    transactions: {
      total: totalTransactions,
      successful: successfulTransactions,
      failed: failedTransactions,
      pending: pendingTransactions,
      trend: transactionTrend,
    },
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      trend: revenueTrend,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      new: newUsers,
      trend: userTrend,
    },
    performance: {
      avgResponseTime,
      uptime,
      errorRate,
    },
  };
}