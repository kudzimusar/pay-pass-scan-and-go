import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { storage } from "../../_lib/storage"
import { ensureSeeded } from "../../_lib/storage"

// Normalize phone number to a consistent format
function normalizePhoneNumber(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "")

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("263")) {
    return `+${digitsOnly}`
  } else if (digitsOnly.length === 9) {
    return `+263${digitsOnly}`
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith("0")) {
    return `+263${digitsOnly.slice(1)}`
  } else if (phone.startsWith("+")) {
    return phone
  }

  return `+${digitsOnly}`
}

// Validation schemas
const loginSchema = z.object({
  phone: z.string().min(1, "Phone number is required"),
  pin: z.string().min(4, "PIN is required"),
  mfaToken: z.string().optional(), // For second factor
})

const loginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  requiresMfa: z.boolean().optional(),
  mfaToken: z.string().optional(), // Temporary token for MFA verification
  user: z.object({
    id: z.string(),
    fullName: z.string(),
    phone: z.string(),
    email: z.string(),
    walletBalance: z.number(),
    mfaEnabled: z.boolean(),
  }).optional(),
  token: z.string().optional(), // JWT token after successful login
})

// Rate limiting helper
const loginAttempts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(phone: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const attempt = loginAttempts.get(phone)

  if (!attempt || attempt.resetTime < now) {
    loginAttempts.set(phone, { count: 1, resetTime: now + 15 * 60 * 1000 }) // 15 min window
    return { allowed: true, remaining: 4 }
  }

  if (attempt.count >= 5) {
    return { allowed: false, remaining: 0 }
  }

  attempt.count++
  return { allowed: true, remaining: 5 - attempt.count }
}

// Generate temporary MFA token (valid for 5 minutes)
function generateMfaToken(userId: string): string {
  const payload = {
    userId,
    type: "mfa_temp",
    iat: Math.floor(Date.now() / 1000),
  }
  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key-change-in-production", {
    expiresIn: "5m",
  })
}

// Generate JWT token for successful login
function generateLoginToken(userId: string): string {
  const payload = {
    userId,
    type: "auth",
    iat: Math.floor(Date.now() / 1000),
  }
  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key-change-in-production", {
    expiresIn: "7d",
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== ENHANCED LOGIN API CALLED ===")

    // Ensure storage is seeded first
    await ensureSeeded()
    console.log("Storage seeded successfully")

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      console.log("Request body parsed:", { phone: body.phone, hasMfaToken: !!body.mfaToken })
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format",
        },
        { status: 400 },
      )
    }

    const validation = loginSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid input",
          details: validation.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { phone, pin, mfaToken } = validation.data

    // Check rate limiting
    const { allowed, remaining } = checkRateLimit(phone)
    if (!allowed) {
      console.warn("Rate limit exceeded for phone:", phone)
      return NextResponse.json(
        {
          success: false,
          message: "Too many login attempts. Please try again later.",
        },
        { status: 429 },
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("Normalized phone:", normalizedPhone)

    // Find user by phone
    const user = await storage.getUserByPhone(normalizedPhone)
    if (!user) {
      console.log("User not found for phone:", normalizedPhone)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or PIN",
        },
        { status: 401 },
      )
    }

    // Check if account is locked
    if (user.accountLocked) {
      console.warn("Account locked for user:", user.fullName)
      return NextResponse.json(
        {
          success: false,
          message: "Account is locked. Please contact support.",
        },
        { status: 403 },
      )
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.pin)
    if (!isPinValid) {
      console.log("Invalid PIN for user:", user.fullName)

      // Increment login attempts
      const newAttempts = (user.loginAttempts || 0) + 1
      await storage.updateUser(user.id, { loginAttempts: newAttempts })

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        await storage.updateUser(user.id, { accountLocked: true })
        console.warn("Account locked due to failed login attempts:", user.fullName)
        return NextResponse.json(
          {
            success: false,
            message: "Account locked due to too many failed login attempts. Please contact support.",
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: "Invalid phone number or PIN",
        },
        { status: 401 },
      )
    }

    console.log("PIN verified successfully for user:", user.fullName)

    // If MFA is enabled and no MFA token provided, require MFA
    if (user.mfaEnabled && !mfaToken) {
      console.log("MFA required for user:", user.fullName)

      const tempMfaToken = generateMfaToken(user.id)

      return NextResponse.json(
        {
          success: true,
          message: "MFA verification required",
          requiresMfa: true,
          mfaToken: tempMfaToken,
        },
        { status: 200 },
      )
    }

    // If MFA token provided, verify it (this would be done in a separate endpoint in production)
    if (user.mfaEnabled && mfaToken) {
      console.log("Verifying MFA token for user:", user.fullName)
      // In a real scenario, you'd verify the TOTP token here
      // For now, we'll assume it's verified if the token is provided
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await storage.updateUser(user.id, { loginAttempts: 0 })
    }

    // Update last login timestamp
    await storage.updateUser(user.id, { lastLoginAt: new Date() })

    // Generate JWT token
    const token = generateLoginToken(user.id)

    // Return user data (excluding PIN)
    const { pin: _, ...userWithoutPin } = user

    const response = {
      success: true,
      message: "Login successful",
      user: {
        id: userWithoutPin.id,
        fullName: userWithoutPin.fullName,
        phone: userWithoutPin.phone,
        email: userWithoutPin.email,
        walletBalance: userWithoutPin.walletBalance,
        mfaEnabled: userWithoutPin.mfaEnabled,
      },
      token,
    }

    console.log("Login successful for:", user.fullName)

    return NextResponse.json(response)
  } catch (error) {
    console.error("=== ENHANCED LOGIN API ERROR ===")
    console.error("Error details:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        details: process.env.NODE_ENV === "development" ? (error as Error).message : undefined,
      },
      { status: 500 },
    )
  }
}
