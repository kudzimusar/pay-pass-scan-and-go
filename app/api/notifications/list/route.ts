import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/drizzle";
import { notifications } from "../../../../shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type");
    const isRead = searchParams.get("isRead");
    const priority = searchParams.get("priority");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Build query conditions
    const conditions = [eq(notifications.userId, userId)];

    if (type) {
      conditions.push(eq(notifications.type, type));
    }

    if (isRead !== null) {
      conditions.push(eq(notifications.isRead, isRead === "true"));
    }

    if (priority) {
      conditions.push(eq(notifications.priority, priority));
    }

    if (startDate) {
      conditions.push(gte(notifications.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(notifications.createdAt, new Date(endDate)));
    }

    // Fetch notifications
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(and(...conditions));

    // Format notifications
    const formattedNotifications = userNotifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.parse(notification.data) : null,
      channels: JSON.parse(notification.channels),
      priority: notification.priority,
      isRead: notification.isRead,
      readAt: notification.readAt,
      deliveryStatus: notification.deliveryStatus,
      relatedEntityId: notification.relatedEntityId,
      relatedEntityType: notification.relatedEntityType,
      createdAt: notification.createdAt,
      scheduledFor: notification.scheduledFor,
    }));

    // Calculate unread count
    const unreadCount = await db
      .select({ count: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount.length,
      },
      summary: {
        unreadCount: unreadCount.length,
        totalCount: totalCount.length,
      },
    });
  } catch (error) {
    console.error("List notifications error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve notifications" },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read for the user
      if (!userId) {
        return NextResponse.json({ error: "User ID is required for mark all as read" }, { status: 400 });
      }

      await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else {
      // Mark specific notification as read
      if (!notificationId) {
        return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
      }

      const updatedNotification = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, notificationId))
        .returning();

      if (!updatedNotification.length) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        notification: updatedNotification[0],
        message: "Notification marked as read",
      });
    }
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
