import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { storage } from "../../_lib/storage"
import { ensureSeeded } from "../../_lib/storage"

// Normalize phone number to a consistent format
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
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith("263")) {
    // Zimbabwe number with country code but no +
    return `+${digitsOnly}`
  } else if (digitsOnly.length === 9) {
    // Zimbabwe number without country code (07...)
    return `+263${digitsOnly}`
  } else if (digitsOnly.length === 10 && digitsOnly.startsWith("0")) {
    // Zimbabwe number with leading 0
    return `+263${digitsOnly.slice(1)}`
  } else if (phone.startsWith("+")) {
    // Already has + prefix
    return phone
  }

  // Default: assume it's a complete number and just add +
  return `+${digitsOnly}`
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== LOGIN API CALLED ===")

    // Ensure storage is seeded first
    await ensureSeeded()
    console.log("Storage seeded successfully")

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
      console.log("Request body parsed:", { phone: body.phone, hasPin: !!body.pin })
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format",
        },
        { status: 400 },
      )
    }

    const { phone, pin } = body

    console.log("Login attempt for phone:", phone)

    if (!phone || !pin) {
      console.log("Missing phone or PIN")
      return NextResponse.json(
        {
          success: false,
          error: "Phone and PIN are required",
        },
        { status: 400 },
      )
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("Normalized phone:", normalizedPhone)

    // Find user by phone
    const user = await storage.getUserByPhone(normalizedPhone)
    console.log("User found:", user ? user.fullName : "none")

    if (!user) {
      console.log("User not found for phone:", normalizedPhone)
      return NextResponse.json({ success: false, error: "Invalid phone number or PIN" }, { status: 401 })
    }

    console.log("User found:", user.fullName, "ID:", user.id)

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, user.pin)
    console.log("PIN valid:", isPinValid)

    if (!isPinValid) {
      console.log("Invalid PIN for user:", user.fullName)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number or PIN",
        },
        { status: 401 },
      )
    }

    console.log("PIN verified successfully for user:", user.fullName)

    // Create token (simple token for demo)
    const token = `token_${user.id}_${Date.now()}`

    // Return user data (excluding PIN)
    const { pin: _, ...userWithoutPin } = user

    const response = {
      success: true,
      message: "Login successful",
      user: userWithoutPin,
      token: token,
    }

    console.log("Login successful, returning response for:", user.fullName)
    console.log("Response user data:", {
      id: userWithoutPin.id,
      fullName: userWithoutPin.fullName,
      walletBalance: userWithoutPin.walletBalance,
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error("=== LOGIN API ERROR ===")
    console.error("Error details:", error)
    console.error("Stack trace:", error.stack)

    // Return proper JSON error response
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}