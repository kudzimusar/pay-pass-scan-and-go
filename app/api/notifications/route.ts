import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getNotificationsForUser } from "../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const notifications = await getNotificationsForUser(userId, limit ? Number.parseInt(limit) : undefined)

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch notifications" }, { status: 500 })
  }
}
