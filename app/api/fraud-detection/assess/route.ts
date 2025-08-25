import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { 
  fraudDetectionEngine, 
  transactionPatternSchema,
  type TransactionPattern 
} from "../../_lib/ai-fraud-detection";
import { 
  fraudScores, 
  users, 
  transactions 
} from "../../../../shared/schema";
import { eq, desc, gte } from "drizzle-orm";

const assessTransactionSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  transactionId: z.string().uuid("Invalid transaction ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "EUR", "GBP", "ZWL", "ZAR"]),
  recipientId: z.string().uuid().optional(),
  
  // Optional context - will be enriched if not provided
  deviceType: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  sessionDuration: z.number().optional(),
});

// Helper function to gather user metrics
async function gatherUserMetrics(userId: string) {
  // Get user account info
  const user = await db
    .select({
      createdAt: users.createdAt,
      countryCode: users.countryCode,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) {
    throw new Error("User not found");
  }

  // Calculate account age in days
  const accountAge = Math.floor(
    (Date.now() - new Date(user[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get recent transaction history
  const recentTransactions = await db
    .select({
      amount: transactions.amount,
      currency: transactions.currency,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      eq(transactions.userId, userId)
    )
    .orderBy(desc(transactions.createdAt))
    .limit(100);

  // Calculate metrics
  const totalTransactions = recentTransactions.length;
  const averageTransactionAmount = totalTransactions > 0
    ? recentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / totalTransactions
    : 0;

  // Get transactions from last 24 hours
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent24hTransactions = recentTransactions.filter(tx => 
    new Date(tx.createdAt) > last24Hours
  );

  const velocityLast24h = recent24hTransactions.length;
  const amountLast24h = recent24hTransactions.reduce((sum, tx) => 
    sum + parseFloat(tx.amount), 0
  );

  return {
    accountAge,
    totalTransactions,
    averageTransactionAmount,
    velocityLast24h,
    amountLast24h,
    frequentCountries: [user[0].countryCode], // Simplified - would track login countries
    deviceFingerprints: ['default_device'], // Simplified - would track actual device fingerprints
    ipAddresses: ['127.0.0.1'], // Simplified - would track actual IP history
  };
}

// Helper function to detect network properties
function analyzeNetworkContext(ipAddress?: string, userAgent?: string) {
  // Simplified network analysis - in production would use real services
  const vpnDetected = ipAddress?.includes('vpn') || false;
  const torDetected = ipAddress?.includes('tor') || false;
  const proxyDetected = ipAddress?.includes('proxy') || false;
  
  let connectionType: 'cellular' | 'wifi' | 'vpn' | 'unknown' = 'unknown';
  if (vpnDetected) connectionType = 'vpn';
  else if (userAgent?.includes('Mobile')) connectionType = 'cellular';
  else connectionType = 'wifi';

  return {
    connectionType,
    vpnDetected,
    torDetected,
    proxyDetected,
    geolocationMatch: true, // Simplified - would do real geolocation matching
  };
}

// Helper function to calculate recipient risk
async function calculateRecipientRisk(recipientId?: string, senderId?: string): Promise<{ score: number; isNewRecipient: boolean }> {
  if (!recipientId || !senderId) {
    return { score: 50, isNewRecipient: true }; // Default medium risk for unknown recipients
  }

  // Check if this is a new recipient for the sender
  const previousTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, senderId))
    .limit(10);

  // Simplified recipient analysis
  const isNewRecipient = true; // Would check friend networks and previous transactions
  const score = isNewRecipient ? 60 : 20; // Higher risk for new recipients

  return { score, isNewRecipient };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const assessmentRequest = assessTransactionSchema.parse(body);

    // Gather comprehensive user metrics
    const userMetrics = await gatherUserMetrics(assessmentRequest.userId);

    // Extract request context
    const userAgent = assessmentRequest.userAgent || request.headers.get('user-agent') || 'unknown';
    const ipAddress = assessmentRequest.ipAddress || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    // Analyze network context
    const networkContext = analyzeNetworkContext(ipAddress, userAgent);

    // Calculate recipient risk
    const recipientRisk = await calculateRecipientRisk(
      assessmentRequest.recipientId, 
      assessmentRequest.userId
    );

    // Determine device type from user agent if not provided
    let deviceType = assessmentRequest.deviceType;
    if (!deviceType) {
      if (userAgent.includes('Mobile')) deviceType = 'mobile';
      else if (userAgent.includes('Tablet')) deviceType = 'tablet';
      else deviceType = 'desktop';
    }

    // Build transaction pattern for AI analysis
    const currentTime = new Date();
    const transactionPattern: TransactionPattern = {
      userId: assessmentRequest.userId,
      transactionId: assessmentRequest.transactionId,
      amount: assessmentRequest.amount,
      currency: assessmentRequest.currency,
      timestamp: currentTime,
      
      userMetrics: {
        accountAge: userMetrics.accountAge,
        totalTransactions: userMetrics.totalTransactions,
        averageTransactionAmount: userMetrics.averageTransactionAmount,
        frequentCountries: userMetrics.frequentCountries,
        deviceFingerprints: userMetrics.deviceFingerprints,
        ipAddresses: userMetrics.ipAddresses,
      },
      
      context: {
        deviceType,
        ipAddress,
        userAgent,
        location: {
          country: 'ZW', // Would extract from IP geolocation
          city: 'Harare',
          timezone: 'Africa/Harare',
        },
        sessionDuration: assessmentRequest.sessionDuration || 10, // Default 10 minutes
      },
      
      financial: {
        timeOfDay: currentTime.getHours(),
        dayOfWeek: currentTime.getDay(),
        velocityLast24h: userMetrics.velocityLast24h,
        amountLast24h: userMetrics.amountLast24h,
        isNewRecipient: recipientRisk.isNewRecipient,
        recipientRiskScore: recipientRisk.score,
        crossBorderIndicator: assessmentRequest.currency !== 'ZWL',
      },
      
      network: networkContext,
    };

    // Run AI fraud detection
    const fraudAssessment = await fraudDetectionEngine.assessTransaction(transactionPattern);

    // Store fraud score in database
    await db.insert(fraudScores).values({
      userId: assessmentRequest.userId,
      transactionId: assessmentRequest.transactionId,
      riskScore: fraudAssessment.overallRiskScore,
      riskLevel: fraudAssessment.riskLevel,
      riskFactors: JSON.stringify(fraudAssessment.explanations),
      geoLocation: `${transactionPattern.context.location.city}, ${transactionPattern.context.location.country}`,
      deviceFingerprint: `${deviceType}:${userAgent.substring(0, 100)}`,
      actionTaken: fraudAssessment.finalRecommendation === 'block' ? 'blocked' : 
                   fraudAssessment.finalRecommendation === 'review' ? 'flagged' : 'none',
    });

    // Return comprehensive assessment
    return NextResponse.json({
      success: true,
      assessment: {
        transactionId: fraudAssessment.transactionId,
        riskScore: fraudAssessment.overallRiskScore,
        riskLevel: fraudAssessment.riskLevel,
        recommendation: fraudAssessment.finalRecommendation,
        explanations: fraudAssessment.explanations,
        processingTime: fraudAssessment.processingTime,
        
        // Detailed breakdown
        modelPredictions: fraudAssessment.predictions.map(pred => ({
          model: pred.modelId,
          score: pred.riskScore,
          confidence: Math.round(pred.confidence * 100),
          factors: pred.riskFactors,
          recommendation: pred.recommendation,
        })),
        
        // Context used in analysis
        analysisContext: {
          userAge: userMetrics.accountAge,
          transactionVelocity: userMetrics.velocityLast24h,
          amountDeviation: assessmentRequest.amount / Math.max(userMetrics.averageTransactionAmount, 1),
          deviceTrust: networkContext.vpnDetected ? 'low' : 'high',
          recipientTrust: recipientRisk.isNewRecipient ? 'new' : 'known',
        },
      },
      
      // Recommended actions
      actions: {
        requireMFA: fraudAssessment.riskLevel === 'high' || fraudAssessment.riskLevel === 'critical',
        requireManualReview: fraudAssessment.finalRecommendation === 'review',
        blockTransaction: fraudAssessment.finalRecommendation === 'block',
        additionalVerification: fraudAssessment.overallRiskScore > 60,
      },
    });
  } catch (error) {
    console.error("Fraud assessment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to assess transaction for fraud" },
      { status: 500 }
    );
  }
}