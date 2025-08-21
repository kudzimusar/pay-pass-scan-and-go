import { NextResponse } from "next/server"
import { ensureSeeded, getUserById } from "../../_lib/storage"
import { verifyToken } from "../../_lib/auth"

export async function GET(req: Request) {
  try {
    console.log("=== USER PROFILE API ===")
    await ensureSeeded()

    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid authorization header")
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      console.log("Invalid token")
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    console.log("Getting user profile for:", decoded.userId)
    const user = await getUserById(decoded.userId)

    if (!user) {
      console.log("User not found")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("User profile retrieved successfully")
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("=== USER PROFILE ERROR ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
