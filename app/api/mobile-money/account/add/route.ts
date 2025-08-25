import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../_lib/drizzle";
import { mobileMoneyAccounts, users } from "../../../../../shared/schema";
import { eq, and } from "drizzle-orm";

const addMobileMoneyAccountSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  provider: z.enum(["ecocash", "telecash", "onemoney"]),
  phoneNumber: z.string().min(9, "Invalid phone number"),
  accountName: z.string().min(2, "Account name is required"),
  dailyLimit: z.number().min(10).max(5000).default(1000),
  monthlyLimit: z.number().min(100).max(50000).default(10000),
});

// Provider configurations
const PROVIDER_CONFIG = {
  ecocash: {
    name: "EcoCash",
    ussdCode: "*151#",
    verificationMethod: "ussd",
    maxDailyLimit: 5000,
    fees: {
      base: 0.05, // 5%
      minimum: 0.10,
      maximum: 5.00,
    },
  },
  telecash: {
    name: "TeleCash",
    ussdCode: "*482#",
    verificationMethod: "sms",
    maxDailyLimit: 3000,
    fees: {
      base: 0.04, // 4%
      minimum: 0.15,
      maximum: 4.00,
    },
  },
  onemoney: {
    name: "OneMoney",
    ussdCode: "*111#",
    verificationMethod: "api",
    maxDailyLimit: 2000,
    fees: {
      base: 0.06, // 6%
      minimum: 0.20,
      maximum: 3.00,
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, provider, phoneNumber, accountName, dailyLimit, monthlyLimit } = 
      addMobileMoneyAccountSchema.parse(body);

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if account already exists for this provider and phone
    const existingAccount = await db
      .select()
      .from(mobileMoneyAccounts)
      .where(
        and(
          eq(mobileMoneyAccounts.userId, userId),
          eq(mobileMoneyAccounts.provider, provider),
          eq(mobileMoneyAccounts.phoneNumber, phoneNumber)
        )
      )
      .limit(1);

    if (existingAccount.length > 0) {
      return NextResponse.json(
        { error: "Mobile money account already exists for this provider and phone number" },
        { status: 409 }
      );
    }

    // Validate limits against provider maximum
    const providerConfig = PROVIDER_CONFIG[provider];
    if (dailyLimit > providerConfig.maxDailyLimit) {
      return NextResponse.json(
        { 
          error: `Daily limit exceeds ${providerConfig.name} maximum of $${providerConfig.maxDailyLimit}`,
          maxLimit: providerConfig.maxDailyLimit
        },
        { status: 400 }
      );
    }

    // Generate verification code (6 digits)
    const verificationCode = Math.random().toString().slice(2, 8);
    const verificationExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create mobile money account
    const newAccount = await db
      .insert(mobileMoneyAccounts)
      .values({
        userId,
        provider,
        phoneNumber,
        accountName,
        dailyLimit: dailyLimit.toString(),
        monthlyLimit: monthlyLimit.toString(),
        verificationMethod: providerConfig.verificationMethod,
        verificationCode,
        verificationExpiresAt,
      })
      .returning();

    // Simulate verification process based on provider
    let verificationInstructions = "";
    switch (provider) {
      case "ecocash":
        verificationInstructions = `Dial ${providerConfig.ussdCode} and follow the prompts to verify your account. Use code: ${verificationCode}`;
        break;
      case "telecash":
        verificationInstructions = `You will receive an SMS with verification instructions. Code: ${verificationCode}`;
        break;
      case "onemoney":
        verificationInstructions = `Account verification is automatic. Code: ${verificationCode}`;
        break;
    }

    return NextResponse.json({
      success: true,
      account: {
        id: newAccount[0].id,
        provider: newAccount[0].provider,
        phoneNumber: newAccount[0].phoneNumber,
        accountName: newAccount[0].accountName,
        isVerified: newAccount[0].isVerified,
        dailyLimit: newAccount[0].dailyLimit,
        monthlyLimit: newAccount[0].monthlyLimit,
      },
      verification: {
        method: providerConfig.verificationMethod,
        instructions: verificationInstructions,
        expiresAt: verificationExpiresAt.toISOString(),
      },
      providerInfo: {
        name: providerConfig.name,
        ussdCode: providerConfig.ussdCode,
        maxDailyLimit: providerConfig.maxDailyLimit,
        fees: providerConfig.fees,
      },
    });
  } catch (error) {
    console.error("Add mobile money account error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add mobile money account" },
      { status: 500 }
    );
  }
}