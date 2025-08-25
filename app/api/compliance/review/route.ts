import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { 
  crossBorderPayments, 
  fraudScores, 
  users 
} from "../../../../shared/schema";
import { eq, and, desc, gte } from "drizzle-orm";

const complianceReviewSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
  action: z.enum(["approve", "reject", "request_documents"]),
  notes: z.string().max(1000, "Notes too long").optional(),
  reviewedBy: z.string().min(1, "Reviewer ID required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, action, notes, reviewedBy } = complianceReviewSchema.parse(body);

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

    // Check if payment is in compliance hold
    if (paymentRecord.status !== "compliance_hold" && paymentRecord.complianceStatus === "flagged") {
      return NextResponse.json(
        { error: "Payment is not in compliance review state" },
        { status: 400 }
      );
    }

    let newStatus = paymentRecord.status;
    let newComplianceStatus = paymentRecord.complianceStatus;

    switch (action) {
      case "approve":
        newStatus = "processing";
        newComplianceStatus = "approved";
        break;
      case "reject":
        newStatus = "failed";
        newComplianceStatus = "rejected";
        break;
      case "request_documents":
        newStatus = "compliance_hold";
        newComplianceStatus = "documents_requested";
        break;
    }

    // Update payment record
    await db
      .update(crossBorderPayments)
      .set({
        status: newStatus,
        complianceStatus: newComplianceStatus,
        complianceNotes: notes || null,
      })
      .where(eq(crossBorderPayments.id, paymentId));

    // Update fraud score with review action
    await db
      .update(fraudScores)
      .set({
        actionTaken: action === "approve" ? "approved" : "blocked",
        reviewedBy,
        reviewNotes: notes,
        reviewedAt: new Date(),
      })
      .where(eq(fraudScores.crossBorderPaymentId, paymentId));

    return NextResponse.json({
      success: true,
      action,
      newStatus,
      newComplianceStatus,
      message: `Payment ${action}d successfully`,
    });
  } catch (error) {
    console.error("Compliance review error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process compliance review" },
      { status: 500 }
    );
  }
}

// Get payments requiring compliance review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "flagged";
    const limit = parseInt(searchParams.get("limit") || "50");

    const paymentsNeedingReview = await db
      .select({
        id: crossBorderPayments.id,
        senderAmount: crossBorderPayments.senderAmount,
        senderCurrency: crossBorderPayments.senderCurrency,
        recipientAmount: crossBorderPayments.recipientAmount,
        recipientCurrency: crossBorderPayments.recipientCurrency,
        status: crossBorderPayments.status,
        complianceStatus: crossBorderPayments.complianceStatus,
        purpose: crossBorderPayments.purpose,
        createdAt: crossBorderPayments.createdAt,
        sender: {
          id: users.id,
          fullName: users.fullName,
          kycStatus: users.kycStatus,
          countryCode: users.countryCode,
        },
        riskScore: fraudScores.riskScore,
        riskLevel: fraudScores.riskLevel,
        riskFactors: fraudScores.riskFactors,
      })
      .from(crossBorderPayments)
      .leftJoin(users, eq(crossBorderPayments.senderId, users.id))
      .leftJoin(fraudScores, eq(fraudScores.crossBorderPaymentId, crossBorderPayments.id))
      .where(
        and(
          eq(crossBorderPayments.complianceStatus, status),
          gte(crossBorderPayments.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        )
      )
      .orderBy(desc(crossBorderPayments.createdAt))
      .limit(limit);

    return NextResponse.json({
      success: true,
      payments: paymentsNeedingReview,
      count: paymentsNeedingReview.length,
    });
  } catch (error) {
    console.error("Get compliance review queue error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve compliance review queue" },
      { status: 500 }
    );
  }
}