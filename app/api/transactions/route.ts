import { NextResponse } from "next/server"
import { ensureSeeded, getUserTransactions } from "../_lib/storage"

export async function GET(req: Request) {
  try {
    await ensureSeeded()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const month = searchParams.get("month") ? Number.parseInt(searchParams.get("month")!) : undefined
    const year = searchParams.get("year") ? Number.parseInt(searchParams.get("year")!) : undefined

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
    }

    // Get transactions for the user
    const transactions = await getUserTransactions(userId)

    // Filter by month and year if provided
    let filteredTransactions = transactions
    if (month !== undefined && year !== undefined) {
      filteredTransactions = transactions.filter((txn: any) => {
        const txnDate = new Date(txn.createdAt)
        return txnDate.getMonth() === month && txnDate.getFullYear() === year
      })
    }

    return NextResponse.json({
      success: true,
      transactions: filteredTransactions,
    })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
