import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { notifications, users } from "../../../../shared/schema";
import { eq } from "drizzle-orm";

const sendNotificationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(['payment', 'security', 'system', 'marketing']),
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  message: z.string().min(1, "Message is required").max(500, "Message too long"),
  data: z.record(z.any()).optional(), // Additional data payload
  channels: z.array(z.enum(['push', 'sms', 'email', 'in_app'])).min(1, "At least one channel required"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledFor: z.string().datetime().optional(),
  relatedEntityId: z.string().optional(),
  relatedEntityType: z.string().optional(),
});

// Notification templates for different types
const NOTIFICATION_TEMPLATES = {
  payment: {
    transaction_completed: {
      title: "Payment Completed",
      message: "Your payment of {amount} {currency} has been completed successfully.",
    },
    transaction_failed: {
      title: "Payment Failed",
      message: "Your payment of {amount} {currency} could not be processed. {reason}",
    },
    cross_border_initiated: {
      title: "International Payment Sent",
      message: "Your payment to {recipient} is being processed. Expected delivery: {eta}",
    },
    money_received: {
      title: "Money Received",
      message: "You've received {amount} {currency} from {sender}.",
    },
  },
  security: {
    mfa_enabled: {
      title: "Security Enhanced",
      message: "Two-factor authentication has been enabled for your account.",
    },
    suspicious_login: {
      title: "Security Alert",
      message: "New login detected from {location}. If this wasn't you, secure your account immediately.",
    },
    fraud_detected: {
      title: "Suspicious Activity",
      message: "We've detected unusual activity on your account. Transaction temporarily blocked for review.",
    },
  },
  system: {
    maintenance: {
      title: "Scheduled Maintenance",
      message: "PayPass will be undergoing maintenance on {date} from {time}. Services may be temporarily unavailable.",
    },
    feature_announcement: {
      title: "New Feature Available",
      message: "Great news! {feature} is now available. {description}",
    },
  },
};

// Mock notification delivery services
class NotificationDeliveryService {
  static async sendPushNotification(userId: string, title: string, message: string, data?: any): Promise<boolean> {
    // Simulate push notification service (Firebase, APNs, etc.)
    console.log(`Push notification sent to user ${userId}:`, { title, message });
    
    // Simulate 95% delivery success rate
    return Math.random() < 0.95;
  }

  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    // Simulate SMS service (Twilio, AWS SNS, etc.)
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
    
    // Simulate 90% delivery success rate
    return Math.random() < 0.90;
  }

  static async sendEmail(email: string, subject: string, body: string): Promise<boolean> {
    // Simulate email service (SendGrid, AWS SES, etc.)
    console.log(`Email sent to ${email}:`, { subject, body });
    
    // Simulate 98% delivery success rate
    return Math.random() < 0.98;
  }

  static async sendInAppNotification(userId: string, title: string, message: string, data?: any): Promise<boolean> {
    // In-app notifications are always successful (stored in database)
    return true;
  }
}

// Enhanced notification with template support
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notificationRequest = sendNotificationSchema.parse(body);

    // Verify user exists and get contact info
    const user = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        phone: users.phone,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, notificationRequest.userId))
      .limit(1);

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userInfo = user[0];

    // Create notification record
    const notification = await db
      .insert(notifications)
      .values({
        userId: notificationRequest.userId,
        type: notificationRequest.type,
        title: notificationRequest.title,
        message: notificationRequest.message,
        data: notificationRequest.data ? JSON.stringify(notificationRequest.data) : null,
        channels: JSON.stringify(notificationRequest.channels),
        priority: notificationRequest.priority,
        scheduledFor: notificationRequest.scheduledFor ? new Date(notificationRequest.scheduledFor) : null,
        relatedEntityId: notificationRequest.relatedEntityId,
        relatedEntityType: notificationRequest.relatedEntityType,
        deliveryStatus: 'pending',
      })
      .returning();

    const notificationId = notification[0].id;

    // Process notification delivery if not scheduled
    if (!notificationRequest.scheduledFor) {
      const deliveryResults = await processNotificationDelivery(
        notificationRequest,
        userInfo,
        notificationId
      );

      // Update notification with delivery status
      const overallStatus = deliveryResults.some(r => r.success) ? 'sent' : 'failed';
      await db
        .update(notifications)
        .set({ deliveryStatus: overallStatus })
        .where(eq(notifications.id, notificationId));

      return NextResponse.json({
        success: true,
        notification: {
          id: notificationId,
          status: overallStatus,
          deliveryResults,
        },
        message: "Notification sent successfully",
      });
    } else {
      return NextResponse.json({
        success: true,
        notification: {
          id: notificationId,
          status: 'scheduled',
          scheduledFor: notificationRequest.scheduledFor,
        },
        message: "Notification scheduled successfully",
      });
    }
  } catch (error) {
    console.error("Send notification error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}

async function processNotificationDelivery(
  notification: z.infer<typeof sendNotificationSchema>,
  userInfo: { fullName: string; phone: string; email: string },
  notificationId: string
) {
  const deliveryResults = [];

  // Process each delivery channel
  for (const channel of notification.channels) {
    let success = false;
    let error = null;

    try {
      switch (channel) {
        case 'push':
          success = await NotificationDeliveryService.sendPushNotification(
            notification.userId,
            notification.title,
            notification.message,
            notification.data
          );
          break;

        case 'sms':
          success = await NotificationDeliveryService.sendSMS(
            userInfo.phone,
            `${notification.title}: ${notification.message}`
          );
          break;

        case 'email':
          success = await NotificationDeliveryService.sendEmail(
            userInfo.email,
            notification.title,
            notification.message
          );
          break;

        case 'in_app':
          success = await NotificationDeliveryService.sendInAppNotification(
            notification.userId,
            notification.title,
            notification.message,
            notification.data
          );
          break;

        default:
          throw new Error(`Unsupported channel: ${channel}`);
      }
    } catch (channelError) {
      error = channelError instanceof Error ? channelError.message : 'Unknown error';
      success = false;
    }

    deliveryResults.push({
      channel,
      success,
      error,
      timestamp: new Date().toISOString(),
    });
  }

  return deliveryResults;
}

// Bulk notification endpoint
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, ...notificationData } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required" }, { status: 400 });
    }

    if (userIds.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 users per bulk notification" }, { status: 400 });
    }

    const results = [];

    // Process notifications in batches of 50
    const batchSize = 50;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId: string) => {
        try {
          const response = await fetch(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...notificationData,
              userId,
            }),
          });

          return {
            userId,
            success: response.ok,
            status: response.status,
          };
        } catch (error) {
          return {
            userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        successRate: Math.round((successCount / results.length) * 100),
      },
      results,
      message: `Bulk notification processed: ${successCount}/${results.length} successful`,
    });
  } catch (error) {
    console.error("Bulk notification error:", error);
    return NextResponse.json(
      { error: "Failed to process bulk notification" },
      { status: 500 }
    );
  }
}