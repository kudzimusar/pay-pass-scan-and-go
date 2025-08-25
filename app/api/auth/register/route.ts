<<<<<<< HEAD
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { cookieOptions, normalizePhoneNumber, signToken } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import type { User } from "../../_lib/storage"
=======
import { type NextRequest, NextResponse } from "next/server"
import { storage } from "../_lib/storage"
import { generateToken } from "../_lib/auth"
>>>>>>> origin/main

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")

<<<<<<< HEAD
function toSafeUser(u: User) {
  const { pin, ...safe } = u
  return safe
}

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
    }

    const { fullName, phone, email, pin, biometricEnabled } = parsed.data
    const normalized = normalizePhoneNumber(phone)

    const existing = await storage.getUserByPhone(normalized)
    if (existing) {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 })
    }

    const pinHash = await bcrypt.hash(pin, 12)
    const user = await storage.createUser({
      fullName,
      phone: normalized,
      email: email || "",
      biometricEnabled: biometricEnabled || false,
      pin: pinHash,
      walletBalance: 0,
      joinedDate: new Date(),
      paypassUsername: `@${fullName.toLowerCase().replace(/\s+/g, '_')}`,
    })

    const token = await signToken({ type: "user", userId: user.id, phone: user.phone })

    const res = NextResponse.json({ user: toSafeUser(user), token })
    const cookie = cookieOptions()
    res.cookies.set(cookie.name, token, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    })
    return res
  } catch (e) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
=======
  // Handle different formats
  if (digitsOnly.length === 10) {
    // US number without country code
    return `+1${digitsOnly}`
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    // US number with country code but no +
    return `+${digitsOnly}`
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("1")) {
    // International format without +
    return `+${digitsOnly}`
  } else if (phone.startsWith("+")) {
    // Already in international format
    return phone
  } else {
    // Default: assume US number
    return `+1${digitsOnly.slice(-10)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== SIGNUP API CALLED ===")

    const body = await request.json()
    console.log("Signup request body:", { ...body, password: "[REDACTED]" })

    const { fullName, phoneNumber, password } = body

    // Validate required fields
    if (!fullName || !phoneNumber || !password) {
      console.log("Missing required fields")
      return NextResponse.json(
        {
          success: false,
          error: "All fields are required",
        },
        { status: 400 },
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    console.log("Normalized phone:", normalizedPhone)

    // Check if user already exists
    const existingUser = await storage.getUserByPhone(normalizedPhone)
    if (existingUser) {
      console.log("User already exists with phone:", normalizedPhone)
      return NextResponse.json(
        {
          success: false,
          error: "User with this phone number already exists",
        },
        { status: 409 },
      )
    }

    // Create new user
    const newUser = await storage.createUser({
      fullName: fullName.trim(),
      phoneNumber: normalizedPhone,
      password,
      walletBalance: 100.0, // Starting balance
    })

    console.log("User created successfully:", newUser.id)

    // Generate auth token
    const token = generateToken(newUser.id)

    const response = {
      success: true,
      message: "Account created successfully",
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        walletBalance: newUser.walletBalance,
      },
      token,
    }

    console.log("Signup successful for user:", newUser.id)
    return NextResponse.json(response)
  } catch (error) {
    console.error("=== SIGNUP API ERROR ===")
    console.error("Error details:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")

    // Always return JSON, never plain text
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create account. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
>>>>>>> origin/main
  }
}
