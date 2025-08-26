import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { 
  mobileMoneyAccounts, 
  mobileMoneyTransactions, 
  wallets, 
  transactions 
} from "../../../../../shared/schema";
import { eq } from "drizzle-orm";

const topupSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  accountId: z.string().uuid("Invalid account ID"),
  amount: z.number().min(1, "Amount must be at least $1").max(5000, "Amount cannot exceed $5,000"),
  currency: z.enum(["USD", "ZWL"]).default("USD"),
  description: z.string().max(500, "Description too long").optional(),
});

// Calculate mobile money fees based on provider
function calculateFees(provider: string, amount: number) {
  const feeStructures = {
    ecocash: { base: 0.05, minimum: 0.10, maximum: 5.00 },
    telecash: { base: 0.04, minimum: 0.15, maximum: 4.00 },
    onemoney: { base: 0.06, minimum: 0.20, maximum: 3.00 },
  };

  const structure = feeStructures[provider as keyof typeof feeStructures];
  if (!structure) return { providerFee: 0, platformFee: 0 };

  const calculatedFee = amount * structure.base;
  const providerFee = Math.max(structure.minimum, Math.min(calculatedFee, structure.maximum));
  const platformFee = amount * 0.01; // 1% platform fee

  return { providerFee, platformFee };
}

// Simulate mobile money provider API calls
async function processWithProvider(provider: string, phoneNumber: string, amount: number) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate different success rates for different providers
  const successRates = {
    ecocash: 0.95,
    telecash: 0.90,
    onemoney: 0.85,
  };

  const successRate = successRates[provider as keyof typeof successRates] || 0.90;
  const isSuccessful = Math.random() < successRate;

  if (isSuccessful) {
    return {
      status: "successful",
      providerTransactionId: `${provider.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerReference: `REF_${Date.now()}`,
    };
  } else {
    const errors = [
      "Insufficient balance in mobile money account",
      "Mobile money service temporarily unavailable",
      "Invalid mobile money PIN",
      "Daily limit exceeded",
    ];
    
    return {
      status: "failed",
      failureReason: errors[Math.floor(Math.random() * errors.length)],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accountId, amount, currency, description } = topupSchema.parse(body);

    // Get mobile money account
    const mobileAccount = await db
      .select()
      .from(mobileMoneyAccounts)
      .where(eq(mobileMoneyAccounts.id, accountId))
      .limit(1);

    if (!mobileAccount.length) {
      return NextResponse.json({ error: "Mobile money account not found" }, { status: 404 });
    }

    const account = mobileAccount[0];

    // Verify account belongs to user and is verified
    if (account.userId !== userId) {
      return NextResponse.json({ error: "Account does not belong to user" }, { status: 403 });
    }

    if (!account.isVerified) {
      return NextResponse.json(
        { error: "Mobile money account must be verified before use" },
        { status: 400 }
      );
    }

    if (!account.isActive) {
      return NextResponse.json(
        { error: "Mobile money account is inactive" },
        { status: 400 }
      );
    }

    // Check daily limits
    const dailyLimit = parseFloat(account.dailyLimit);
    if (amount > dailyLimit) {
      return NextResponse.json(
        { 
          error: "Amount exceeds daily limit",
          dailyLimit,
          attempted: amount
        },
        { status: 400 }
      );
    }

    // Get user's wallet
    const userWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    if (!userWallet.length) {
      return NextResponse.json({ error: "User wallet not found" }, { status: 404 });
    }

    // Calculate fees
    const { providerFee, platformFee } = calculateFees(account.provider, amount);
    const totalFees = providerFee + platformFee;

    // Create mobile money transaction record
    const mobileTransaction = await db
      .insert(mobileMoneyTransactions)
      .values({
        userId,
        mobileMoneyAccountId: accountId,
        type: "topup",
        amount: amount.toString(),
        currency,
        description: description || `Top-up from ${account.provider} (${account.phoneNumber})`,
        status: "pending",
        providerFee: providerFee.toString(),
        platformFee: platformFee.toString(),
        totalFees: totalFees.toString(),
      })
      .returning();

    // Process with mobile money provider
    const providerResult = await processWithProvider(
      account.provider, 
      account.phoneNumber, 
      amount
    );

    let finalStatus = "failed";
    let walletUpdated = false;

    if (providerResult.status === "successful") {
      // Update mobile money transaction with provider details
      await db
        .update(mobileMoneyTransactions)
        .set({
          status: "completed",
          providerStatus: "successful",
          providerTransactionId: providerResult.providerTransactionId,
          providerReference: providerResult.providerReference,
          completedAt: new Date(),
        })
        .where(eq(mobileMoneyTransactions.id, mobileTransaction[0].id));

      // Update user wallet balance
      const balanceField = `${currency.toLowerCase()}Balance` as keyof typeof userWallet[0];
      const currentBalance = parseFloat(userWallet[0][balanceField] as string || "0");
      const newBalance = (currentBalance + amount).toFixed(2);

      await db
        .update(wallets)
        .set({ [balanceField]: newBalance })
        .where(eq(wallets.userId, userId));

      // Create main transaction record
      await db.insert(transactions).values({
        userId,
        type: "topup",
        category: "transfer",
        amount: amount.toString(),
        currency,
        description: `Mobile money top-up via ${account.provider}`,
        status: "completed",
        paymentMethod: account.provider,
        reference: providerResult.providerReference,
      });

      // Update account usage tracking
      const newTotalReceived = (parseFloat(account.totalReceived) + amount).toString();
      await db
        .update(mobileMoneyAccounts)
        .set({
          totalReceived: newTotalReceived,
          lastUsedAt: new Date(),
        })
        .where(eq(mobileMoneyAccounts.id, accountId));

      finalStatus = "completed";
      walletUpdated = true;
    } else {
      // Update transaction with failure details
      await db
        .update(mobileMoneyTransactions)
        .set({
          status: "failed",
          providerStatus: "failed",
          failureReason: providerResult.failureReason,
          completedAt: new Date(),
        })
        .where(eq(mobileMoneyTransactions.id, mobileTransaction[0].id));
    }

    return NextResponse.json({
      success: finalStatus === "completed",
      transaction: {
        id: mobileTransaction[0].id,
        amount,
        currency,
        status: finalStatus,
        provider: account.provider,
        providerReference: providerResult.providerTransactionId,
        fees: {
          provider: providerFee.toFixed(2),
          platform: platformFee.toFixed(2),
          total: totalFees.toFixed(2),
        },
      },
      walletUpdated,
      message: finalStatus === "completed" 
        ? "Top-up completed successfully"
        : `Top-up failed: ${providerResult.failureReason}`,
    });
  } catch (error) {
    console.error("Mobile money top-up error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process mobile money top-up" },
      { status: 500 }
    );
  }
}
