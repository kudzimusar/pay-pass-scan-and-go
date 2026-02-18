import { type NextRequest, NextResponse } from "next/server"
import { storage } from "../../../_lib/storage"
import { FinancialCore } from "../../../_lib/financial-core"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log("=== PAYMENT REQUEST RESPONSE API ===")
    await storage.ensureSeeded()
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
      // Decline the request
      const updatedRequest = await storage.updatePaymentRequestStatus(requestId, "declined", new Date())
      if (!updatedRequest) {
        console.log("Failed to update request status")
        return NextResponse.json({ success: false, error: "Failed to update status" }, { status: 500 })
      }

      // Get sender user for the notification
      // Note: `paymentRequest.senderId` is the one who MADE the request, and expects payment.
      // `userId` here is the one responding (the payer).
      // So we notify the SENDER that the payer declined.
      const payer = await storage.getUserById(userId)
      if (payer) {
        console.log("Creating notification for sender")
        // Create notification for sender
        await storage.createNotification({
          userId: paymentRequest.senderId,
          type: "request_declined",
          title: "Payment Request Declined",
          message: `${payer.fullName} declined your payment request for $${paymentRequest.amount.toFixed(2)}`,
          data: { requestId, amount: paymentRequest.amount },
          isRead: false,
        })
      }

      console.log("Payment request declined successfully")
      return NextResponse.json({
        success: true,
        message: "Payment request declined",
        status: "declined",
      })
    }

    if (action === "accept") {
      // Get user (payer) to check balance
      const payer = await storage.getUserById(userId)
      if (!payer) {
        return NextResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 },
        )
      }

      // Check if user has sufficient funds
      if (payer.walletBalance < paymentRequest.amount) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient funds. You have $${payer.walletBalance.toFixed(2)} but need $${paymentRequest.amount.toFixed(2)}`,
          },
          { status: 400 },
        )
      }

      // Process the payment using FinancialCore
      // Payer pays sender
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
      const updatedRequest = await storage.updatePaymentRequestStatus(requestId, "accepted", new Date())
      if (!updatedRequest) {
        console.log("Failed to update request status after payment processed")
        // This is tricky, payment went through but status update failed.
        // We log it but return success for the payment.
      }

      // FinancialCore handles recipient crediting if recipientId is provided in `processOperation`?
      // Let's check `financial-core.ts`.
      // It says: "Handle recipient for transfers".
      // `processOperation` checks `operation.category === "transfer"`.
      // Here category is "payment_request".
      // Wait, `processRequestPayment` in `financial-core.ts` uses category "payment_request".
      // But does `processOperation` handle crediting for "payment_request"?
      // Let's check `financial-core.ts` again.

      /*
      if (operation.category === "transfer" && operation.recipientId) {
         // ... credit recipient ...
      }
      */

      // It seems it ONLY handles it for "transfer".
      // So for "payment_request", we might need to handle crediting explicitly here or update `financial-core.ts`.
      // The original code in `route.ts` (the broken one) had explicit crediting logic.

      // Credit the sender (requester) explicitly here
      const sender = await storage.getUserById(paymentRequest.senderId)
      if (sender) {
        const senderNewBalance = sender.walletBalance + paymentRequest.amount
        await storage.updateUserWalletBalance(paymentRequest.senderId, senderNewBalance)

        // Create transaction for sender (recipient of funds)
        await storage.createTransaction({
          userId: paymentRequest.senderId,
          type: "payment_received", // This type might need to be added to Transaction interface or cast
          amount: paymentRequest.amount,
          description: `Payment received from ${payer.fullName}: ${paymentRequest.description}`,
          status: "completed",
          isPaid: true,
          category: "payment_received",
          metadata: {
            requestId,
            payerId: userId,
            transactionId: result.transactionId,
          } as any, // Cast if needed
          transactionHash: `recv_${result.transactionId}`
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
    // Return JSON error
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment request response",
      },
      { status: 500 },
    )
  }
}
