import { type NextRequest, NextResponse } from "next/server"
import { ensureSeeded, getUserNotifications, markNotificationAsRead } from "../_lib/storage"

export async function GET(request: NextRequest) {
  try {
    console.log("Notifications API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = searchParams.get("limit")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("Fetching notifications for user:", userId)

    const notifications = await getUserNotifications(userId, limit ? Number.parseInt(limit) : undefined)

    console.log("Found", notifications.length, "notifications")

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("Mark notification as read API called")

    // Ensure storage is seeded
    await ensureSeeded()

    const body = await request.json()
    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    console.log("Marking notification as read:", notificationId)

    const success = await markNotificationAsRead(notificationId)

    if (!success) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification as read API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
