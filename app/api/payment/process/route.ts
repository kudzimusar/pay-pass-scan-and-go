import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/db";
import { verifyToken } from "../../_lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    const payload = verifyToken<{ type: "user"; userId: string }>(auth);
    if ((payload as any).type !== "user") return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { routeId, currency, amount, paymentMethod } = await req.json();
    const route = db.getRoute(routeId);
    if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 });

    const wallet = db.getWalletByUserId((payload as any).userId);
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

    const bal = currency === "USD" ? parseFloat(wallet.usdBalance) : parseFloat(wallet.zwlBalance);
    const amt = parseFloat(String(amount));
    if (bal < amt) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    const tx = db.createTransaction({
      userId: (payload as any).userId,
      operatorId: route.operatorId,
      routeId: route.id,
      type: "payment",
      category: "bus",
      amount: String(amount),
      currency,
      description: `Bus fare - ${route.name}`,
      status: "completed",
      paymentMethod: paymentMethod || "wallet",
    });

    db.updateWalletBalance((payload as any).userId, currency, `-${String(amount)}`);
    return NextResponse.json({ success: true, transaction: tx, message: "Payment successful" });
  } catch (e) {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
