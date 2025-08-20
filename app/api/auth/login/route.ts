import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { ensureSeeded, getUserByPhone } from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("Login API called")

    // Ensure storage is seeded first
    await ensureSeeded()

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ success: false, error: "Invalid request format" }, { status: 400 })
    }

    const { phone, pin } = body

    // Validate input
    if (!phone || !pin) {
      return NextResponse.json({ success: false, error: "Phone and PIN are required" }, { status: 400 })
    }

    console.log("Looking for user with phone:", phone)

    // Find user by phone
    const user = await getUserByPhone(phone)
    if (!user) {
      console.log("User not found for phone:", phone)
      return NextResponse.json({ success: false, error: "Invalid phone number or PIN" }, { status: 401 })
    }

    console.log("User found:", user.fullName)

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin)
    if (!isValidPin) {
      console.log("Invalid PIN for user:", user.fullName)
      return NextResponse.json({ success: false, error: "Invalid phone number or PIN" }, { status: 401 })
    }

    console.log("Login successful for user:", user.fullName)

    // Return user data (excluding PIN)
    const { pin: _, ...userWithoutPin } = user

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPin,
      token: `token_${user.id}_${Date.now()}`,
    })
  } catch (error) {
    console.error("Login API error:", error)

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
