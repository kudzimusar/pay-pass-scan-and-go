import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

export async function GET(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "user" || !auth.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const balance = await storage.getUserWalletBalance(auth.userId)
  const wallet = { balance }
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
  return NextResponse.json(wallet)
}
