import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { 
  BankProviderFactory, 
  bankTransferRequestSchema,
  type BankTransferRequest 
} from "../../../_lib/bank-integration";
import { 
  users, 
  wallets, 
  transactions, 
  crossBorderPayments 
} from "../../../../../shared/schema";
import { eq } from "drizzle-orm";

const initiateBankTransferSchema = bankTransferRequestSchema.extend({
  userId: z.string().uuid("Invalid user ID"),
  deductFromWallet: z.boolean().default(true),
  crossBorderPaymentId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transferRequest = initiateBankTransferSchema.parse(body);

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, transferRequest.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For international users, require KYC verification for large transfers
    if (user[0].isInternational && transferRequest.amount > 5000 && user[0].kycStatus !== "verified") {
      return NextResponse.json(
        { error: "KYC verification required for transfers over $5,000" },
        { status: 403 }
      );
    }

    // Get user wallet if deducting from wallet
    let userWallet = null;
    if (transferRequest.deductFromWallet) {
      const walletResult = await db
        .select()
        .from(wallets)
        .where(eq(wallets.userId, transferRequest.userId))
        .limit(1);

      if (!walletResult.length) {
        return NextResponse.json({ error: "User wallet not found" }, { status: 404 });
      }

      userWallet = walletResult[0];

      // Check wallet balance
      const balanceField = `${transferRequest.currency.toLowerCase()}Balance` as keyof typeof userWallet;
      const currentBalance = parseFloat(userWallet[balanceField] as string || "0");

      if (currentBalance < transferRequest.amount) {
        return NextResponse.json(
          { 
            error: "Insufficient wallet balance",
            available: currentBalance,
            required: transferRequest.amount,
            currency: transferRequest.currency
          },
          { status: 400 }
        );
      }
    }

    // Create bank provider instance
    const bankProvider = BankProviderFactory.createProvider(transferRequest.providerId);

    // Validate recipient bank account
    const accountValidation = await bankProvider.validateAccount(transferRequest.toAccount);
    if (!accountValidation.valid) {
      return NextResponse.json(
        { error: "Invalid recipient bank account details" },
        { status: 400 }
      );
    }

    // Create transaction record before initiating transfer
    const transactionRecord = await db
      .insert(transactions)
      .values({
        userId: transferRequest.userId,
        type: "send",
        category: "transfer",
        amount: transferRequest.amount.toString(),
        currency: transferRequest.currency,
        description: `Bank transfer to ${transferRequest.toAccount.accountHolderName} - ${transferRequest.purpose}`,
        status: "pending",
        paymentMethod: "bank_transfer",
        reference: transferRequest.reference,
        crossBorderPaymentId: transferRequest.crossBorderPaymentId,
      })
      .returning();

    try {
      // Initiate bank transfer
      const transferResult = await bankProvider.initiateTransfer({
        providerId: transferRequest.providerId,
        fromAccount: transferRequest.fromAccount,
        toAccount: transferRequest.toAccount,
        amount: transferRequest.amount,
        currency: transferRequest.currency,
        purpose: transferRequest.purpose,
        reference: transferRequest.reference,
      });

      // Update transaction with bank transfer results
      await db
        .update(transactions)
        .set({
          status: transferResult.success ? "processing" : "failed",
          reference: transferResult.providerReference,
        })
        .where(eq(transactions.id, transactionRecord[0].id));

      if (transferResult.success) {
        // Deduct from wallet if requested
        if (transferRequest.deductFromWallet && userWallet) {
          const balanceField = `${transferRequest.currency.toLowerCase()}Balance` as keyof typeof userWallet;
          const currentBalance = parseFloat(userWallet[balanceField] as string || "0");
          const totalAmount = transferRequest.amount + transferResult.fees.total;
          const newBalance = (currentBalance - totalAmount).toFixed(2);

          await db
            .update(wallets)
            .set({ [balanceField]: newBalance })
            .where(eq(wallets.userId, transferRequest.userId));
        }

        // Update cross-border payment if applicable
        if (transferRequest.crossBorderPaymentId) {
          await db
            .update(crossBorderPayments)
            .set({
              status: "processing",
              providerReference: transferResult.providerReference,
            })
            .where(eq(crossBorderPayments.id, transferRequest.crossBorderPaymentId));
        }

        return NextResponse.json({
          success: true,
          transfer: {
            id: transactionRecord[0].id,
            transactionId: transferResult.transactionId,
            providerReference: transferResult.providerReference,
            status: transferResult.status,
            amount: transferRequest.amount,
            currency: transferRequest.currency,
            estimatedCompletion: transferResult.estimatedCompletion,
            fees: transferResult.fees,
          },
          message: "Bank transfer initiated successfully",
        });
      } else {
        return NextResponse.json({
          success: false,
          error: transferResult.errorMessage || "Bank transfer failed",
          transfer: {
            id: transactionRecord[0].id,
            status: "failed",
            fees: transferResult.fees,
          },
        }, { status: 400 });
      }
    } catch (bankError) {
      // Update transaction as failed
      await db
        .update(transactions)
        .set({
          status: "failed",
        })
        .where(eq(transactions.id, transactionRecord[0].id));

      console.error("Bank transfer error:", bankError);
      return NextResponse.json(
        { error: "Bank transfer processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Initiate bank transfer error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initiate bank transfer" },
      { status: 500 }
    );
  }
}