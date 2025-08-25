import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/drizzle";
import { crossBorderPayments, users } from "../../../../shared/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");
    const userId = searchParams.get("userId");

    if (paymentId) {
      // Get specific payment status
      const payment = await db
        .select({
          id: crossBorderPayments.id,
          senderAmount: crossBorderPayments.senderAmount,
          senderCurrency: crossBorderPayments.senderCurrency,
          recipientAmount: crossBorderPayments.recipientAmount,
          recipientCurrency: crossBorderPayments.recipientCurrency,
          status: crossBorderPayments.status,
          complianceStatus: crossBorderPayments.complianceStatus,
          purpose: crossBorderPayments.purpose,
          estimatedDelivery: crossBorderPayments.estimatedDelivery,
          completedAt: crossBorderPayments.completedAt,
          createdAt: crossBorderPayments.createdAt,
          sender: {
            id: users.id,
            fullName: users.fullName,
          },
        })
        .from(crossBorderPayments)
        .leftJoin(users, eq(crossBorderPayments.senderId, users.id))
        .where(eq(crossBorderPayments.id, paymentId))
        .limit(1);

      if (!payment.length) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        payment: payment[0],
      });
    }

    if (userId) {
      // Get user's payment history
      const payments = await db
        .select({
          id: crossBorderPayments.id,
          senderAmount: crossBorderPayments.senderAmount,
          senderCurrency: crossBorderPayments.senderCurrency,
          recipientAmount: crossBorderPayments.recipientAmount,
          recipientCurrency: crossBorderPayments.recipientCurrency,
          status: crossBorderPayments.status,
          purpose: crossBorderPayments.purpose,
          createdAt: crossBorderPayments.createdAt,
          completedAt: crossBorderPayments.completedAt,
        })
        .from(crossBorderPayments)
        .where(eq(crossBorderPayments.senderId, userId))
        .orderBy(desc(crossBorderPayments.createdAt))
        .limit(50);

      return NextResponse.json({
        success: true,
        payments,
        count: payments.length,
      });
    }

    return NextResponse.json({ error: "Payment ID or User ID is required" }, { status: 400 });
  } catch (error) {
    console.error("Cross-border payment status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve payment status" },
      { status: 500 }
    );
  }
}