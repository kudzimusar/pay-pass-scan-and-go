import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PatternAnalysisRequestSchema = z.object({
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
    const validatedData = PatternAnalysisRequestSchema.parse(body);

    // Mock pattern analysis - in real implementation, this would call the fraud detection service
    const patternAnalysis = await performPatternAnalysis(validatedData);

    return NextResponse.json({
      success: true,
      data: patternAnalysis,
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

    console.error('Error in pattern analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze patterns',
      },
      { status: 500 }
    );
  }
}

async function performPatternAnalysis(data: any): Promise<any> {
  const { transaction, userProfile, historicalData } = data;

  // Mock known fraud patterns
  const knownPatterns = [
    {
      id: 'pattern_001',
      name: 'Card Testing',
      description: 'Multiple small transactions to test card validity',
      indicators: ['small_amounts', 'rapid_frequency', 'multiple_merchants'],
      riskScore: 0.8,
      rules: [
        { field: 'amount', operator: '<', value: 10 },
        { field: 'frequency', operator: '>', value: 5 },
        { field: 'timeWindow', operator: '<', value: 3600 },
      ],
    },
    {
      id: 'pattern_002',
      name: 'Account Takeover',
      description: 'Unusual activity after account access from new location',
      indicators: ['new_location', 'high_value', 'unusual_time'],
      riskScore: 0.9,
      rules: [
        { field: 'locationChange', operator: '==', value: true },
        { field: 'amount', operator: '>', value: 1000 },
        { field: 'hour', operator: '<', value: 6 },
      ],
    },
    {
      id: 'pattern_003',
      name: 'Money Laundering',
      description: 'Structured transactions to avoid reporting thresholds',
      indicators: ['structured_amounts', 'multiple_accounts', 'rapid_transfers'],
      riskScore: 0.85,
      rules: [
        { field: 'amount', operator: '<', value: 10000 },
        { field: 'frequency', operator: '>', value: 3 },
        { field: 'recipientVariety', operator: '>', value: 2 },
      ],
    },
  ];

  // Match patterns against the transaction
  const matchedPatterns = matchPatterns(transaction, knownPatterns);
  const userPatterns = analyzeUserPatterns(transaction, userProfile, historicalData);
  const riskScore = calculatePatternRiskScore(matchedPatterns, userPatterns);

  return {
    transactionId: transaction.id,
    matchedPatterns,
    userPatterns,
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    recommendations: generatePatternRecommendations(matchedPatterns, userPatterns),
    timestamp: new Date().toISOString(),
  };
}

function matchPatterns(transaction: any, patterns: any[]): any[] {
  const matchedPatterns: any[] = [];

  for (const pattern of patterns) {
    const matchScore = calculatePatternMatch(transaction, pattern);
    if (matchScore > 0.6) {
      matchedPatterns.push({
        patternId: pattern.id,
        patternName: pattern.name,
        matchScore,
        riskScore: pattern.riskScore,
        indicators: getMatchedIndicators(transaction, pattern),
      });
    }
  }

  return matchedPatterns.sort((a, b) => b.matchScore - a.matchScore);
}

function calculatePatternMatch(transaction: any, pattern: any): number {
  let matchScore = 0;
  let totalRules = pattern.rules.length;

  for (const rule of pattern.rules) {
    if (evaluateRule(transaction, rule)) {
      matchScore += 1;
    }
  }

  return matchScore / totalRules;
}

function evaluateRule(transaction: any, rule: any): boolean {
  const { field, operator, value } = rule;

  switch (field) {
    case 'amount':
      return compareValues(transaction.amount, operator, value);
    case 'hour':
      const hour = new Date(transaction.timestamp).getHours();
      return compareValues(hour, operator, value);
    default:
      return false;
  }
}

function compareValues(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case '<':
      return actual < expected;
    case '<=':
      return actual <= expected;
    case '>':
      return actual > expected;
    case '>=':
      return actual >= expected;
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    default:
      return false;
  }
}

function getMatchedIndicators(transaction: any, pattern: any): string[] {
  const matchedIndicators: string[] = [];

  for (const indicator of pattern.indicators) {
    if (checkIndicator(transaction, indicator)) {
      matchedIndicators.push(indicator);
    }
  }

  return matchedIndicators;
}

function checkIndicator(transaction: any, indicator: string): boolean {
  switch (indicator) {
    case 'small_amounts':
      return transaction.amount < 10;
    case 'high_value':
      return transaction.amount > 1000;
    case 'unusual_time':
      const hour = new Date(transaction.timestamp).getHours();
      return hour < 6 || hour > 23;
    default:
      return false;
  }
}

function analyzeUserPatterns(
  transaction: any,
  userProfile: any,
  historicalData: any
): any {
  if (!historicalData || !historicalData.transactions) {
    return {
      hasHistory: false,
      patterns: [],
      riskFactors: [],
    };
  }

  const transactions = historicalData.transactions;
  const patterns = extractUserPatterns(transactions, transaction);
  const riskFactors = identifyRiskFactors(transactions, transaction);

  return {
    hasHistory: true,
    patterns,
    riskFactors,
    transactionCount: transactions.length,
    averageAmount: calculateAverageAmount(transactions),
    usualTimes: getUsualTransactionTimes(transactions),
    usualLocations: getUsualLocations(transactions),
  };
}

function extractUserPatterns(transactions: any[], currentTransaction: any): any[] {
  const patterns: any[] = [];

  // Amount pattern
  const amounts = transactions.map(tx => tx.amount);
  const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const amountDeviation = Math.abs(currentTransaction.amount - avgAmount) / avgAmount;

  if (amountDeviation > 2) {
    patterns.push({
      type: 'amount_deviation',
      severity: 'high',
      description: `Amount deviates ${(amountDeviation * 100).toFixed(1)}% from average`,
      value: amountDeviation,
    });
  }

  // Time pattern
  const hours = transactions.map(tx => new Date(tx.timestamp).getHours());
  const currentHour = new Date(currentTransaction.timestamp).getHours();
  const hourFrequency = hours.filter(h => h === currentHour).length / hours.length;

  if (hourFrequency < 0.1) {
    patterns.push({
      type: 'unusual_time',
      severity: 'medium',
      description: `Transaction at unusual hour (${currentHour}:00)`,
      value: currentHour,
      frequency: hourFrequency,
    });
  }

  return patterns;
}

function identifyRiskFactors(transactions: any[], currentTransaction: any): string[] {
  const riskFactors: string[] = [];

  // Check for recent failed transactions
  const recentFailures = transactions.filter(tx => 
    tx.status === 'failed' && 
    (Date.now() - new Date(tx.timestamp).getTime()) < 24 * 60 * 60 * 1000
  );

  if (recentFailures.length > 2) {
    riskFactors.push('recent_failures');
  }

  // Check for chargeback history
  const chargebacks = transactions.filter(tx => tx.status === 'chargeback');
  if (chargebacks.length > 0) {
    riskFactors.push('chargeback_history');
  }

  return riskFactors;
}

function calculateAverageAmount(transactions: any[]): number {
  const amounts = transactions.map(tx => tx.amount);
  return amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
}

function getUsualTransactionTimes(transactions: any[]): any {
  const hours = transactions.map(tx => new Date(tx.timestamp).getHours());
  const hourCounts: { [key: number]: number } = {};

  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return hourCounts;
}

function getUsualLocations(transactions: any[]): any {
  const locations = transactions
    .filter(tx => tx.location?.country)
    .map(tx => tx.location.country);
  
  const locationCounts: { [key: string]: number } = {};

  locations.forEach(location => {
    locationCounts[location] = (locationCounts[location] || 0) + 1;
  });

  return locationCounts;
}

function calculatePatternRiskScore(matchedPatterns: any[], userPatterns: any): number {
  let riskScore = 0;

  // Pattern-based risk
  for (const pattern of matchedPatterns) {
    riskScore += pattern.riskScore * pattern.matchScore;
  }

  // User pattern risk
  if (userPatterns.patterns) {
    for (const pattern of userPatterns.patterns) {
      if (pattern.severity === 'high') {
        riskScore += 0.3;
      } else if (pattern.severity === 'medium') {
        riskScore += 0.2;
      }
    }
  }

  // Risk factors
  if (userPatterns.riskFactors) {
    riskScore += userPatterns.riskFactors.length * 0.1;
  }

  return Math.min(riskScore, 1.0);
}

function getRiskLevel(riskScore: number): string {
  if (riskScore >= 0.8) return 'critical';
  if (riskScore >= 0.6) return 'high';
  if (riskScore >= 0.4) return 'medium';
  if (riskScore >= 0.2) return 'low';
  return 'minimal';
}

function generatePatternRecommendations(matchedPatterns: any[], userPatterns: any): string[] {
  const recommendations: string[] = [];

  if (matchedPatterns.length > 0) {
    recommendations.push(`Matched ${matchedPatterns.length} fraud patterns - review required`);
    
    for (const pattern of matchedPatterns.slice(0, 3)) {
      recommendations.push(`Pattern "${pattern.patternName}" detected (${(pattern.matchScore * 100).toFixed(1)}% match)`);
    }
  }

  if (userPatterns.patterns) {
    for (const pattern of userPatterns.patterns) {
      if (pattern.severity === 'high') {
        recommendations.push(`High-risk user pattern: ${pattern.description}`);
      }
    }
  }

  if (userPatterns.riskFactors && userPatterns.riskFactors.length > 0) {
    recommendations.push(`User has ${userPatterns.riskFactors.length} risk factors`);
  }

  if (recommendations.length === 0) {
    recommendations.push('No suspicious patterns detected');
  }

  return recommendations;
}