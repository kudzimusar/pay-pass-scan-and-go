import { type NextRequest, NextResponse } from "next/server"
import {
  ensureSeeded,
  createPaymentRequest,
  getUserById,
  createNotification,
  getTransactionById,
} from "../../_lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("Linked request API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const body = await request.json()
    const { senderId, receiverId, linkedTransactionId } = body

    console.log("Linked request data:", { senderId, receiverId, linkedTransactionId })

    if (!senderId || !receiverId || !linkedTransactionId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 })
    }

    // Verify users exist
    const sender = await getUserById(senderId)
    const receiver = await getUserById(receiverId)

    if (!sender || !receiver) {
      return NextResponse.json({ error: "Invalid sender or receiver" }, { status: 400 })
    }

    // Get linked transaction
    const linkedTransaction = await getTransactionById(linkedTransactionId)
    if (!linkedTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    if (linkedTransaction.userId !== senderId) {
      return NextResponse.json({ error: "Transaction does not belong to sender" }, { status: 400 })
    }

    if (linkedTransaction.isPaid) {
      return NextResponse.json({ error: "Transaction is already paid" }, { status: 400 })
    }

    // Determine bill type based on transaction type
    let billType = "Other"
    switch (linkedTransaction.type) {
      case "bus_ticket":
        billType = "Bus Ticket"
        break
      case "grocery":
        billType = "Groceries"
        break
      case "utility":
        billType = "Utility Bill"
        break
    }

    // Create payment request
    const paymentRequest = await createPaymentRequest({
      senderId,
      receiverId,
      amount: linkedTransaction.amount,
      description: linkedTransaction.description,
      billType,
      linkedTransactionId,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    console.log("Linked payment request created:", paymentRequest.id)

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: "payment_request_received",
      title: "Payment Request",
      message: `${sender.fullName} asked you to pay for ${linkedTransaction.description} - $${linkedTransaction.amount.toFixed(2)}`,
      data: {
        requestId: paymentRequest.id,
        amount: linkedTransaction.amount,
        senderName: sender.fullName,
        linkedTransactionId,
        transactionDescription: linkedTransaction.description,
      },
      isRead: false,
    })

    console.log("Notification created for receiver")

    return NextResponse.json({
      success: true,
      message: "Payment request sent successfully",
      request: paymentRequest,
    })
  } catch (error) {
    console.error("Linked request API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
