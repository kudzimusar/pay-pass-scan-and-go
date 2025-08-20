import { type NextRequest, NextResponse } from "next/server"
import {
  ensureSeeded,
  createPaymentRequest,
  getUserById,
  getTransactionById,
  createNotification,
} from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded()

    const body = await request.json()
    const { senderId, recipientId, transactionId } = body

    if (!senderId || !recipientId || !transactionId) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    // Verify transaction exists
    const transaction = await getTransactionById(transactionId)
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 })
    }

    // Verify both users exist
    const sender = await getUserById(senderId)
    const recipient = await getUserById(recipientId)

    if (!sender || !recipient) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Create linked payment request
    const paymentRequest = await createPaymentRequest({
      senderId,
      recipientId,
      amount: transaction.amount,
      description: `Help pay: ${transaction.description}`,
      billType: transaction.type,
      status: "pending",
      linkedTransactionId: transactionId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    // Create notification for recipient
    await createNotification({
      userId: recipientId,
      type: "payment_request",
      title: "Payment Request",
      message: `${sender.fullName} asked you to help pay $${transaction.amount} for ${transaction.description}`,
      data: {
        requestId: paymentRequest.id,
        amount: transaction.amount,
        senderName: sender.fullName,
        linkedTransactionId: transactionId,
      },
      isRead: false,
    })

    return NextResponse.json({
      success: true,
      message: "Linked payment request sent successfully",
      request: paymentRequest,
    })
  } catch (error) {
    console.error("Linked request API error:", error)
    return NextResponse.json({ success: false, error: "Failed to send linked payment request" }, { status: 500 })
  }
}
