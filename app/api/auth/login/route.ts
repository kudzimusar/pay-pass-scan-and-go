import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { ensureSeeded, getUserByPhone } from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("Login API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const body = await request.json()
    const { phone, pin } = body

    console.log("Login attempt for phone:", phone)

    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone and PIN are required" }, { status: 400 })
    }

    // Find user by phone
    const user = await getUserByPhone(phone)
    if (!user) {
      console.log("User not found for phone:", phone)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("User found:", user.fullName)

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin)
    if (!isValidPin) {
      console.log("Invalid PIN for user:", user.fullName)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Login successful for:", user.fullName)

    // Return user data (excluding PIN)
    const { pin: _, ...userWithoutPin } = user
    return NextResponse.json({
      success: true,
      user: userWithoutPin,
      token: `token_${user.id}_${Date.now()}`,
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
