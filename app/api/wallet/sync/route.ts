import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { ensureSeeded, getUserById } from "../../_lib/storage"

export async function GET(req: Request) {
  try {
    await ensureSeeded()

    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user" || !auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the latest user data from storage
    const user = await getUserById(auth.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`Wallet sync for ${user.fullName}: $${user.walletBalance.toFixed(2)}`)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        biometricEnabled: user.biometricEnabled,
        walletBalance: user.walletBalance,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  } catch (error) {
    console.error("Wallet sync error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
