import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const AnomalyDetectionRequestSchema = z.object({
  transaction: z.object({
    id: z.string(),
    userId: z.string(),
    amount: z.number().positive(),
    currency: z.string(),
    timestamp: z.string().datetime(),
    location: z.object({
      country: z.string(),
      city: z.string().optional(),
      ipAddress: z.string().optional(),
    }).optional(),
    deviceInfo: z.object({
      deviceId: z.string().optional(),
      userAgent: z.string().optional(),
      fingerprint: z.string().optional(),
      isVirtualMachine: z.boolean().optional(),
      isProxy: z.boolean().optional(),
      isTor: z.boolean().optional(),
    }).optional(),
  }),
  userProfile: z.object({
    id: z.string(),
    usualLocations: z.array(z.string()).optional(),
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
    const validatedData = AnomalyDetectionRequestSchema.parse(body);

    // Mock anomaly detection - in real implementation, this would call the fraud detection service
    const anomalyDetection = await performAnomalyDetection(validatedData);

    return NextResponse.json({
      success: true,
      data: anomalyDetection,
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

    console.error('Error in anomaly detection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect anomalies',
      },
      { status: 500 }
    );
  }
}

async function performAnomalyDetection(data: any): Promise<any> {
  const { transaction, userProfile, historicalData } = data;

  const anomalies: any[] = [];

  // Amount anomalies
  const amountAnomalies = detectAmountAnomalies(transaction, historicalData);
  anomalies.push(...amountAnomalies);

  // Time anomalies
  const timeAnomalies = detectTimeAnomalies(transaction, userProfile);
  anomalies.push(...timeAnomalies);

  // Location anomalies
  const locationAnomalies = detectLocationAnomalies(transaction, userProfile);
  anomalies.push(...locationAnomalies);

  // Device anomalies
  const deviceAnomalies = detectDeviceAnomalies(transaction, userProfile);
  anomalies.push(...deviceAnomalies);

  // Behavioral anomalies
  const behavioralAnomalies = detectBehavioralAnomalies(transaction, historicalData);
  anomalies.push(...behavioralAnomalies);

  // Pattern anomalies
  const patternAnomalies = detectPatternAnomalies(transaction, historicalData);
  anomalies.push(...patternAnomalies);

  const severity = calculateOverallSeverity(anomalies);

  return {
    transactionId: transaction.id,
    anomalies,
    anomalyCount: anomalies.length,
    severity,
    timestamp: new Date().toISOString(),
  };
}

function detectAmountAnomalies(transaction: any, historicalData: any): any[] {
  const anomalies: any[] = [];

  if (!historicalData || !historicalData.transactions) {
    return anomalies;
  }

  const transactions = historicalData.transactions;
  const amounts = transactions.map((tx: any) => tx.amount);
  const avgAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length;
  const stdDev = calculateStandardDeviation(amounts, avgAmount);

  // Check if current amount is significantly different from historical average
  const zScore = Math.abs(transaction.amount - avgAmount) / stdDev;
  
  if (zScore > 3) {
    anomalies.push({
      type: 'amount_anomaly',
      severity: 'high',
      description: `Transaction amount (${transaction.amount}) is ${zScore.toFixed(2)} standard deviations from average (${avgAmount.toFixed(2)})`,
      value: transaction.amount,
      threshold: avgAmount + (3 * stdDev),
      zScore: zScore,
    });
  } else if (zScore > 2) {
    anomalies.push({
      type: 'amount_anomaly',
      severity: 'medium',
      description: `Transaction amount (${transaction.amount}) is ${zScore.toFixed(2)} standard deviations from average (${avgAmount.toFixed(2)})`,
      value: transaction.amount,
      threshold: avgAmount + (2 * stdDev),
      zScore: zScore,
    });
  }

  // Check for unusually large amounts
  if (transaction.amount > avgAmount * 5) {
    anomalies.push({
      type: 'amount_anomaly',
      severity: 'high',
      description: `Transaction amount (${transaction.amount}) is more than 5x the average amount (${avgAmount.toFixed(2)})`,
      value: transaction.amount,
      threshold: avgAmount * 5,
      ratio: transaction.amount / avgAmount,
    });
  }

  return anomalies;
}

function detectTimeAnomalies(transaction: any, userProfile: any): any[] {
  const anomalies: any[] = [];

  const timestamp = new Date(transaction.timestamp);
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();

  // Check for unusual hours
  if (hour < 6 || hour > 23) {
    anomalies.push({
      type: 'time_anomaly',
      severity: 'medium',
      description: `Transaction at unusual hour: ${hour}:00`,
      value: hour,
      threshold: '6:00 - 23:00',
    });
  }

  // Check for weekend transactions if user typically doesn't transact on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const weekendTransactions = userProfile?.weekendTransactions || 0;
    const totalTransactions = userProfile?.totalTransactions || 1;
    const weekendRatio = weekendTransactions / totalTransactions;

    if (weekendRatio < 0.1) {
      anomalies.push({
        type: 'time_anomaly',
        severity: 'medium',
        description: 'Transaction on weekend (unusual for this user)',
        value: dayOfWeek,
        threshold: 'Weekday transactions',
      });
    }
  }

  return anomalies;
}

function detectLocationAnomalies(transaction: any, userProfile: any): any[] {
  const anomalies: any[] = [];

  if (!transaction.location || !userProfile) {
    return anomalies;
  }

  const usualLocations = userProfile.usualLocations || [];
  const currentLocation = transaction.location.country;

  if (!usualLocations.includes(currentLocation)) {
    anomalies.push({
      type: 'location_anomaly',
      severity: 'high',
      description: `Transaction from new country: ${currentLocation}`,
      value: currentLocation,
      threshold: usualLocations,
    });
  }

  // Check for rapid location changes
  if (transaction.location.ipAddress) {
    const lastLocation = userProfile.lastLocation;
    if (lastLocation && lastLocation.country !== currentLocation) {
      const timeDiff = Date.now() - new Date(userProfile.lastTransactionTime).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 2) {
        anomalies.push({
          type: 'location_anomaly',
          severity: 'high',
          description: `Rapid location change: ${lastLocation.country} to ${currentLocation} in ${hoursDiff.toFixed(1)} hours`,
          value: currentLocation,
          threshold: '2+ hours between location changes',
          timeDiff: hoursDiff,
        });
      }
    }
  }

  return anomalies;
}

function detectDeviceAnomalies(transaction: any, userProfile: any): any[] {
  const anomalies: any[] = [];

  if (!transaction.deviceInfo || !userProfile) {
    return anomalies;
  }

  const usualDevices = userProfile.usualDevices || [];
  const currentDevice = transaction.deviceInfo.deviceId;

  if (currentDevice && !usualDevices.includes(currentDevice)) {
    anomalies.push({
      type: 'device_anomaly',
      severity: 'medium',
      description: `Transaction from new device: ${currentDevice}`,
      value: currentDevice,
      threshold: usualDevices,
    });
  }

  // Check for suspicious device characteristics
  if (transaction.deviceInfo.isVirtualMachine) {
    anomalies.push({
      type: 'device_anomaly',
      severity: 'high',
      description: 'Transaction from virtual machine',
      value: 'Virtual Machine',
      threshold: 'Physical device',
    });
  }

  if (transaction.deviceInfo.isProxy) {
    anomalies.push({
      type: 'device_anomaly',
      severity: 'high',
      description: 'Transaction through proxy',
      value: 'Proxy detected',
      threshold: 'Direct connection',
    });
  }

  return anomalies;
}

function detectBehavioralAnomalies(transaction: any, historicalData: any): any[] {
  const anomalies: any[] = [];

  if (!historicalData || !historicalData.transactions) {
    return anomalies;
  }

  const transactions = historicalData.transactions;
  const recentTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.timestamp);
    const now = new Date();
    return (now.getTime() - txDate.getTime()) < 24 * 60 * 60 * 1000; // Last 24 hours
  });

  // Check for unusual transaction frequency
  if (recentTransactions.length > 20) {
    anomalies.push({
      type: 'behavioral_anomaly',
      severity: 'high',
      description: `High transaction frequency: ${recentTransactions.length} transactions in 24 hours`,
      value: recentTransactions.length,
      threshold: 20,
    });
  }

  // Check for unusual transaction timing patterns
  const timeIntervals = [];
  for (let i = 1; i < recentTransactions.length; i++) {
    const interval = new Date(recentTransactions[i].timestamp).getTime() - 
                    new Date(recentTransactions[i-1].timestamp).getTime();
    timeIntervals.push(interval / (1000 * 60)); // Convert to minutes
  }

  if (timeIntervals.length > 0) {
    const avgInterval = timeIntervals.reduce((sum, interval) => sum + interval, 0) / timeIntervals.length;
    const currentInterval = (Date.now() - new Date(recentTransactions[recentTransactions.length - 1].timestamp).getTime()) / (1000 * 60);

    if (currentInterval < avgInterval * 0.1) {
      anomalies.push({
        type: 'behavioral_anomaly',
        severity: 'medium',
        description: `Unusually rapid transaction timing: ${currentInterval.toFixed(1)} minutes vs average ${avgInterval.toFixed(1)} minutes`,
        value: currentInterval,
        threshold: avgInterval * 0.1,
      });
    }
  }

  return anomalies;
}

function detectPatternAnomalies(transaction: any, historicalData: any): any[] {
  const anomalies: any[] = [];

  if (!historicalData || !historicalData.transactions) {
    return anomalies;
  }

  const transactions = historicalData.transactions;
  
  // Check for repeated small amounts (testing behavior)
  const recentSmallTransactions = transactions.filter((tx: any) => {
    const txDate = new Date(tx.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 1 && tx.amount < 10; // Small amounts in last hour
  });

  if (recentSmallTransactions.length > 5) {
    anomalies.push({
      type: 'pattern_anomaly',
      severity: 'medium',
      description: `Multiple small test transactions: ${recentSmallTransactions.length} transactions under $10 in 1 hour`,
      value: recentSmallTransactions.length,
      threshold: 5,
    });
  }

  // Check for round number amounts (suspicious pattern)
  if (transaction.amount % 100 === 0 || transaction.amount % 1000 === 0) {
    anomalies.push({
      type: 'pattern_anomaly',
      severity: 'low',
      description: `Round number transaction amount: ${transaction.amount}`,
      value: transaction.amount,
      threshold: 'Non-round amounts',
    });
  }

  return anomalies;
}

function calculateStandardDeviation(values: number[], mean: number): number {
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateOverallSeverity(anomalies: any[]): string {
  if (anomalies.length === 0) return 'none';

  const severityScores = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const totalScore = anomalies.reduce((sum, anomaly) => {
    return sum + (severityScores[anomaly.severity as keyof typeof severityScores] || 0);
  }, 0);

  const avgScore = totalScore / anomalies.length;

  if (avgScore >= 3.5) return 'critical';
  if (avgScore >= 2.5) return 'high';
  if (avgScore >= 1.5) return 'medium';
  return 'low';
}