import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RealTimeMetricsSchema = z.object({
  activeUsers: z.number().min(0),
  transactionsPerMinute: z.number().min(0),
  revenuePerMinute: z.number().min(0),
  systemHealth: z.object({
    uptime: z.number().min(0).max(100),
    responseTime: z.number().min(0),
    errorRate: z.number().min(0).max(100),
  }),
  recentTransactions: z.array(z.object({
    id: z.string(),
    amount: z.number().min(0),
    currency: z.string(),
    status: z.string(),
    timestamp: z.string(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    // Generate mock real-time data
    const mockData = {
      activeUsers: Math.floor(Math.random() * 5000) + 1000,
      transactionsPerMinute: Math.floor(Math.random() * 50) + 10,
      revenuePerMinute: Math.random() * 10000 + 1000,
      systemHealth: {
        uptime: 99.5 + Math.random() * 0.5,
        responseTime: Math.floor(Math.random() * 100) + 50,
        errorRate: Math.random() * 0.1,
      },
      recentTransactions: Array.from({ length: 10 }, (_, i) => ({
        id: `tx_${Date.now()}_${i}`,
        amount: Math.random() * 1000 + 10,
        currency: ['USD', 'EUR', 'GBP', 'CAD'][Math.floor(Math.random() * 4)],
        status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
        timestamp: new Date(Date.now() - Math.random() * 300000).toISOString(),
      })),
    };

    // Validate the data
    const validatedData = RealTimeMetricsSchema.parse(mockData);

    return NextResponse.json({
      success: true,
      data: validatedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating real-time metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate real-time metrics',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = RealTimeMetricsSchema.parse(body);

    // In a real implementation, this would store or process the metrics
    console.log('Received real-time metrics:', validatedData);

    return NextResponse.json({
      success: true,
      message: 'Real-time metrics received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error processing real-time metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process real-time metrics',
      },
      { status: 500 }
    );
  }
}