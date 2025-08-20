import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getPaymentRequestsByRecipient, getUserById } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const requests = await getPaymentRequestsByRecipient(userId)

    // Enrich requests with sender information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const sender = await getUserById(request.senderId)
        return {
          ...request,
          senderName: sender?.fullName || "Unknown User",
          senderPhone: sender?.phone || "",
        }
      }),
    )

    return NextResponse.json({
      success: true,
      requests: enrichedRequests,
    })
  } catch (error) {
    console.error("Pending requests API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch pending requests" }, { status: 500 })
  }
}
