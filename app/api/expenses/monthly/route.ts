import { NextResponse } from "next/server"
import { ensureSeeded } from "../../_lib/storage"
import { FinancialCore } from "../../_lib/financial-core"

export async function GET(req: Request) {
  try {
    console.log("=== MONTHLY EXPENSES API ===")
    await ensureSeeded()

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      console.log("Missing userId parameter")
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    console.log("Calculating monthly expenses for user:", userId)

    // Use Financial Core to calculate monthly expenses
    const totalExpenses = await FinancialCore.getMonthlyExpenses(userId)

    console.log("Monthly expenses calculated:", totalExpenses)

    return NextResponse.json({
      success: true,
      totalExpenses,
      userId,
    })
  } catch (error) {
    console.error("=== MONTHLY EXPENSES ERROR ===", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to calculate monthly expenses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
