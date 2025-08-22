import { NextResponse } from "next/server"
import {
  ensureSeeded,
  getPaymentRequestById,
  updatePaymentRequestStatus,
  getUserById,
  createNotification,
} from "../../../_lib/storage"
import { processRequestPayment } from "../../../_lib/financial-core"

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

    const { action, userId } = body

    if (!action || !userId) {
      console.log("Missing action or userId")
      return NextResponse.json({ success: false, error: "Action and userId are required" }, { status: 400 })
    }

    if (action !== "accept" && action !== "decline") {
      console.log("Invalid action:", action)
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
    }

    // Get payment request
    console.log("Getting payment request:", requestId)
    const request = await getPaymentRequestById(requestId)
    if (!request) {
      console.log("Payment request not found")
      return NextResponse.json({ success: false, error: "Payment request not found" }, { status: 404 })
    }

    console.log("Payment request found:", request)

    if (request.recipientId !== userId) {
      console.log("Unauthorized access attempt")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (request.status !== "pending") {
      console.log("Request already processed:", request.status)
      return NextResponse.json(
        { success: false, error: `Request has already been ${request.status}`, alreadyProcessed: true },
        { status: 409 },
      )
    }

    // Process the request
    if (action === "accept") {
      console.log("Processing payment request acceptance")

      // Process payment through Financial Core
      const result = await processRequestPayment(userId, request.amount, request.description, requestId)
      console.log("Financial core result:", result)

      if (!result.success) {
        console.log("Payment processing failed:", result.error)
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }

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

      // Get recipient user for notifications
      const recipient = await getUserById(userId)
      if (recipient) {
        console.log("Creating notification for sender")
        // Create notification for sender
        await createNotification({
          userId: request.senderId,
          type: "request_accepted",
          title: "Payment Request Accepted",
          message: `${recipient.fullName} accepted your payment request for $${request.amount.toFixed(2)}`,
          data: { requestId, amount: request.amount, transactionId: result.transactionId },
          isRead: false,
        })
      }

      console.log("Payment request accepted successfully")
      return NextResponse.json({
        success: true,
        message: "Payment request accepted",
        newBalance: result.newBalance,
        transactionId: result.transactionId,
      })
    } else {
      console.log("Processing payment request decline")

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
      return NextResponse.json({
        success: true,
        message: "Payment request declined",
      })
    }
  } catch (error) {
    console.error("=== PAYMENT REQUEST RESPONSE ERROR ===", error)
    // Always return JSON, even for errors
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
