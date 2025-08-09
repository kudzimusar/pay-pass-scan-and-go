import { type NextRequest, NextResponse } from "next/server"
import { db } from "../../_lib/db"
import { verifyToken } from "../../_lib/auth"

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization")
    const payload = verifyToken<{ type: "operator"; operatorId: string }>(auth)
    if ((payload as any).type !== "operator") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const transactions = db.getTransactionsByOperatorId((payload as any).operatorId)
    return NextResponse.json(transactions)
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
