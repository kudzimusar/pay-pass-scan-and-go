import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RiskAssessmentRequestSchema = z.object({
  transaction: z.object({
    id: z.string(),
    userId: z.string(),
    amount: z.number().positive(),
    currency: z.string(),
    merchantId: z.string().optional(),
    location: z.object({
      country: z.string(),
      city: z.string().optional(),
      ipAddress: z.string().optional(),
    }).optional(),
    deviceInfo: z.object({
      deviceId: z.string().optional(),
      userAgent: z.string().optional(),
      fingerprint: z.string().optional(),
    }).optional(),
    timestamp: z.string().datetime(),
  }),
  userProfile: z.object({
    id: z.string(),
    usualCountries: z.array(z.string()).optional(),
    usualDevices: z.array(z.string()).optional(),
    lastLocation: z.object({
      country: z.string(),
      city: z.string().optional(),
    }).optional(),
    lastTransactionTime: z.string().optional(),
    weekendTransactions: z.number().optional(),
    totalTransactions: z.number().optional(),
  }).optional(),
  historicalData: z.object({
    transactions: z.array(z.object({
      id: z.string(),
      amount: z.number(),
      timestamp: z.string(),
      status: z.string(),
      location: z.object({
        country: z.string(),
      }).optional(),
    })).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = RiskAssessmentRequestSchema.parse(body);

    // Mock risk assessment - in real implementation, this would call the fraud detection service
    const riskAssessment = await performRiskAssessment(validatedData);

    return NextResponse.json({
      success: true,
      data: riskAssessment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error in risk assessment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assess risk',
      },
      { status: 500 }
    );
  }
}

async function performRiskAssessment(data: any): Promise<any> {
  const { transaction, userProfile, historicalData } = data;

  // Calculate risk factors
  const riskFactors = {
    amountRisk: calculateAmountRisk(transaction.amount),
    locationRisk: calculateLocationRisk(transaction.location, userProfile),
    timeRisk: calculateTimeRisk(transaction.timestamp),
    userHistoryRisk: calculateUserHistoryRisk(historicalData),
    deviceRisk: calculateDeviceRisk(transaction.deviceInfo),
    velocityRisk: calculateVelocityRisk(historicalData),
  };

  // Calculate overall risk score
  const weights = {
    amountRisk: 0.25,
    locationRisk: 0.20,
    timeRisk: 0.15,
    userHistoryRisk: 0.20,
    deviceRisk: 0.10,
    velocityRisk: 0.10,
  };

  let overallRisk = 0;
  for (const [factor, weight] of Object.entries(weights)) {
    overallRisk += riskFactors[factor as keyof typeof riskFactors] * weight;
  }

  const riskLevel = getRiskLevel(overallRisk);
  const recommendations = generateRecommendations(overallRisk, riskFactors, transaction);

  return {
    transactionId: transaction.id,
    riskScore: Math.round(overallRisk * 100) / 100,
    riskLevel,
    riskFactors,
    recommendations,
    assessmentTimestamp: new Date().toISOString(),
  };
}

function calculateAmountRisk(amount: number): number {
  if (amount > 10000) return 0.8;
  if (amount > 5000) return 0.6;
  if (amount > 1000) return 0.4;
  return 0.2;
}

function calculateLocationRisk(location: any, userProfile: any): number {
  if (!location || !userProfile) return 0.5;

  const usualCountries = userProfile.usualCountries || ['US'];
  if (!usualCountries.includes(location.country)) {
    return 0.7;
  }

  return 0.2;
}

function calculateTimeRisk(timestamp: string): number {
  const hour = new Date(timestamp).getHours();
  
  if (hour >= 2 && hour <= 6) return 0.6;
  if (hour >= 9 && hour <= 17) return 0.2;
  
  return 0.4;
}

function calculateUserHistoryRisk(historicalData: any): number {
  if (!historicalData || !historicalData.transactions) return 0.5;

  const transactions = historicalData.transactions;
  const recentTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.timestamp);
    const now = new Date();
    return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000;
  });

  if (recentTransactions.length > 20) return 0.8;
  if (recentTransactions.length > 10) return 0.6;
  if (recentTransactions.length > 5) return 0.4;

  return 0.2;
}

function calculateDeviceRisk(deviceInfo: any): number {
  if (!deviceInfo) return 0.5;

  if (deviceInfo.isVirtualMachine) return 0.8;
  if (deviceInfo.isProxy) return 0.7;
  if (deviceInfo.isTor) return 0.9;

  return 0.2;
}

function calculateVelocityRisk(historicalData: any): number {
  if (!historicalData || !historicalData.transactions) return 0.5;

  const transactions = historicalData.transactions;
  const lastHour = transactions.filter((tx: any) => {
    const txDate = new Date(tx.timestamp);
    const now = new Date();
    return (now.getTime() - txDate.getTime()) < 60 * 60 * 1000;
  });

  if (lastHour.length > 5) return 0.8;
  if (lastHour.length > 3) return 0.6;
  if (lastHour.length > 1) return 0.4;

  return 0.2;
}

function getRiskLevel(riskScore: number): string {
  if (riskScore >= 0.8) return 'critical';
  if (riskScore >= 0.6) return 'high';
  if (riskScore >= 0.4) return 'medium';
  if (riskScore >= 0.2) return 'low';
  return 'minimal';
}

function generateRecommendations(riskScore: number, riskFactors: any, transaction: any): string[] {
  const recommendations: string[] = [];

  if (riskScore >= 0.8) {
    recommendations.push('Block transaction - critical risk detected');
    recommendations.push('Require manual review and additional verification');
  } else if (riskScore >= 0.6) {
    recommendations.push('Flag for manual review');
    recommendations.push('Request additional authentication');
  } else if (riskScore >= 0.4) {
    recommendations.push('Monitor transaction closely');
    recommendations.push('Consider additional verification');
  } else {
    recommendations.push('Proceed with standard processing');
  }

  if (riskFactors.amountRisk > 0.6) {
    recommendations.push('Large amount - consider enhanced due diligence');
  }

  if (riskFactors.locationRisk > 0.6) {
    recommendations.push('Unusual location - verify transaction details');
  }

  if (riskFactors.velocityRisk > 0.6) {
    recommendations.push('High transaction velocity - monitor for suspicious activity');
  }

  return recommendations;
}