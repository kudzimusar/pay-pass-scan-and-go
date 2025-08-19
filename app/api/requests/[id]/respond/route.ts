import { type NextRequest, NextResponse } from "next/server"
import {
  ensureSeeded,
  getPaymentRequestById,
  updatePaymentRequestStatus,
  getUserById,
  updateUserWalletBalance,
  createTransaction,
  createNotification,
  getTransactionById,
  updateTransactionStatus,
} from "../../../../_lib/storage"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Respond to request API called for ID:", params.id)

    // Ensure storage is seeded
    await ensureSeeded()

    const body = await request.json()
    const { action, userId } = body // action: 'accept' or 'decline'

    console.log("Request body:", { action, userId })

    if (!action || !userId) {
      console.log("Missing required fields:", { action, userId })
      return NextResponse.json({ error: "Action and user ID are required" }, { status: 400 })
    }

    if (!["accept", "decline"].includes(action)) {
      console.log("Invalid action:", action)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log("Processing action:", action, "for user:", userId)

    // Get the payment request
    const paymentRequest = await getPaymentRequestById(params.id)
    if (!paymentRequest) {
      console.log("Payment request not found:", params.id)
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 })
    }

    console.log("Found payment request:", {
      id: paymentRequest.id,
      amount: paymentRequest.amount,
      status: paymentRequest.status,
      receiverId: paymentRequest.receiverId,
    })

    if (paymentRequest.receiverId !== userId) {
      console.log("Unauthorized access attempt:", {
        requestReceiverId: paymentRequest.receiverId,
        userId,
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (paymentRequest.status !== "pending") {
      console.log("Request already processed:", paymentRequest.status)
      return NextResponse.json({ error: "Request already processed" }, { status: 400 })
    }

    console.log("Processing request:", paymentRequest.description, "Amount:", paymentRequest.amount)

    if (action === "accept") {
      // Get receiver (current user) details
      const receiver = await getUserById(userId)
      if (!receiver) {
        console.log("Receiver not found:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      console.log("Receiver details:", {
        id: receiver.id,
        name: receiver.fullName,
        balance: receiver.walletBalance,
      })

      // Check if receiver has sufficient balance
      if (receiver.walletBalance < paymentRequest.amount) {
        console.log("Insufficient balance:", {
          required: paymentRequest.amount,
          available: receiver.walletBalance,
        })
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // Get sender details
      const sender = await getUserById(paymentRequest.senderId)
      if (!sender) {
        console.log("Sender not found:", paymentRequest.senderId)
        return NextResponse.json({ error: "Sender not found" }, { status: 404 })
      }

      console.log("Sender details:", {
        id: sender.id,
        name: sender.fullName,
        balance: sender.walletBalance,
      })

      // Update balances
      const newReceiverBalance = receiver.walletBalance - paymentRequest.amount
      const newSenderBalance = sender.walletBalance + paymentRequest.amount

      console.log("Updating balances:", {
        receiverOld: receiver.walletBalance,
        receiverNew: newReceiverBalance,
        senderOld: sender.walletBalance,
        senderNew: newSenderBalance,
      })

      const receiverUpdateResult = await updateUserWalletBalance(receiver.id, newReceiverBalance)
      const senderUpdateResult = await updateUserWalletBalance(sender.id, newSenderBalance)

      if (!receiverUpdateResult || !senderUpdateResult) {
        console.log("Failed to update balances:", {
          receiverUpdate: receiverUpdateResult,
          senderUpdate: senderUpdateResult,
        })
        return NextResponse.json({ error: "Failed to update balances" }, { status: 500 })
      }

      console.log("Balances updated successfully")

      // Create transactions
      try {
        await createTransaction({
          userId: receiver.id,
          type: "payment",
          amount: -paymentRequest.amount,
          description: `Payment to ${sender.fullName} - ${paymentRequest.description}`,
          status: "completed",
          isPaid: true,
        })

        await createTransaction({
          userId: sender.id,
          type: "payment",
          amount: paymentRequest.amount,
          description: `Payment from ${receiver.fullName} - ${paymentRequest.description}`,
          status: "completed",
          isPaid: true,
        })

        console.log("Transactions created successfully")
      } catch (txnError) {
        console.error("Error creating transactions:", txnError)
        // Continue processing even if transaction creation fails
      }

      // If this is a linked request, update the original transaction
      if (paymentRequest.linkedTransactionId) {
        console.log("Updating linked transaction:", paymentRequest.linkedTransactionId)
        try {
          const linkedTransaction = await getTransactionById(paymentRequest.linkedTransactionId)
          if (linkedTransaction) {
            await updateTransactionStatus(paymentRequest.linkedTransactionId, "completed", true)
            console.log("Linked transaction updated successfully")
          } else {
            console.log("Linked transaction not found:", paymentRequest.linkedTransactionId)
          }
        } catch (linkedError) {
          console.error("Error updating linked transaction:", linkedError)
          // Continue processing even if linked transaction update fails
        }
      }

      // Create notification for sender
      try {
        await createNotification({
          userId: sender.id,
          type: "payment_request_accepted",
          title: "Payment Received",
          message: `${receiver.fullName} accepted your payment request for $${paymentRequest.amount.toFixed(2)}`,
          data: {
            requestId: paymentRequest.id,
            amount: paymentRequest.amount,
            receiverName: receiver.fullName,
          },
          isRead: false,
        })
        console.log("Notification created for sender")
      } catch (notifError) {
        console.error("Error creating notification:", notifError)
        // Continue processing even if notification creation fails
      }

      console.log("Payment processed successfully")
    }

    // Update request status
    console.log("Updating request status to:", action === "accept" ? "accepted" : "declined")
    const updatedRequest = await updatePaymentRequestStatus(
      params.id,
      action === "accept" ? "accepted" : "declined",
      new Date(),
    )

    if (!updatedRequest) {
      console.log("Failed to update request status")
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
    }

    console.log("Request status updated successfully")

    // Create notification for sender if declined
    if (action === "decline") {
      try {
        const receiver = await getUserById(userId)
        const sender = await getUserById(paymentRequest.senderId)

        if (receiver && sender) {
          await createNotification({
            userId: sender.id,
            type: "payment_request_declined",
            title: "Payment Request Declined",
            message: `${receiver.fullName} declined your payment request for $${paymentRequest.amount.toFixed(2)}`,
            data: {
              requestId: paymentRequest.id,
              amount: paymentRequest.amount,
              receiverName: receiver.fullName,
            },
            isRead: false,
          })
          console.log("Decline notification created for sender")
        }
      } catch (notifError) {
        console.error("Error creating decline notification:", notifError)
        // Continue processing even if notification creation fails
      }
    }

    console.log("Request", action === "accept" ? "accepted" : "declined", "successfully")

    return NextResponse.json({
      success: true,
      message: `Request ${action === "accept" ? "accepted" : "declined"} successfully`,
      request: updatedRequest,
    })
  } catch (error) {
    console.error("Respond to request API error:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
