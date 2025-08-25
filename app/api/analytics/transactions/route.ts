import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
    const mockData = generateMockTransactionData(dateRange, period);

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
    console.error('Analytics transactions API error:', error);
    
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

function generateMockTransactionData(dateRange: { from: string; to: string }, period: string) {
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const data = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    
    const total = Math.floor(Math.random() * 1000) + 100;
    const successful = Math.floor(total * 0.85) + Math.floor(Math.random() * total * 0.1);
    const failed = Math.floor(total * 0.1) + Math.floor(Math.random() * total * 0.05);
    const pending = total - successful - failed;
    
    data.push({
      date: date.toISOString().split('T')[0],
      total,
      successful,
      failed,
      pending,
    });
  }
  
  return data;
}