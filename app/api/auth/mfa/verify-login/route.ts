import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { db } from "../../../_lib/drizzle"
import { users } from "../../../../../shared/schema"
import { eq } from "drizzle-orm"
import * as speakeasy from "speakeasy"

const verifyLoginMfaSchema = z.object({
  mfaToken: z.string().min(1, "MFA token is required"),
  token: z.string().length(6, "Token must be 6 digits"),
})

/**
 * Verify MFA token during login
 * This endpoint is called after the user has received the MFA prompt
 * and entered their TOTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = verifyLoginMfaSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          details: validation.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { mfaToken, token } = validation.data

    // Verify the temporary MFA token
    let decoded
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET || "your-secret-key-change-in-production") as any

      if (decoded.type !== "mfa_temp") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid MFA token",
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("MFA token verification failed:", error)
      return NextResponse.json(
        {
          success: false,
          message: "MFA token expired or invalid",
        },
        { status: 401 },
      )
    }

    const userId = decoded.userId

    // Get user with MFA secret
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user.length) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    if (!user[0].mfaSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "MFA not configured for this user",
        },
        { status: 400 },
      )
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: user[0].mfaSecret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps of tolerance
    })

    if (!verified) {
      console.warn("Invalid MFA token for user:", user[0].id)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid MFA token",
        },
        { status: 401 },
      )
    }

    console.log("MFA verification successful for user:", user[0].id)

    // Generate JWT token for successful login
    const loginToken = jwt.sign(
      {
        userId: user[0].id,
        type: "auth",
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      {
        expiresIn: "7d",
      },
    )

    // Return user data and token
    const { pin: _, mfaSecret: __, ...userWithoutSensitive } = user[0]

    return NextResponse.json({
      success: true,
      message: "MFA verification successful",
      user: {
        id: userWithoutSensitive.id,
        fullName: userWithoutSensitive.fullName,
        phone: userWithoutSensitive.phone,
        email: userWithoutSensitive.email,
        walletBalance: userWithoutSensitive.walletBalance,
        mfaEnabled: userWithoutSensitive.mfaEnabled,
      },
      token: loginToken,
    })
  } catch (error) {
    console.error("MFA verification error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify MFA token",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
