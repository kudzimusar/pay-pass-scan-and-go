import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"
import { sendPaymentRequestSchema } from "../../_lib/schema"

export async function POST(req: Request) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await req.json()
    const data = sendPaymentRequestSchema.parse(raw)

    // Verify recipient exists
    const recipient = await storage.getUser(data.recipientId)
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 })
    }

    // Prevent self-requests
    if (auth.userId === data.recipientId) {
      return NextResponse.json({ error: "Cannot send payment request to yourself" }, { status: 400 })
    }

    // Create payment request
    const request = await storage.createPaymentRequest({
      senderId: auth.userId,
      recipientId: data.recipientId,
      amount: data.amount.toString(),
      currency: data.currency,
      billType: data.billType,
      description: data.description || `${data.billType} payment request`,
    })

    // Send push notification to recipient
    await storage.createNotification({
      userId: data.recipientId,
      type: "payment_request",
      title: "New Payment Request",
      message: `You have a payment request for $${data.amount} from ${auth.userId}`,
      data: {
        requestId: request.id,
        senderId: auth.userId,
        amount: data.amount,
        billType: data.billType,
      },
    })

    return NextResponse.json({
      success: true,
      request: {
        id: request.id,
        recipientId: data.recipientId,
        amount: data.amount,
        billType: data.billType,
        status: "pending",
        createdAt: request.createdAt,
      },
    })
  } catch (error) {
    console.error("Send payment request error:", error)
    return NextResponse.json({ error: "Failed to send payment request" }, { status: 500 })
  }
}
