import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Mobile Push Notifications API
// Handles notification preferences, push notification management, and delivery tracking

const notificationPreferencesSchema = z.object({
  categories: z.object({
    payments: z.boolean(),
    security: z.boolean(),
    promotions: z.boolean(),
    social: z.boolean(),
    bills: z.boolean(),
    compliance: z.boolean()
  }),
  channels: z.object({
    push: z.boolean(),
    email: z.boolean(),
    sms: z.boolean(),
    inApp: z.boolean()
  }),
  timing: z.object({
    quietHours: z.object({
      enabled: z.boolean(),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // HH:MM format
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    }),
    timezone: z.string()
  }),
  deviceSettings: z.object({
    sound: z.boolean(),
    vibration: z.boolean(),
    badge: z.boolean(),
    lockScreen: z.boolean()
  })
});

const pushTokenSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string(),
  appVersion: z.string()
});

const sendNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().max(100),
  body: z.string().max(500),
  category: z.enum(['payment', 'security', 'promotion', 'social', 'bill', 'compliance', 'system']),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  data: z.record(z.any()).optional(),
  actions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    action: z.string()
  })).optional(),
  scheduling: z.object({
    sendAt: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

// Mock data stores
const mockNotificationPreferences = new Map();
const mockPushTokens = new Map();
const mockNotifications = new Map();
const mockNotificationHistory = new Map();

// Initialize mock data
const initializeMockData = () => {
  if (mockNotificationPreferences.size === 0) {
    // Default preferences for a user
    mockNotificationPreferences.set('user_1', {
      userId: 'user_1',
      categories: {
        payments: true,
        security: true,
        promotions: false,
        social: true,
        bills: true,
        compliance: true
      },
      channels: {
        push: true,
        email: true,
        sms: false,
        inApp: true
      },
      timing: {
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        timezone: 'America/New_York'
      },
      deviceSettings: {
        sound: true,
        vibration: true,
        badge: true,
        lockScreen: false
      },
      updatedAt: new Date().toISOString()
    });

    // Sample push tokens
    mockPushTokens.set('user_1', [
      {
        token: 'fcm_token_12345_ios',
        platform: 'ios',
        deviceId: 'device_ios_123',
        appVersion: '2.1.0',
        active: true,
        registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date().toISOString()
      },
      {
        token: 'fcm_token_67890_android',
        platform: 'android',
        deviceId: 'device_android_456',
        appVersion: '2.0.8',
        active: false, // Old device
        registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]);

    // Sample notification history
    const sampleNotifications = [
      {
        id: 'notif_1',
        userId: 'user_1',
        title: 'Payment Received',
        body: 'You received $50.00 from John Doe',
        category: 'payment',
        priority: 'normal',
        status: 'delivered',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1500).toISOString(),
        readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        data: { transactionId: 'txn_123', amount: 50.00, currency: 'USD' }
      },
      {
        id: 'notif_2',
        userId: 'user_1',
        title: 'Security Alert',
        body: 'New device login detected from New York',
        category: 'security',
        priority: 'high',
        status: 'delivered',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 6 * 60 * 60 * 1000 + 800).toISOString(),
        readAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        data: { deviceId: 'device_new_789', location: 'New York, NY' }
      },
      {
        id: 'notif_3',
        userId: 'user_1',
        title: 'Bill Due Reminder',
        body: 'Your electric bill of $89.99 is due tomorrow',
        category: 'bill',
        priority: 'normal',
        status: 'delivered',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 1200).toISOString(),
        readAt: null, // Unread
        data: { billId: 'bill_456', amount: 89.99, dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
      }
    ];

    sampleNotifications.forEach(notif => {
      mockNotifications.set(notif.id, notif);
    });

    // Store user's notification history
    mockNotificationHistory.set('user_1', sampleNotifications.map(n => n.id));
  }
};

// Helper function to authenticate mobile requests
const authenticateRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mobile-secret') as any;
  
  if (decoded.platform !== 'mobile') {
    throw new Error('Invalid token platform');
  }

  return decoded;
};

// Check if notification should be sent based on preferences and timing
const shouldSendNotification = (preferences: any, category: string, currentTime: Date) => {
  // Check if category is enabled
  if (!preferences.categories[category]) {
    return { allowed: false, reason: 'Category disabled' };
  }

  // Check if push notifications are enabled
  if (!preferences.channels.push) {
    return { allowed: false, reason: 'Push notifications disabled' };
  }

  // Check quiet hours
  if (preferences.timing.quietHours.enabled) {
    const now = currentTime.toLocaleTimeString('en-US', { 
      timeZone: preferences.timing.timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const start = preferences.timing.quietHours.start;
    const end = preferences.timing.quietHours.end;
    
    // Simple time comparison (doesn't handle cross-midnight ranges perfectly)
    if (start <= end) {
      if (now >= start && now <= end) {
        return { allowed: false, reason: 'Quiet hours active' };
      }
    } else {
      if (now >= start || now <= end) {
        return { allowed: false, reason: 'Quiet hours active' };
      }
    }
  }

  return { allowed: true, reason: 'All checks passed' };
};

// Simulate sending push notification
const sendPushNotification = async (tokens: any[], notification: any) => {
  const results = [];
  
  for (const tokenInfo of tokens) {
    if (!tokenInfo.active) {
      results.push({
        token: tokenInfo.token,
        status: 'skipped',
        reason: 'Inactive token'
      });
      continue;
    }

    // Simulate FCM/APNS delivery
    const deliverySuccess = Math.random() > 0.05; // 95% success rate
    const deliveryTime = Math.random() * 2000 + 500; // 500-2500ms

    await new Promise(resolve => setTimeout(resolve, deliveryTime));

    results.push({
      token: tokenInfo.token,
      platform: tokenInfo.platform,
      status: deliverySuccess ? 'delivered' : 'failed',
      deliveredAt: deliverySuccess ? new Date().toISOString() : null,
      error: deliverySuccess ? null : 'Network timeout'
    });
  }

  return results;
};

// GET /api/mobile/notifications - Get notifications and preferences
export async function GET(request: NextRequest) {
  try {
    initializeMockData();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'preferences':
        return getNotificationPreferences(decoded.userId);
      case 'history':
        return getNotificationHistory(decoded.userId, searchParams);
      case 'unread':
        return getUnreadNotifications(decoded.userId);
      case 'tokens':
        return getPushTokens(decoded.userId);
      case 'stats':
        return getNotificationStats(decoded.userId);
      default:
        return getNotificationOverview(decoded.userId);
    }

  } catch (error) {
    console.error('Notification query error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification data' },
      { status: 500 }
    );
  }
}

// POST /api/mobile/notifications - Manage notifications
export async function POST(request: NextRequest) {
  try {
    initializeMockData();
    
    const body = await request.json();
    const { action } = body;
    const decoded = authenticateRequest(request);
    
    switch (action) {
      case 'update_preferences':
        return updateNotificationPreferences(decoded.userId, body);
      case 'register_token':
        return registerPushToken(decoded.userId, body);
      case 'unregister_token':
        return unregisterPushToken(decoded.userId, body);
      case 'mark_read':
        return markNotificationAsRead(decoded.userId, body);
      case 'mark_all_read':
        return markAllNotificationsAsRead(decoded.userId);
      case 'send': // Admin function
        return sendNotification(body);
      case 'test':
        return sendTestNotification(decoded.userId, body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json(
      { success: false, error: 'Notification action failed' },
      { status: 500 }
    );
  }
}

const getNotificationPreferences = (userId: string) => {
  const preferences = mockNotificationPreferences.get(userId);
  
  if (!preferences) {
    return NextResponse.json(
      { success: false, error: 'Preferences not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: preferences
  });
};

const getNotificationHistory = (userId: string, searchParams: URLSearchParams) => {
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category');
  const unreadOnly = searchParams.get('unread_only') === 'true';
  
  const notificationIds = mockNotificationHistory.get(userId) || [];
  let notifications = notificationIds
    .map((id: string) => mockNotifications.get(id))
    .filter((notif: any) => notif)
    .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  if (category) {
    notifications = notifications.filter((notif: any) => notif.category === category);
  }

  if (unreadOnly) {
    notifications = notifications.filter((notif: any) => !notif.readAt);
  }

  const paginatedNotifications = notifications.slice(offset, offset + limit);
  
  return NextResponse.json({
    success: true,
    data: {
      notifications: paginatedNotifications,
      pagination: {
        total: notifications.length,
        limit,
        offset,
        hasMore: offset + limit < notifications.length
      },
      summary: {
        totalNotifications: notificationIds.length,
        unreadCount: notifications.filter((notif: any) => !notif.readAt).length,
        categories: notifications.reduce((acc: any, notif: any) => {
          acc[notif.category] = (acc[notif.category] || 0) + 1;
          return acc;
        }, {})
      }
    }
  });
};

const getUnreadNotifications = (userId: string) => {
  const notificationIds = mockNotificationHistory.get(userId) || [];
  const unreadNotifications = notificationIds
    .map((id: string) => mockNotifications.get(id))
    .filter((notif: any) => notif && !notif.readAt)
    .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return NextResponse.json({
    success: true,
    data: {
      notifications: unreadNotifications,
      count: unreadNotifications.length,
      categories: unreadNotifications.reduce((acc: any, notif: any) => {
        acc[notif.category] = (acc[notif.category] || 0) + 1;
        return acc;
      }, {})
    }
  });
};

const getPushTokens = (userId: string) => {
  const tokens = mockPushTokens.get(userId) || [];
  
  return NextResponse.json({
    success: true,
    data: {
      tokens: tokens.map((token: any) => ({
        platform: token.platform,
        deviceId: token.deviceId,
        appVersion: token.appVersion,
        active: token.active,
        registeredAt: token.registeredAt,
        lastUsed: token.lastUsed
      })),
      activeTokens: tokens.filter((token: any) => token.active).length,
      totalTokens: tokens.length
    }
  });
};

const getNotificationStats = (userId: string) => {
  const notificationIds = mockNotificationHistory.get(userId) || [];
  const notifications = notificationIds.map((id: string) => mockNotifications.get(id)).filter(Boolean);
  
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentNotifications = notifications.filter((notif: any) => 
    new Date(notif.sentAt) > last30Days
  );

  const deliveryStats = {
    total: notifications.length,
    delivered: notifications.filter((notif: any) => notif.status === 'delivered').length,
    failed: notifications.filter((notif: any) => notif.status === 'failed').length,
    pending: notifications.filter((notif: any) => notif.status === 'pending').length
  };

  const readStats = {
    total: notifications.filter((notif: any) => notif.status === 'delivered').length,
    read: notifications.filter((notif: any) => notif.readAt).length,
    unread: notifications.filter((notif: any) => !notif.readAt && notif.status === 'delivered').length
  };

  return NextResponse.json({
    success: true,
    data: {
      delivery: {
        ...deliveryStats,
        rate: deliveryStats.total > 0 ? (deliveryStats.delivered / deliveryStats.total * 100).toFixed(1) : '0'
      },
      readRate: {
        ...readStats,
        rate: readStats.total > 0 ? (readStats.read / readStats.total * 100).toFixed(1) : '0'
      },
      recent: {
        count: recentNotifications.length,
        categories: recentNotifications.reduce((acc: any, notif: any) => {
          acc[notif.category] = (acc[notif.category] || 0) + 1;
          return acc;
        }, {})
      },
      averageDeliveryTime: '1.2s' // Mock average
    }
  });
};

const getNotificationOverview = (userId: string) => {
  const preferences = mockNotificationPreferences.get(userId);
  const tokens = mockPushTokens.get(userId) || [];
  const notificationIds = mockNotificationHistory.get(userId) || [];
  const unreadCount = notificationIds
    .map((id: string) => mockNotifications.get(id))
    .filter((notif: any) => notif && !notif.readAt).length;

  return NextResponse.json({
    success: true,
    data: {
      preferences: {
        pushEnabled: preferences?.channels?.push || false,
        categoriesEnabled: Object.values(preferences?.categories || {}).filter(Boolean).length
      },
      devices: {
        total: tokens.length,
        active: tokens.filter((token: any) => token.active).length
      },
      notifications: {
        unread: unreadCount,
        total: notificationIds.length
      }
    }
  });
};

const updateNotificationPreferences = (userId: string, body: any) => {
  const validation = notificationPreferencesSchema.safeParse(body.preferences);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid preferences data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const preferences = {
    userId,
    ...validation.data,
    updatedAt: new Date().toISOString()
  };

  mockNotificationPreferences.set(userId, preferences);

  return NextResponse.json({
    success: true,
    data: {
      preferences,
      message: 'Notification preferences updated successfully'
    }
  });
};

const registerPushToken = (userId: string, body: any) => {
  const validation = pushTokenSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid token data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { token, platform, deviceId, appVersion } = validation.data;
  const tokens = mockPushTokens.get(userId) || [];
  
  // Deactivate old tokens for the same device
  const updatedTokens = tokens.map((t: any) => 
    t.deviceId === deviceId ? { ...t, active: false } : t
  );

  // Add new token
  updatedTokens.push({
    token,
    platform,
    deviceId,
    appVersion,
    active: true,
    registeredAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  });

  mockPushTokens.set(userId, updatedTokens);

  return NextResponse.json({
    success: true,
    data: {
      message: 'Push token registered successfully',
      tokenId: token.substr(-8),
      platform,
      deviceId
    }
  });
};

const unregisterPushToken = (userId: string, body: any) => {
  const { deviceId } = body;
  const tokens = mockPushTokens.get(userId) || [];
  
  const updatedTokens = tokens.filter((t: any) => t.deviceId !== deviceId);
  mockPushTokens.set(userId, updatedTokens);

  return NextResponse.json({
    success: true,
    data: {
      message: 'Push token unregistered successfully',
      deviceId
    }
  });
};

const markNotificationAsRead = (userId: string, body: any) => {
  const { notificationId } = body;
  const notification = mockNotifications.get(notificationId);
  
  if (!notification || notification.userId !== userId) {
    return NextResponse.json(
      { success: false, error: 'Notification not found' },
      { status: 404 }
    );
  }

  notification.readAt = new Date().toISOString();
  mockNotifications.set(notificationId, notification);

  return NextResponse.json({
    success: true,
    data: {
      message: 'Notification marked as read',
      notificationId,
      readAt: notification.readAt
    }
  });
};

const markAllNotificationsAsRead = (userId: string) => {
  const notificationIds = mockNotificationHistory.get(userId) || [];
  let updatedCount = 0;

  notificationIds.forEach((id: string) => {
    const notification = mockNotifications.get(id);
    if (notification && !notification.readAt) {
      notification.readAt = new Date().toISOString();
      mockNotifications.set(id, notification);
      updatedCount++;
    }
  });

  return NextResponse.json({
    success: true,
    data: {
      message: 'All notifications marked as read',
      updatedCount
    }
  });
};

const sendNotification = async (body: any) => {
  const validation = sendNotificationSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid notification data', details: validation.error.errors },
      { status: 400 }
    );
  }

  const { userId, title, body: notificationBody, category, priority, data, actions, scheduling } = validation.data;
  
  // Get user preferences
  const preferences = mockNotificationPreferences.get(userId);
  if (!preferences) {
    return NextResponse.json(
      { success: false, error: 'User preferences not found' },
      { status: 404 }
    );
  }

  // Check if notification should be sent
  const currentTime = new Date();
  const shouldSend = shouldSendNotification(preferences, category, currentTime);
  
  if (!shouldSend.allowed) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'skipped',
        reason: shouldSend.reason,
        scheduledFor: scheduling?.sendAt || null
      }
    });
  }

  // Get user's push tokens
  const tokens = mockPushTokens.get(userId) || [];
  const activeTokens = tokens.filter((token: any) => token.active);

  if (activeTokens.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        status: 'no_devices',
        message: 'No active devices found for user'
      }
    });
  }

  // Create notification record
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const notification = {
    id: notificationId,
    userId,
    title,
    body: notificationBody,
    category,
    priority,
    data,
    actions,
    status: 'sending',
    sentAt: currentTime.toISOString(),
    deliveredAt: null,
    readAt: null
  };

  mockNotifications.set(notificationId, notification);

  // Add to user's notification history
  const userNotifications = mockNotificationHistory.get(userId) || [];
  userNotifications.unshift(notificationId);
  mockNotificationHistory.set(userId, userNotifications);

  // Send push notification
  const deliveryResults = await sendPushNotification(activeTokens, notification);
  
  // Update notification status
  const successfulDeliveries = deliveryResults.filter(r => r.status === 'delivered').length;
  if (successfulDeliveries > 0) {
    notification.status = 'delivered';
    notification.deliveredAt = new Date().toISOString();
  } else {
    notification.status = 'failed';
  }
  
  mockNotifications.set(notificationId, notification);

  return NextResponse.json({
    success: true,
    data: {
      notificationId,
      status: notification.status,
      deliveryResults,
      sentTo: activeTokens.length,
      delivered: successfulDeliveries
    }
  });
};

const sendTestNotification = async (userId: string, body: any) => {
  const { title = 'Test Notification', message = 'This is a test notification from PayPass' } = body;
  
  const testNotification = {
    userId,
    title,
    body: message,
    category: 'system',
    priority: 'normal',
    data: { test: true, timestamp: new Date().toISOString() }
  };

  return sendNotification(testNotification);
};
