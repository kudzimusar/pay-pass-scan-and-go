import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateToken } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, pin } = body

    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone and PIN are required" }, { status: 400 })
    }

    // Try to find user by phone
    const user = await storage.getUserByPhone(phone)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(pin, user.pin)

    if (!isValidPin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      type: "user",
      phone: user.phone,
    })

    // Return user data without sensitive information
    const userData = {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      biometricEnabled: user.biometricEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json({
      success: true,
      user: userData,
      token,
    })
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
