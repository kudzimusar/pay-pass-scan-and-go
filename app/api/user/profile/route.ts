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

    const user = db.getUser((payload as any).userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { pinHash: _drop, ...safeUser } = user
    return NextResponse.json(safeUser)
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
