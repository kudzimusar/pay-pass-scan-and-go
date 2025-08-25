import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { identityVerifications, users } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

const submitIdentitySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  documentType: z.enum(["passport", "national_id", "drivers_license"]),
  documentNumber: z.string().min(5, "Document number is required"),
  documentCountry: z.string().length(2, "Country code must be 2 characters"),
  documentExpiry: z.string().datetime().optional(),
  frontImageUrl: z.string().url("Invalid front image URL"),
  backImageUrl: z.string().url("Invalid back image URL").optional(),
  selfieUrl: z.string().url("Invalid selfie URL"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      documentType,
      documentNumber,
      documentCountry,
      documentExpiry,
      frontImageUrl,
      backImageUrl,
      selfieUrl,
    } = submitIdentitySchema.parse(body);

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user already has pending or verified verification
    const existingVerification = await db
      .select()
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, userId))
      .limit(1);

    if (existingVerification.length > 0) {
      const status = existingVerification[0].status;
      if (status === "verified") {
        return NextResponse.json(
          { error: "Identity already verified" },
          { status: 409 }
        );
      }
      if (status === "pending") {
        return NextResponse.json(
          { error: "Verification already pending review" },
          { status: 409 }
        );
      }
    }

    // Create identity verification record
    const verification = await db
      .insert(identityVerifications)
      .values({
        userId,
        documentType,
        documentNumber,
        documentCountry,
        documentExpiry: documentExpiry ? new Date(documentExpiry) : null,
        frontImageUrl,
        backImageUrl,
        selfieUrl,
        status: "pending",
        verificationMethod: "manual",
      })
      .returning();

    // Update user KYC status to pending if not already set
    if (user[0].kycStatus === "pending") {
      await db
        .update(users)
        .set({ kycStatus: "pending" })
        .where(eq(users.id, userId));
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification[0].id,
        status: verification[0].status,
        documentType: verification[0].documentType,
        createdAt: verification[0].createdAt,
      },
      message: "Identity verification submitted successfully. Review typically takes 1-3 business days.",
    });
  } catch (error) {
    console.error("Submit identity verification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit identity verification" },
      { status: 500 }
    );
  }
}