import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { 
  crossBorderPayments, 
  friendNetworks, 
  users, 
  wallets,
  exchangeRates,
  fraudScores,
  transactions 
} from "../../../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

const initiateCrossBorderPaymentSchema = z.object({
  senderId: z.string().uuid("Invalid sender ID"),
  recipientId: z.string().uuid("Invalid recipient ID"),
  senderAmount: z.number().min(1, "Amount must be at least $1").max(10000, "Amount cannot exceed $10,000"),
  senderCurrency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
  recipientCurrency: z.enum(["USD", "ZWL"]),
  paymentMethod: z.enum(["wallet", "bank_transfer", "card"]),
  purpose: z.string().min(5, "Purpose description is required").max(500),
  friendNetworkId: z.string().uuid().optional(),
});

// Simple fraud detection rules
function calculateRiskScore(
  sender: any,
  amount: number,
  recentTransactions: number,
  isNewRecipient: boolean
): { score: number; level: string; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Amount-based risk
  if (amount > 5000) {
    score += 30;
    factors.push("high_amount");
  } else if (amount > 1000) {
    score += 15;
    factors.push("medium_amount");
  }

  // Account age risk
  const accountAgeMs = Date.now() - new Date(sender.createdAt).getTime();
  const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);
  if (accountAgeDays < 30) {
    score += 25;
    factors.push("new_account");
  }

  // Transaction frequency risk
  if (recentTransactions > 10) {
    score += 20;
    factors.push("high_frequency");
  }

  // New recipient risk
  if (isNewRecipient) {
    score += 15;
    factors.push("new_recipient");
  }

  // KYC status risk
  if (sender.kycStatus !== "verified") {
    score += 40;
    factors.push("unverified_kyc");
  }

  let level = "low";
  if (score >= 70) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 30) level = "medium";

  return { score: Math.min(score, 100), level, factors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      senderId,
      recipientId,
      senderAmount,
      senderCurrency,
      recipientCurrency,
      paymentMethod,
      purpose,
      friendNetworkId,
    } = initiateCrossBorderPaymentSchema.parse(body);

    // Verify sender and recipient exist
    const [sender, recipient] = await Promise.all([
      db.select().from(users).where(eq(users.id, senderId)).limit(1),
      db.select().from(users).where(eq(users.id, recipientId)).limit(1),
    ]);

    if (!sender.length || !recipient.length) {
      return NextResponse.json({ error: "Sender or recipient not found" }, { status: 404 });
    }

    // Verify sender is international user
    if (!sender[0].isInternational) {
      return NextResponse.json(
        { error: "Only international users can initiate cross-border payments" },
        { status: 403 }
      );
    }

    // Verify KYC status for high-value transactions
    if (senderAmount > 1000 && sender[0].kycStatus !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required for transactions over $1,000" },
        { status: 403 }
      );
    }

    // Get current exchange rate
    const exchangeRate = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.fromCurrency, senderCurrency),
          eq(exchangeRates.toCurrency, recipientCurrency),
          eq(exchangeRates.isActive, true)
        )
      )
      .orderBy(desc(exchangeRates.createdAt))
      .limit(1);

    if (!exchangeRate.length) {
      return NextResponse.json(
        { error: `Exchange rate not available for ${senderCurrency} to ${recipientCurrency}` },
        { status: 400 }
      );
    }

    const rate = parseFloat(exchangeRate[0].rate);
    const recipientAmount = senderAmount * rate;

    // Calculate fees (2% exchange fee + $2 transfer fee)
    const exchangeFee = senderAmount * 0.02;
    const transferFee = 2.0;
    const totalFees = exchangeFee + transferFee;

    // Check wallet balance
    const senderWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, senderId))
      .limit(1);

    if (!senderWallet.length) {
      return NextResponse.json({ error: "Sender wallet not found" }, { status: 404 });
    }

    const balanceField = `${senderCurrency.toLowerCase()}Balance` as keyof typeof senderWallet[0];
    const currentBalance = parseFloat(senderWallet[0][balanceField] as string || "0");
    const totalAmount = senderAmount + totalFees;

    if (currentBalance < totalAmount) {
      return NextResponse.json(
        { 
          error: "Insufficient balance",
          required: totalAmount.toFixed(2),
          available: currentBalance.toFixed(2),
          currency: senderCurrency
        },
        { status: 400 }
      );
    }

    // Verify friend network connection if provided
    let friendNetwork = null;
    if (friendNetworkId) {
      const friendNetworkResult = await db
        .select()
        .from(friendNetworks)
        .where(
          and(
            eq(friendNetworks.id, friendNetworkId),
            eq(friendNetworks.senderId, senderId),
            eq(friendNetworks.recipientId, recipientId)
          )
        )
        .limit(1);

      if (!friendNetworkResult.length) {
        return NextResponse.json({ error: "Friend network connection not found" }, { status: 404 });
      }

      friendNetwork = friendNetworkResult[0];

      // Check monthly limit
      const monthlySpent = parseFloat(friendNetwork.totalSent);
      const monthlyLimit = parseFloat(friendNetwork.monthlyLimit);

      if (monthlySpent + senderAmount > monthlyLimit) {
        return NextResponse.json(
          { 
            error: "Monthly limit exceeded",
            limit: monthlyLimit,
            spent: monthlySpent,
            attempted: senderAmount
          },
          { status: 400 }
        );
      }
    }

    // Fraud detection
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, senderId))
      .limit(20);

    const isNewRecipient = !friendNetwork;
    const riskAssessment = calculateRiskScore(
      sender[0],
      senderAmount,
      recentTransactions.length,
      isNewRecipient
    );

    // Create cross-border payment record
    const crossBorderPayment = await db
      .insert(crossBorderPayments)
      .values({
        senderId,
        recipientId,
        friendNetworkId,
        senderAmount: senderAmount.toString(),
        senderCurrency,
        recipientAmount: recipientAmount.toString(),
        recipientCurrency,
        exchangeRate: rate.toString(),
        exchangeFee: exchangeFee.toString(),
        transferFee: transferFee.toString(),
        totalFees: totalFees.toString(),
        paymentMethod,
        purpose,
        status: riskAssessment.level === "critical" ? "compliance_hold" : "pending",
        complianceStatus: riskAssessment.level === "critical" ? "flagged" : "pending",
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      .returning();

    // Record fraud score
    await db.insert(fraudScores).values({
      userId: senderId,
      crossBorderPaymentId: crossBorderPayment[0].id,
      riskScore: riskAssessment.score,
      riskLevel: riskAssessment.level,
      riskFactors: JSON.stringify(riskAssessment.factors),
      actionTaken: riskAssessment.level === "critical" ? "manual_review" : "none",
    });

    // If not flagged, process the payment
    if (riskAssessment.level !== "critical") {
      // Deduct from sender wallet
      const newBalance = (currentBalance - totalAmount).toFixed(2);
      await db
        .update(wallets)
        .set({ [balanceField]: newBalance })
        .where(eq(wallets.userId, senderId));

      // Create transaction record
      await db.insert(transactions).values({
        userId: senderId,
        type: "cross_border",
        category: "friend_payment",
        amount: totalAmount.toString(),
        currency: senderCurrency,
        description: `Cross-border payment to ${recipient[0].fullName} - ${purpose}`,
        status: "pending",
        paymentMethod,
        crossBorderPaymentId: crossBorderPayment[0].id,
        exchangeRate: rate.toString(),
        fees: totalFees.toString(),
      });

      // Update friend network totals if applicable
      if (friendNetwork) {
        const newTotalSent = (parseFloat(friendNetwork.totalSent) + senderAmount).toString();
        await db
          .update(friendNetworks)
          .set({
            totalSent: newTotalSent,
            lastPaymentAt: new Date(),
          })
          .where(eq(friendNetworks.id, friendNetworkId!));
      }

      // Update payment status to processing
      await db
        .update(crossBorderPayments)
        .set({ status: "processing" })
        .where(eq(crossBorderPayments.id, crossBorderPayment[0].id));
    }

    return NextResponse.json({
      success: true,
      payment: crossBorderPayment[0],
      riskAssessment: {
        level: riskAssessment.level,
        score: riskAssessment.score,
        requiresReview: riskAssessment.level === "critical",
      },
      fees: {
        exchangeFee: exchangeFee.toFixed(2),
        transferFee: transferFee.toFixed(2),
        total: totalFees.toFixed(2),
      },
      conversion: {
        rate,
        senderAmount,
        recipientAmount: recipientAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error("Cross-border payment initiation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initiate cross-border payment" },
      { status: 500 }
    );
  }
}