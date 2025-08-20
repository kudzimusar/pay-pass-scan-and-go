import { NextResponse } from "next/server"
import { ensureSeeded } from "../../_lib/storage"
import { processBillPayment, processPayment } from "../../_lib/financial-core"

export async function POST(req: Request) {
  try {
    console.log("=== PAYMENT PROCESS API START ===")
    await ensureSeeded()

    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Authorization required" }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { userId, amount, merchant, description, type, qrId } = body

    // Validation
    if (!userId || !amount || !merchant || !description) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Process payment through Financial Core
    const result =
      type === "bill_payment" || type?.includes("bill")
        ? await processBillPayment(userId, amount, merchant, description, type)
        : await processPayment(userId, amount, merchant, description, type)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    console.log(`Payment processed successfully: ${result.transactionId}`)
    console.log("=== PAYMENT PROCESS API END ===")

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      transactionId: result.transactionId,
      newBalance: result.newBalance,
    })
  } catch (error) {
    console.error("=== PAYMENT PROCESS API ERROR ===", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
