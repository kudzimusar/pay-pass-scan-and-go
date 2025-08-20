import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getUnpaidTransactions } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const transactions = await getUnpaidTransactions(userId)

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("Unpaid transactions API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch unpaid transactions" }, { status: 500 })
  }
}
