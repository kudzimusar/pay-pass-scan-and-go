import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { paymentSchema } from "../../_lib/schema"

export async function POST(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const raw = await req.json()
    const data = paymentSchema.parse(raw)
    const route = await storage.getRoute(data.routeId)
    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 })

    const wallet = await storage.getWalletByUserId(auth.userId)
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })

    const bal = data.currency === "USD" ? wallet.usdBalance : wallet.zwlBalance
    if (bal < data.amount) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })

    const tx = await storage.createTransaction({
      userId: auth.userId,
      operatorId: route.operatorId,
      routeId: route.id,
      type: "payment",
      category: "bus",
      amount: data.amount,
      currency: data.currency,
      description: `Bus fare - ${route.name}`,
      status: "completed",
      paymentMethod: data.paymentMethod || "wallet",
    })
    await storage.updateWalletBalance(auth.userId, data.currency, -data.amount)

    return NextResponse.json({ success: true, transaction: tx, message: "Payment successful" })
  } catch {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 })
  }
}
