/**
 * Notification Service
 * Centralized service for managing all notifications across PayPass
 * Supports real-time delivery, templates, and smart routing
 */

import { db } from "./drizzle";
import { notifications, users } from "../../../shared/schema";
import { eq } from "drizzle-orm";

export interface NotificationTemplate {
  id: string;
  type: 'payment' | 'security' | 'system' | 'marketing';
  title: string;
  message: string;
  defaultChannels: ('push' | 'sms' | 'email' | 'in_app')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  variables: string[]; // Variables that can be replaced in template
}

export interface NotificationContext {
  userId: string;
  templateId: string;
  variables: Record<string, any>;
  channels?: ('push' | 'sms' | 'email' | 'in_app')[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// Notification Templates
export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // Payment Templates
  payment_completed: {
    id: 'payment_completed',
    type: 'payment',
    title: 'Payment Completed',
    message: 'Your payment of {amount} {currency} to {recipient} has been completed successfully.',
    defaultChannels: ['push', 'in_app'],
    priority: 'normal',
    variables: ['amount', 'currency', 'recipient'],
  },
  
  payment_received: {
    id: 'payment_received',
    type: 'payment',
    title: 'Money Received',
    message: 'You have received {amount} {currency} from {sender}.',
    defaultChannels: ['push', 'sms', 'in_app'],
    priority: 'high',
    variables: ['amount', 'currency', 'sender'],
  },
  
  cross_border_initiated: {
    id: 'cross_border_initiated',
    type: 'payment',
    title: 'International Payment Sent',
    message: 'Your payment to {recipient} in {country} is being processed. Expected delivery: {eta}',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'normal',
    variables: ['recipient', 'country', 'eta'],
  },
  
  payment_failed: {
    id: 'payment_failed',
    type: 'payment',
    title: 'Payment Failed',
    message: 'Your payment of {amount} {currency} could not be processed. Reason: {reason}',
    defaultChannels: ['push', 'sms', 'email', 'in_app'],
    priority: 'high',
    variables: ['amount', 'currency', 'reason'],
  },
  
  mobile_money_topup_success: {
    id: 'mobile_money_topup_success',
    type: 'payment',
    title: 'Top-up Successful',
    message: 'Your {provider} top-up of {amount} {currency} was successful. New balance: {balance}',
    defaultChannels: ['push', 'sms', 'in_app'],
    priority: 'normal',
    variables: ['provider', 'amount', 'currency', 'balance'],
  },
  
  // Security Templates
  login_alert: {
    id: 'login_alert',
    type: 'security',
    title: 'New Login Detected',
    message: 'New login to your account from {device} in {location} at {time}. If this was not you, secure your account immediately.',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'high',
    variables: ['device', 'location', 'time'],
  },
  
  mfa_enabled: {
    id: 'mfa_enabled',
    type: 'security',
    title: 'Two-Factor Authentication Enabled',
    message: 'Two-factor authentication has been successfully enabled for your account. Your account is now more secure.',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'normal',
    variables: [],
  },
  
  fraud_alert: {
    id: 'fraud_alert',
    type: 'security',
    title: 'Suspicious Activity Detected',
    message: 'We detected suspicious activity on your account. Transaction of {amount} {currency} was blocked for your protection.',
    defaultChannels: ['push', 'sms', 'email', 'in_app'],
    priority: 'urgent',
    variables: ['amount', 'currency'],
  },
  
  password_changed: {
    id: 'password_changed',
    type: 'security',
    title: 'Password Changed',
    message: 'Your account password was successfully changed. If you did not make this change, contact support immediately.',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'high',
    variables: [],
  },
  
  // System Templates
  kyc_approved: {
    id: 'kyc_approved',
    type: 'system',
    title: 'Identity Verification Approved',
    message: 'Great news! Your identity verification has been approved. You can now access all PayPass features.',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'normal',
    variables: [],
  },
  
  kyc_rejected: {
    id: 'kyc_rejected',
    type: 'system',
    title: 'Identity Verification Required',
    message: 'We need additional information to verify your identity. Please upload new documents. Reason: {reason}',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'high',
    variables: ['reason'],
  },
  
  maintenance_notice: {
    id: 'maintenance_notice',
    type: 'system',
    title: 'Scheduled Maintenance',
    message: 'PayPass will undergo scheduled maintenance on {date} from {startTime} to {endTime}. Some services may be temporarily unavailable.',
    defaultChannels: ['push', 'email', 'in_app'],
    priority: 'normal',
    variables: ['date', 'startTime', 'endTime'],
  },
  
  account_limit_reached: {
    id: 'account_limit_reached',
    type: 'system',
    title: 'Transaction Limit Reached',
    message: 'You have reached your {limitType} transaction limit of {amount} {currency}. Limit resets on {resetDate}.',
    defaultChannels: ['push', 'in_app'],
    priority: 'normal',
    variables: ['limitType', 'amount', 'currency', 'resetDate'],
  },
  
  // Marketing Templates
  feature_announcement: {
    id: 'feature_announcement',
    type: 'marketing',
    title: 'New Feature: {featureName}',
    message: 'Exciting news! {featureName} is now available. {description} Try it now!',
    defaultChannels: ['push', 'in_app'],
    priority: 'low',
    variables: ['featureName', 'description'],
  },
  
  referral_reward: {
    id: 'referral_reward',
    type: 'marketing',
    title: 'Referral Reward Earned!',
    message: 'Congratulations! You earned {amount} {currency} for referring {friendName} to PayPass.',
    defaultChannels: ['push', 'in_app'],
    priority: 'normal',
    variables: ['amount', 'currency', 'friendName'],
  },
};

// Notification Service Class
export class NotificationService {
  /**
   * Send a notification using a template
   */
  static async sendTemplatedNotification(context: NotificationContext): Promise<string> {
    const template = NOTIFICATION_TEMPLATES[context.templateId];
    
    if (!template) {
      throw new Error(`Unknown notification template: ${context.templateId}`);
    }

    // Replace variables in title and message
    const title = this.replaceVariables(template.title, context.variables);
    const message = this.replaceVariables(template.message, context.variables);

    // Use template defaults or context overrides
    const channels = context.channels || template.defaultChannels;
    const priority = context.priority || template.priority;

    // Send notification via API
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: context.userId,
        type: template.type,
        title,
        message,
        data: {
          templateId: context.templateId,
          variables: context.variables,
        },
        channels,
        priority,
        scheduledFor: context.scheduledFor?.toISOString(),
        relatedEntityId: context.relatedEntityId,
        relatedEntityType: context.relatedEntityType,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }

    const result = await response.json();
    return result.notification.id;
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotification(
    userIds: string[],
    templateId: string,
    variables: Record<string, any>,
    options?: {
      channels?: ('push' | 'sms' | 'email' | 'in_app')[];
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      scheduledFor?: Date;
    }
  ): Promise<{ successful: number; failed: number; total: number }> {
    const template = NOTIFICATION_TEMPLATES[templateId];
    
    if (!template) {
      throw new Error(`Unknown notification template: ${templateId}`);
    }

    const title = this.replaceVariables(template.title, variables);
    const message = this.replaceVariables(template.message, variables);

    const response = await fetch('/api/notifications/send', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userIds,
        type: template.type,
        title,
        message,
        data: { templateId, variables },
        channels: options?.channels || template.defaultChannels,
        priority: options?.priority || template.priority,
        scheduledFor: options?.scheduledFor?.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send bulk notification: ${response.statusText}`);
    }

    const result = await response.json();
    return result.summary;
  }

  /**
   * Smart notification routing based on user preferences and context
   */
  static async sendSmartNotification(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    options?: {
      urgency?: 'low' | 'normal' | 'high' | 'urgent';
      context?: 'payment' | 'security' | 'marketing';
    }
  ): Promise<string> {
    // Get user notification preferences (simplified - would come from user settings)
    const userPreferences = await this.getUserNotificationPreferences(userId);
    
    const template = NOTIFICATION_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Unknown notification template: ${templateId}`);
    }

    // Apply smart routing logic
    let channels = template.defaultChannels;
    let priority = template.priority;

    // Override based on urgency
    if (options?.urgency === 'urgent') {
      channels = ['push', 'sms', 'email', 'in_app'];
      priority = 'urgent';
    } else if (options?.urgency === 'high') {
      channels = ['push', 'sms', 'in_app'];
      priority = 'high';
    }

    // Apply user preferences
    channels = channels.filter(channel => userPreferences.enabledChannels.includes(channel));

    // Ensure at least in-app notifications are sent
    if (channels.length === 0) {
      channels = ['in_app'];
    }

    return this.sendTemplatedNotification({
      userId,
      templateId,
      variables,
      channels,
      priority,
    });
  }

  /**
   * Replace variables in template strings
   */
  private static replaceVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  /**
   * Get user notification preferences (mock implementation)
   */
  private static async getUserNotificationPreferences(userId: string): Promise<{
    enabledChannels: ('push' | 'sms' | 'email' | 'in_app')[];
    quietHours: { start: string; end: string };
    frequency: 'all' | 'important_only' | 'minimal';
  }> {
    // In production, this would fetch from user settings
    return {
      enabledChannels: ['push', 'sms', 'email', 'in_app'],
      quietHours: { start: '22:00', end: '08:00' },
      frequency: 'all',
    };
  }

  /**
   * Predefined notification helpers for common scenarios
   */
  static async notifyPaymentCompleted(userId: string, amount: number, currency: string, recipient: string, transactionId: string): Promise<string> {
    return this.sendTemplatedNotification({
      userId,
      templateId: 'payment_completed',
      variables: { amount, currency, recipient },
      relatedEntityId: transactionId,
      relatedEntityType: 'transaction',
    });
  }

  static async notifyPaymentReceived(userId: string, amount: number, currency: string, sender: string, transactionId: string): Promise<string> {
    return this.sendTemplatedNotification({
      userId,
      templateId: 'payment_received',
      variables: { amount, currency, sender },
      relatedEntityId: transactionId,
      relatedEntityType: 'transaction',
    });
  }

  static async notifyFraudAlert(userId: string, amount: number, currency: string, transactionId: string): Promise<string> {
    return this.sendTemplatedNotification({
      userId,
      templateId: 'fraud_alert',
      variables: { amount, currency },
      priority: 'urgent',
      relatedEntityId: transactionId,
      relatedEntityType: 'fraud_detection',
    });
  }

  static async notifyKYCStatusChange(userId: string, approved: boolean, reason?: string): Promise<string> {
    const templateId = approved ? 'kyc_approved' : 'kyc_rejected';
    const variables = approved ? {} : { reason: reason || 'Additional documentation required' };
    
    return this.sendTemplatedNotification({
      userId,
      templateId,
      variables,
      relatedEntityId: userId,
      relatedEntityType: 'kyc_verification',
    });
  }

  static async notifyMobileMoneyTopup(userId: string, provider: string, amount: number, currency: string, balance: number, transactionId: string): Promise<string> {
    return this.sendTemplatedNotification({
      userId,
      templateId: 'mobile_money_topup_success',
      variables: { provider, amount, currency, balance },
      relatedEntityId: transactionId,
      relatedEntityType: 'mobile_money_transaction',
    });
  }
}

export default NotificationService;