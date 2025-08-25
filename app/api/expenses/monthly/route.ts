import { type NextRequest, NextResponse } from "next/server"
<<<<<<< HEAD
import { ensureSeeded, getUserTransactions } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("Monthly expenses API called")
    await ensureSeeded()
=======
import { storage } from "../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("=== MONTHLY EXPENSES API CALLED ===")
    await storage.ensureSeeded()
>>>>>>> origin/main

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

<<<<<<< HEAD
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
=======
    if (!userId) {
      console.log("Missing userId parameter")
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
          totalExpenses: 0,
          transactionCount: 0,
        },
        { status: 400 },
      )
    }

    console.log("Calculating monthly expenses for user:", userId)

    // Verify user exists
    const user = await storage.getUserById(userId)
    if (!user) {
      console.log("User not found:", userId)
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          totalExpenses: 0,
          transactionCount: 0,
        },
        { status: 404 },
      )
    }

    // Get current month boundaries
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
>>>>>>> origin/main

    console.log("Month range:", startOfMonth.toISOString(), "to", endOfMonth.toISOString())

    // Get all transactions for the user
    const transactions = await storage.getUserTransactions(userId)
    console.log("Total transactions found:", transactions.length)

    // Filter transactions for current month and outgoing payments
    const monthlyTransactions = transactions.filter((transaction) => {
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
    const totalExpenses = monthlyTransactions.reduce((sum, transaction) => {
      return sum + transaction.amount
    }, 0)

    console.log("Total monthly expenses calculated:", totalExpenses)

    const response = {
      success: true,
<<<<<<< HEAD
      totalExpenses: monthlyExpenses,
      month: now.toLocaleString("default", { month: "long" }),
      year: currentYear,
    })
  } catch (error) {
    console.error("Monthly expenses API error:", error)
    return NextResponse.json({ success: false, error: "Failed to calculate monthly expenses" }, { status: 500 })
=======
      totalExpenses,
      transactionCount: monthlyTransactions.length,
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
    }

    console.log("Returning monthly expenses response:", response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("=== MONTHLY EXPENSES API ERROR ===")
    console.error("Error details:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")

    // Always return JSON, never plain text
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate monthly expenses",
        totalExpenses: 0,
        transactionCount: 0,
        details:
          process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
>>>>>>> origin/main
  }
}
