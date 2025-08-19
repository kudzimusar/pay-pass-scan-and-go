import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getUserReceivedPaymentRequests, getUserById } from "../../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("Pending requests API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Fetching pending requests for user:", userId)

    // Get pending requests for the user
    const requests = await getUserReceivedPaymentRequests(userId)
    const pendingRequests = requests.filter((req) => req.status === "pending")

    console.log("Found", pendingRequests.length, "pending requests")

    // Enrich requests with sender information
    const enrichedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        const sender = await getUserById(request.senderId)
        return {
          ...request,
          senderName: sender?.fullName || "Unknown",
          senderPhone: sender?.phone || "Unknown",
        }
      }),
    )

    return NextResponse.json({
      success: true,
      requests: enrichedRequests,
    })
  } catch (error) {
    console.error("Pending requests API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
