import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { users } from "../../../../../shared/schema";
import { eq } from "drizzle-orm";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

const setupMFASchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = setupMFASchema.parse(body);

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `PayPass (${user[0].fullName})`,
      issuer: "PayPass",
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Store the secret temporarily (in real app, store encrypted)
    await db
      .update(users)
      .set({ mfaSecret: secret.base32 })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
      message: "Scan the QR code with your authenticator app",
    });
  } catch (error) {
    console.error("Setup MFA error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to setup MFA" },
      { status: 500 }
    );
  }
}