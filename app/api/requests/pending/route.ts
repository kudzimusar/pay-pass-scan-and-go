import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../../_lib/auth"
import { storage } from "../../_lib/storage"

export async function GET(req: Request) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const type = url.searchParams.get("type") || "received" // 'sent' or 'received'

    let requests
    if (type === "sent") {
      requests = await storage.getPaymentRequestsBySender(auth.userId)
    } else {
      requests = await storage.getPaymentRequestsByRecipient(auth.userId)
    }

    // Get user details for each request
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const sender = await storage.getUser(request.senderId)
        const recipient = await storage.getUser(request.recipientId)

        return {
          ...request,
          sender: sender
            ? {
                id: sender.id,
                fullName: sender.fullName,
                phone: sender.phone,
              }
            : null,
          recipient: recipient
            ? {
                id: recipient.id,
                fullName: recipient.fullName,
                phone: recipient.phone,
              }
            : null,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      requests: requestsWithUsers,
    })
  } catch (error) {
    console.error("Get pending requests error:", error)
    return NextResponse.json({ error: "Failed to get pending requests" }, { status: 500 })
  }
}
