import { NextResponse } from "next/server"
import { ensureSeeded, markNotificationAsRead } from "../../../_lib/storage"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeeded()
    const { id } = await params
    const notificationId = id

    if (!notificationId) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 })
    }

    const success = await markNotificationAsRead(notificationId)

    if (!success) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
