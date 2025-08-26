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

    // Get user transactions
    const transactions = await getUserTransactions(userId)
    console.log("Found transactions:", transactions.length)

    // Calculate current month expenses (outgoing payments)
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Define month boundaries
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)

    console.log("Month range:", startOfMonth.toISOString(), "to", endOfMonth.toISOString())

    // Filter transactions for current month and outgoing payments
    const monthlyTransactions = transactions.filter((transaction: any) => {
      const transactionDate = new Date(transaction.createdAt)
      const isInCurrentMonth = transactionDate >= startOfMonth && transactionDate <= endOfMonth

      // Consider as expense if it's an outgoing payment
      const isExpense =
        transaction.type === "payment" ||
        transaction.type === "bill_payment" ||
        transaction.type === "transfer" ||
        transaction.type === "payment_request" ||
        (transaction.userId === userId && transaction.type !== "topup" && transaction.type !== "transfer_received")

      console.log("Transaction check:", {
        id: transaction.id,
        date: transactionDate.toISOString(),
        type: transaction.type,
        amount: transaction.amount,
        userId: transaction.userId,
        isInCurrentMonth,
        isExpense,
      })

      return isInCurrentMonth && isExpense
    })

    console.log("Monthly expense transactions:", monthlyTransactions.length)

    // Calculate total expenses
    const totalExpenses = monthlyTransactions.reduce((sum: number, transaction: any) => {
      return sum + transaction.amount
    }, 0)

    console.log("Total monthly expenses calculated:", totalExpenses)

    const response = {
      success: true,
      totalExpenses,
      month: now.toLocaleString("default", { month: "long" }),
      year: currentYear,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Monthly expenses API error:", error)
    return NextResponse.json({ success: false, error: "Failed to calculate monthly expenses" }, { status: 500 })
  }
}
