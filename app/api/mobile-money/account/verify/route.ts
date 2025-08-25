import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { mobileMoneyAccounts } from "../../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const verifyMobileMoneyAccountSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  verificationCode: z.string().length(6, "Verification code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountId, verificationCode } = verifyMobileMoneyAccountSchema.parse(body);

    // Get account details
    const account = await db
      .select()
      .from(mobileMoneyAccounts)
      .where(eq(mobileMoneyAccounts.id, accountId))
      .limit(1);

    if (!account.length) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accountRecord = account[0];

    // Check if account is already verified
    if (accountRecord.isVerified) {
      return NextResponse.json(
        { error: "Account is already verified" },
        { status: 409 }
      );
    }

    // Check if verification code has expired
    if (accountRecord.verificationExpiresAt && 
        new Date() > accountRecord.verificationExpiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Verify the code
    if (accountRecord.verificationCode !== verificationCode) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Update account as verified
    const updatedAccount = await db
      .update(mobileMoneyAccounts)
      .set({
        isVerified: true,
        verificationCode: null, // Clear the code
        verificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(mobileMoneyAccounts.id, accountId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Mobile money account verified successfully",
      account: {
        id: updatedAccount[0].id,
        provider: updatedAccount[0].provider,
        phoneNumber: updatedAccount[0].phoneNumber,
        accountName: updatedAccount[0].accountName,
        isVerified: updatedAccount[0].isVerified,
        dailyLimit: updatedAccount[0].dailyLimit,
        monthlyLimit: updatedAccount[0].monthlyLimit,
      },
    });
  } catch (error) {
    console.error("Verify mobile money account error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify mobile money account" },
      { status: 500 }
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
