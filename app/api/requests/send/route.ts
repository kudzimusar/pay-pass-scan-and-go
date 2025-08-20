import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, createPaymentRequest, getUserById, createNotification } from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded()

    const body = await request.json()
    const { senderId, recipientId, amount, description, billType } = body

    if (!senderId || !recipientId || !amount || !description) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 })
    }

    if (senderId === recipientId) {
      return NextResponse.json({ success: false, error: "Cannot send request to yourself" }, { status: 400 })
    }

    // Verify both users exist
    const sender = await getUserById(senderId)
    const recipient = await getUserById(recipientId)

    if (!sender || !recipient) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Create payment request
    const paymentRequest = await createPaymentRequest({
      senderId,
      recipientId,
      amount: Number.parseFloat(amount),
      description,
      billType: billType || "general",
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    // Create notification for recipient
    await createNotification({
      userId: recipientId,
      type: "payment_request",
      title: "Payment Request",
      message: `${sender.fullName} requested $${amount} for ${description}`,
      data: { requestId: paymentRequest.id, amount, senderName: sender.fullName },
      isRead: false,
    })

    return NextResponse.json({
      success: true,
      message: "Payment request sent successfully",
      request: paymentRequest,
    })
  } catch (error) {
    console.error("Send request API error:", error)
    return NextResponse.json({ success: false, error: "Failed to send payment request" }, { status: 500 })
  }
}
