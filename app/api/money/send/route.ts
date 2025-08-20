import { NextResponse } from "next/server"
import { ensureSeeded } from "../../_lib/storage"
import { processTransfer } from "../../_lib/financial-core"

export async function POST(req: Request) {
  try {
    console.log("=== SEND MONEY API START ===")
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

    const { senderId, recipientId, amount, description } = body

    // Validation
    if (!senderId || !recipientId || !amount || !description) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (senderId === recipientId) {
      return NextResponse.json({ success: false, error: "Cannot send money to yourself" }, { status: 400 })
    }

    // Process transfer through Financial Core
    const result = await processTransfer(senderId, recipientId, amount, description)

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    console.log(`Money transfer completed: ${result.transactionId}`)
    console.log("=== SEND MONEY API END ===")

    return NextResponse.json({
      success: true,
      message: `Successfully sent $${amount.toFixed(2)}`,
      newBalance: result.newBalance,
      transactionId: result.transactionId,
    })
  } catch (error) {
    console.error("=== SEND MONEY API ERROR ===", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
