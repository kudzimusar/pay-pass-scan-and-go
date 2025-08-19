import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../../_lib/auth"
import { storage } from "../../../_lib/storage"
import { respondToRequestSchema } from "../../../_lib/schema"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const raw = await req.json()
    const data = respondToRequestSchema.parse(raw)
    const requestId = params.id

    // Get the payment request
    const request = await storage.getPaymentRequest(requestId)
    if (!request) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 })
    }

    // Verify user is the recipient
    if (request.recipientId !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized to respond to this request" }, { status: 403 })
    }

    // Check if request is still pending
    if (request.status !== "pending") {
      return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 })
    }

    // Check if request has expired
    if (new Date() > new Date(request.expiresAt)) {
      await storage.updatePaymentRequestStatus(requestId, "expired")
      return NextResponse.json({ error: "Payment request has expired" }, { status: 400 })
    }

    if (data.action === "decline") {
      // Decline the request
      await storage.updatePaymentRequestStatus(requestId, "declined")

      // Notify sender
      await storage.createNotification({
        userId: request.senderId,
        type: "payment_request_declined",
        title: "Payment Request Declined",
        message: `Your payment request for $${request.amount} was declined`,
        data: { requestId: request.id },
      })

      return NextResponse.json({
        success: true,
        message: "Payment request declined",
        status: "declined",
      })
    }

    if (data.action === "accept") {
      // Verify PIN for acceptance
      if (!data.pin) {
        return NextResponse.json({ error: "PIN is required to accept payment" }, { status: 400 })
      }

      const user = await storage.getUser(auth.userId)
      if (!user || user.pin !== data.pin) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 400 })
      }

      // Check wallet balance
      const wallet = await storage.getWalletByUserId(auth.userId)
      if (!wallet) {
        return NextResponse.json({ error: "Wallet not found" }, { status: 404 })
      }

      const balance =
        request.currency === "USD" ? Number.parseFloat(wallet.usdBalance) : Number.parseFloat(wallet.zwlBalance)
      const requestAmount = Number.parseFloat(request.amount)

      if (balance < requestAmount) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Process the payment
      const transaction = await storage.createTransaction({
        userId: auth.userId,
        type: "send",
        category: "transfer",
        amount: `-${request.amount}`,
        currency: request.currency,
        description: `Payment for ${request.billType} - ${request.description}`,
        status: "completed",
        paymentMethod: "wallet",
        reference: `REQ-${request.id}`,
      })

      // Update wallet balances
      await storage.updateWalletBalance(auth.userId, request.currency, `-${request.amount}`)
      await storage.updateWalletBalance(request.senderId, request.currency, request.amount)

      // Create receive transaction for sender
      await storage.createTransaction({
        userId: request.senderId,
        type: "receive",
        category: "transfer",
        amount: request.amount,
        currency: request.currency,
        description: `Received payment for ${request.billType}`,
        status: "completed",
        paymentMethod: "wallet",
        reference: `REQ-${request.id}`,
      })

      // Update request status
      await storage.updatePaymentRequest(requestId, {
        status: "accepted",
        transactionId: transaction.id,
      })

      // Notify sender
      await storage.createNotification({
        userId: request.senderId,
        type: "payment_request_accepted",
        title: "Payment Received!",
        message: `You received $${request.amount} for ${request.billType}`,
        data: {
          requestId: request.id,
          transactionId: transaction.id,
          amount: request.amount,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Payment completed successfully",
        status: "accepted",
        transaction: {
          id: transaction.id,
          amount: request.amount,
          currency: request.currency,
        },
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Respond to payment request error:", error)
    return NextResponse.json({ error: "Failed to process response" }, { status: 500 })
  }
}
