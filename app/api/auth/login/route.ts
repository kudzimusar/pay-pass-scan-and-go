import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { storage } from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("=== LOGIN API CALLED ===")

    // Ensure storage is seeded first
    await storage.ensureSeeded()
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

    // Validate input
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

    console.log("Looking for user with phone:", phone)

    // Find user by phone (try exact match first)
    const user = await storage.getUserByPhone(phone)

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

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin)
    if (!isValidPin) {
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
