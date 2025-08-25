import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { users } from "../../../../../shared/schema";
import { eq } from "drizzle-orm";
import * as speakeasy from "speakeasy";

const verifyMFASchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  token: z.string().length(6, "Token must be 6 digits"),
  setup: z.boolean().default(false), // If true, this is for enabling MFA
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, setup } = verifyMFASchema.parse(body);

    // Get user with MFA secret
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user[0].mfaSecret) {
      return NextResponse.json({ error: "MFA not configured" }, { status: 400 });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: user[0].mfaSecret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps of tolerance
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid MFA token" }, { status: 400 });
    }

    // If this is for MFA setup, enable MFA for the user
    if (setup) {
      await db
        .update(users)
        .set({ mfaEnabled: true })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: "MFA enabled successfully",
        mfaEnabled: true,
      });
    }

    // For login verification, return success
    return NextResponse.json({
      success: true,
      message: "MFA token verified",
      verified: true,
    });
  } catch (error) {
    console.error("Verify MFA error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify MFA token" },
      { status: 500 }
    );
  }
}