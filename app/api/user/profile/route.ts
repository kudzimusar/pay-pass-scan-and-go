import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

export async function GET(req: Request) {
  const auth = verifyAuthHeader(req.headers.get("authorization"))
  if (!auth || auth.type !== "user") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await storage.getUser(auth.userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const { pin: _p, ...safe } = user
  return NextResponse.json(safe)
}
