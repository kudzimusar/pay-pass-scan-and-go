import { type NextRequest, NextResponse } from "next/server"
import { storage } from "../../_lib/storage"
import { FinancialCore } from "../../_lib/financial-core"

<<<<<<< HEAD
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== PAYMENT REQUEST RESPONSE API ===")
    await ensureSeeded()
    const { id } = await params
    const requestId = id

    if (!requestId) {
      console.log("Missing request ID")
      return NextResponse.json({ success: false, error: "Request ID is required" }, { status: 400 })
    }

    // Get request body
    let body
    try {
      body = await req.json()
      console.log("Request body:", body)
    } catch (error) {
      console.log("Invalid JSON in request body:", error)
      return NextResponse.json({ success: false, error: "Invalid JSON in request body" }, { status: 400 })
    }

=======
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("=== PAYMENT REQUEST RESPONSE API ===")

    const requestId = params.id
    const body = await request.json()
>>>>>>> origin/main
    const { action, userId } = body

    console.log("Request ID:", requestId)
    console.log("Action:", action)
    console.log("User ID:", userId)

    if (!requestId || !action || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 },
      )
    }

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'accept' or 'decline'",
        },
        { status: 400 },
      )
    }

    // Get the payment request
    const paymentRequest = await storage.getPaymentRequestById(requestId)
    if (!paymentRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment request not found",
        },
        { status: 404 },
      )
    }

    console.log("Payment request found:", paymentRequest)

<<<<<<< HEAD
      // Update request status
      console.log("Updating request status to accepted")
      const updatedRequest = await updatePaymentRequestStatus(requestId, "accepted", new Date())
      if (!updatedRequest) {
        console.log("Failed to update request status; returning success since payment already processed")
        return NextResponse.json({
          success: true,
          message: "Payment processed but request status could not be updated",
          newBalance: result.newBalance,
          transactionId: result.transactionId,
          warning: true,
        })
      }
=======
    // Verify the user is the recipient
    if (paymentRequest.recipientId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized to respond to this request",
        },
        { status: 403 },
      )
    }
>>>>>>> origin/main

    // Check if already responded
    if (paymentRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          error: `Request already ${paymentRequest.status}`,
        },
        { status: 400 },
      )
    }

    if (action === "decline") {
      // Simply update the request status
      await storage.updatePaymentRequestStatus(requestId, "declined")

<<<<<<< HEAD
      // Decline the request
      const updatedRequest = await updatePaymentRequestStatus(requestId, "declined", new Date())
      if (!updatedRequest) {
        console.log("Failed to update request status; treating as already processed/removed")
        return NextResponse.json({ success: true, message: "Request declined" })
      }

      // Get recipient user for the notification
      const recipient = await getUserById(userId)
      if (recipient) {
        console.log("Creating notification for sender")
        // Create notification for sender
        await createNotification({
          userId: request.senderId,
          type: "request_declined",
          title: "Payment Request Declined",
          message: `${recipient.fullName} declined your payment request for $${request.amount.toFixed(2)}`,
          data: { requestId, amount: request.amount },
          isRead: false,
        })
      }

      console.log("Payment request declined successfully")
=======
      console.log("Payment request declined")
>>>>>>> origin/main
      return NextResponse.json({
        success: true,
        message: "Payment request declined",
        status: "declined",
      })
    }

    if (action === "accept") {
      // Get user to check balance
      const user = await storage.getUserById(userId)
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 },
        )
      }

      // Check if user has sufficient funds
      if (user.walletBalance < paymentRequest.amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient funds. You have $${user.walletBalance.toFixed(2)} but need $${paymentRequest.amount.toFixed(2)}`,
          },
          { status: 400 },
        )
      }

      // Process the payment using FinancialCore
      const result = await FinancialCore.processOperation({
        userId,
        amount: paymentRequest.amount,
        type: "debit",
        category: "payment_request",
        description: `Payment for: ${paymentRequest.description}`,
        recipientId: paymentRequest.senderId,
        metadata: {
          requestId,
          originalRequestDescription: paymentRequest.description,
        },
      })

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error || "Payment processing failed",
          },
          { status: 400 },
        )
      }

      // Update the payment request status
      await storage.updatePaymentRequestStatus(requestId, "accepted")

      // Credit the sender (requester)
      const sender = await storage.getUserById(paymentRequest.senderId)
      if (sender) {
        const senderNewBalance = sender.walletBalance + paymentRequest.amount
        await storage.updateUserWalletBalance(paymentRequest.senderId, senderNewBalance)

        // Create transaction for sender
        await storage.createTransaction({
          userId: paymentRequest.senderId,
          type: "payment_received",
          amount: paymentRequest.amount,
          description: `Payment received from ${user.fullName}: ${paymentRequest.description}`,
          status: "completed",
          isPaid: true,
          category: "payment_received",
          metadata: {
            requestId,
            payerId: userId,
            transactionId: result.transactionId,
          },
        })

        console.log(`Sender balance updated: ${sender.walletBalance} → ${senderNewBalance}`)
      }

      console.log("Payment request accepted and processed")
      return NextResponse.json({
        success: true,
        message: "Payment completed successfully",
        newBalance: result.newBalance,
        transactionId: result.transactionId,
        status: "accepted",
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("=== PAYMENT REQUEST RESPONSE ERROR ===")
    console.error("Error details:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")

    // Always return JSON, never plain text
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment request response",
        details:
          process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
      },
      { status: 500 },
    )
  }
}
