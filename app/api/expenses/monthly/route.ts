import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getUserTransactions } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("Monthly expenses API called")
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("Calculating monthly expenses for user:", userId)

    if (!userId) {
      console.log("Missing userId parameter")
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Get user transactions for the current month
    const transactions = await getUserTransactions(userId)
    console.log("Found transactions:", transactions.length)

    // Calculate current month expenses (outgoing payments)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyExpenses = transactions
      .filter((txn: any) => {
        const txnDate = new Date(txn.createdAt)
        return (
          txnDate.getMonth() === currentMonth &&
          txnDate.getFullYear() === currentYear &&
          (txn.type === "payment" || txn.type === "transfer") &&
          txn.status === "completed"
        )
      })
      .reduce((total: number, txn: any) => total + txn.amount, 0)

    console.log("Calculated monthly expenses:", monthlyExpenses)

    return NextResponse.json({
      success: true,
      totalExpenses: monthlyExpenses,
      month: now.toLocaleString("default", { month: "long" }),
      year: currentYear,
    })
  } catch (error) {
    console.error("Monthly expenses API error:", error)
    return NextResponse.json({ success: false, error: "Failed to calculate monthly expenses" }, { status: 500 })
  }
}
