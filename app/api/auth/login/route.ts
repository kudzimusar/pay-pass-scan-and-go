import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { storage } from "../../_lib/storage"

// Normalize phone number to international format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "")

  // If it starts with 263, it's already in international format
  if (digits.startsWith("263")) {
    return `+${digits}`
  }

  // If it starts with 0, replace with 263
  if (digits.startsWith("0")) {
    return `+263${digits.slice(1)}`
  }

  // If it's a 9-digit number starting with 7, add 263
  if (digits.length === 9 && digits.startsWith("7")) {
    return `+263${digits}`
  }

  // If it's already without country code, add 263
  if (digits.length === 9) {
    return `+263${digits}`
  }

  // Return as is with + prefix if not already there
  return phone.startsWith("+") ? phone : `+${digits}`
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== LOGIN API CALLED ===")

<<<<<<< HEAD
    // Ensure storage is seeded
    await storage.ensureSeeded()
    console.log("Storage seeded successfully")
=======
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
>>>>>>> origin/main

    const body = await request.json()
    const { phone, pin } = body

    console.log("Login attempt for phone:", phone)

    if (!phone || !pin) {
<<<<<<< HEAD
      console.log("Missing phone or pin")
      return NextResponse.json({ success: false, error: "Phone number and PIN are required" }, { status: 400 })
=======
      console.log("Missing phone or PIN")
      return NextResponse.json(
        {
          success: false,
          error: "Phone and PIN are required",
        },
        { status: 400 },
      )
>>>>>>> origin/main
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone)
    console.log("Normalized phone:", normalizedPhone)

<<<<<<< HEAD
    // Find user by phone
    const user = await storage.getUserByPhone(normalizedPhone)
    console.log("User found:", user ? user.fullName : "none")

    if (!user) {
      console.log("User not found for phone:", normalizedPhone)
      return NextResponse.json({ success: false, error: "Invalid phone number or PIN" }, { status: 401 })
    }

=======
    // Find user by phone (try exact match first)
    const user = await getUserByPhone(phone)

    if (!user) {
      console.log("User not found for exact phone match:", phone)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number or PIN",
        },
        { status: 401 },
      )
    }

    console.log("User found:", user.fullName, "ID:", user.id)

>>>>>>> origin/main
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

<<<<<<< HEAD
    // Generate JWT token
    const token = jwt.sign({ userId: user.id, phone: user.phone }, process.env.JWT_SECRET || "fallback-secret-key", {
      expiresIn: "7d",
    })

    console.log("Login successful for user:", user.fullName)

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        walletBalance: user.walletBalance,
        biometricEnabled: user.biometricEnabled,
      },
=======
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
>>>>>>> origin/main
    })

    return NextResponse.json(response)
  } catch (error) {
<<<<<<< HEAD
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
=======
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
>>>>>>> origin/main
  }
}
