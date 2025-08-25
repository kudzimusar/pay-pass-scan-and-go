import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { 
  crossBorderPayments, 
  wallets, 
  transactions, 
  users 
} from "../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const completePaymentSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  providerReference: z.string().optional(),
  transactionHash: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, providerReference, transactionHash } = completePaymentSchema.parse(body);

    // Get payment details
    const payment = await db
      .select()
      .from(crossBorderPayments)
      .where(eq(crossBorderPayments.id, paymentId))
      .limit(1);

    if (!payment.length) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentRecord = payment[0];

    // Check if payment is in a state that can be completed
    if (paymentRecord.status !== "processing") {
      return NextResponse.json(
        { error: "Payment is not in processing state" },
        { status: 400 }
      );
    }

    // Get recipient wallet
    const recipientWallet = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, paymentRecord.recipientId))
      .limit(1);

    if (!recipientWallet.length) {
      return NextResponse.json({ error: "Recipient wallet not found" }, { status: 404 });
    }

    // Add funds to recipient wallet
    const recipientCurrency = paymentRecord.recipientCurrency.toLowerCase();
    const balanceField = `${recipientCurrency}Balance` as keyof typeof recipientWallet[0];
    const currentBalance = parseFloat(recipientWallet[0][balanceField] as string || "0");
    const recipientAmount = parseFloat(paymentRecord.recipientAmount);
    const newBalance = (currentBalance + recipientAmount).toFixed(2);

    // Update recipient wallet
    await db
      .update(wallets)
      .set({ [balanceField]: newBalance })
      .where(eq(wallets.userId, paymentRecord.recipientId));

    // Create recipient transaction record
    await db.insert(transactions).values({
      userId: paymentRecord.recipientId,
      type: "receive",
      category: "friend_payment",
      amount: paymentRecord.recipientAmount,
      currency: paymentRecord.recipientCurrency,
      description: `Received from international friend - ${paymentRecord.purpose}`,
      status: "completed",
      paymentMethod: "cross_border_transfer",
      crossBorderPaymentId: paymentId,
      reference: providerReference,
    });

    // Update payment status to completed
    await db
      .update(crossBorderPayments)
      .set({
        status: "completed",
        completedAt: new Date(),
        providerReference,
        transactionHash,
      })
      .where(eq(crossBorderPayments.id, paymentId));

    // Get updated payment record with user details
    const completedPayment = await db
      .select({
        id: crossBorderPayments.id,
        senderAmount: crossBorderPayments.senderAmount,
        senderCurrency: crossBorderPayments.senderCurrency,
        recipientAmount: crossBorderPayments.recipientAmount,
        recipientCurrency: crossBorderPayments.recipientCurrency,
        status: crossBorderPayments.status,
        completedAt: crossBorderPayments.completedAt,
        purpose: crossBorderPayments.purpose,
        sender: users.fullName,
      })
      .from(crossBorderPayments)
      .leftJoin(users, eq(crossBorderPayments.senderId, users.id))
      .where(eq(crossBorderPayments.id, paymentId))
      .limit(1);

    return NextResponse.json({
      success: true,
      payment: completedPayment[0],
      message: "Payment completed successfully",
    });
  } catch (error) {
    console.error("Complete payment error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete payment" },
      { status: 500 }
    );
  }
}