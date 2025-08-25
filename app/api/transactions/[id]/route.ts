import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getTransactionById } from "../../_lib/storage"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeeded()

    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 })
    }

    const transaction = await getTransactionById(id)

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transaction,
    })
  } catch (error) {
    console.error("Get transaction API error:", error)
    return NextResponse.json({ success: false, error: "Failed to get transaction" }, { status: 500 })
  }
}
