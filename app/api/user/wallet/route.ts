import { type NextRequest, NextResponse } from "next/server"
import { db } from "../../_lib/db"
import { verifyToken } from "../../_lib/auth"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "user"; userId: string }>(auth)
    if ((payload as any).type !== "user") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const wallet = db.getWalletByUserId((payload as any).userId)
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
    }

    return NextResponse.json(wallet)
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
