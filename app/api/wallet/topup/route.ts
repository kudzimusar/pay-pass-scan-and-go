import { type NextRequest, NextResponse } from "next/server"
import { db } from "../../_lib/db"
import { verifyToken } from "../../_lib/auth"

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "user"; userId: string }>(auth)
    if ((payload as any).type !== "user") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { amount, currency, method } = await req.json()
    if (!amount || !currency || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create transaction record
    const tx = db.createTransaction({
      userId: (payload as any).userId,
      type: "topup",
      category: "transfer",
      amount: String(amount),
      currency,
      description: `Top-up via ${method}`,
      status: "completed",
      paymentMethod: method,
    })

    // Update wallet balance
    db.updateWalletBalance((payload as any).userId, currency, String(amount))

    return NextResponse.json({
      success: true,
      transaction: tx,
      message: `Successfully added ${currency === "USD" ? "$" : "Z$"}${amount} to your wallet`,
    })
  } catch (e) {
    return NextResponse.json({ error: "Top-up failed" }, { status: 500 })
  }
}
