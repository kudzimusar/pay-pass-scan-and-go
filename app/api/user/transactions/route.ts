import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

export async function GET(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "user" || !auth.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const list = await storage.getUserTransactions(auth.userId)
  return NextResponse.json(list)
}
