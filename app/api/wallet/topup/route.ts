import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { topupSchema } from "../../_lib/schema"

export async function POST(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const raw = await req.json()
    const data = topupSchema.parse(raw)

    const tx = await storage.createTransaction({
      userId: auth.userId,
      type: "topup",
      category: "transfer",
      amount: data.amount,
      currency: data.currency,
      description: `Top-up via ${data.method}`,
      status: "completed",
      paymentMethod: data.method,
    })
    await storage.updateWalletBalance(auth.userId, data.currency, data.amount)

    return NextResponse.json({ success: true, transaction: tx, message: "Top-up successful" })
  } catch {
    return NextResponse.json({ error: "Top-up failed" }, { status: 500 })
  }
}
