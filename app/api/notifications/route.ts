import { NextResponse } from "next/server"
import { verifyAuthHeader } from "../_lib/auth"
import { storage } from "../_lib/storage"

export async function GET(req: Request) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await storage.getNotificationsByUserId(auth.userId)

    return NextResponse.json({
      success: true,
      notifications,
    })
  } catch (error) {
    console.error("Get notifications error:", error)
    return NextResponse.json({ error: "Failed to get notifications" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = verifyAuthHeader(req.headers.get("authorization"))
    if (!auth || auth.type !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notificationId } = await req.json()

    await storage.markNotificationAsRead(notificationId, auth.userId)

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}
