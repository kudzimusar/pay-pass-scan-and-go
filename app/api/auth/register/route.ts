import { type NextRequest, NextResponse } from "next/server"
import { storage } from "../_lib/storage"
import { generateToken } from "../_lib/auth"

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, "")

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
  }
}
