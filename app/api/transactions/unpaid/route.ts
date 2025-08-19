import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getUnpaidTransactions } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("Unpaid transactions API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Fetching unpaid transactions for user:", userId)

    const transactions = await getUnpaidTransactions(userId)

    console.log("Found", transactions.length, "unpaid transactions")

    return NextResponse.json({
      success: true,
      transactions,
    })
  } catch (error) {
    console.error("Unpaid transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
