/**
 * Notification Service
 * 
 * Core service for handling all types of notifications:
 * - Email notifications
 * - SMS notifications  
 * - Push notifications
 * - In-app notifications
 */

import { v4 as uuidv4 } from 'uuid';
import { EmailService } from './email.service';
import { SMSService } from './sms.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationQueue } from './notification.queue';
import { NotificationTemplate } from '../types/notification.types';

export interface NotificationRequest {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  template: string;
  data: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface NotificationResponse {
  id: string;
  status: 'queued' | 'sent' | 'failed';
  message?: string;
  sentAt?: Date;
}

export class NotificationService {
  private emailService: EmailService;
  private smsService: SMSService;
  private pushService: PushNotificationService;
  private queue: NotificationQueue;

  constructor() {
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.pushService = new PushNotificationService();
    this.queue = new NotificationQueue();
  }

  /**
   * Send a notification
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    const notificationId = uuidv4();
    
    try {
      // Validate request
      this.validateNotificationRequest(request);

      // Get template
      const template = await this.getTemplate(request.template);
      
      // Process notification based on type
      let result: NotificationResponse;

      switch (request.type) {
        case 'email':
          result = await this.sendEmailNotification(notificationId, request, template);
          break;
        case 'sms':
          result = await this.sendSMSNotification(notificationId, request, template);
          break;
        case 'push':
          result = await this.sendPushNotification(notificationId, request, template);
          break;
        case 'in-app':
          result = await this.sendInAppNotification(notificationId, request, template);
          break;
        default:
          throw new Error(`Unsupported notification type: ${request.type}`);
      }

      // Queue for tracking if needed
      if (request.priority === 'high' || request.priority === 'urgent') {
        await this.queue.addToTrackingQueue(notificationId, request);
      }

      return result;

    } catch (error) {
      console.error(`[NotificationService] Failed to send notification:`, error);
      
      return {
        id: notificationId,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    id: string,
    request: NotificationRequest,
    template: NotificationTemplate
  ): Promise<NotificationResponse> {
    const emailData = {
      to: request.data.email as string,
      subject: this.processTemplate(template.subject, request.data),
      html: this.processTemplate(template.html, request.data),
      text: this.processTemplate(template.text, request.data),
    };

    const result = await this.emailService.sendEmail(emailData);

    return {
      id,
      status: result.success ? 'sent' : 'failed',
      message: result.message,
      sentAt: result.success ? new Date() : undefined,
    };
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    id: string,
    request: NotificationRequest,
    template: NotificationTemplate
  ): Promise<NotificationResponse> {
    const smsData = {
      to: request.data.phoneNumber as string,
      message: this.processTemplate(template.text, request.data),
    };

    const result = await this.smsService.sendSMS(smsData);

    return {
      id,
      status: result.success ? 'sent' : 'failed',
      message: result.message,
      sentAt: result.success ? new Date() : undefined,
    };
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    id: string,
    request: NotificationRequest,
    template: NotificationTemplate
  ): Promise<NotificationResponse> {
    const pushData = {
      userId: request.userId,
      title: this.processTemplate(template.title || template.subject, request.data),
      body: this.processTemplate(template.text, request.data),
      data: request.data,
    };

    const result = await this.pushService.sendPushNotification(pushData);

    return {
      id,
      status: result.success ? 'sent' : 'failed',
      message: result.message,
      sentAt: result.success ? new Date() : undefined,
    };
  }

  /**
   * Send in-app notification
   */
  private async sendInAppNotification(
    id: string,
    request: NotificationRequest,
    template: NotificationTemplate
  ): Promise<NotificationResponse> {
    // Store in-app notification in database/queue for user to retrieve
    const inAppData = {
      id,
      userId: request.userId,
      title: this.processTemplate(template.title || template.subject, request.data),
      message: this.processTemplate(template.text, request.data),
      type: request.template,
      data: request.data,
      createdAt: new Date(),
      read: false,
    };

    await this.queue.addInAppNotification(inAppData);

    return {
      id,
      status: 'sent',
      sentAt: new Date(),
    };
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(requests: NotificationRequest[]): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];

    // Process in batches to avoid overwhelming the system
    const batchSize = 10;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(request => this.sendNotification(request))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Schedule a notification for later delivery
   */
  async scheduleNotification(request: NotificationRequest): Promise<NotificationResponse> {
    if (!request.scheduledAt) {
      throw new Error('Scheduled notifications must have a scheduledAt date');
    }

    const notificationId = uuidv4();
    
    // Add to scheduled queue
    await this.queue.addToScheduledQueue(notificationId, request);

    return {
      id: notificationId,
      status: 'queued',
    };
  }

  /**
   * Get user's in-app notifications
   */
  async getInAppNotifications(userId: string, limit: number = 50): Promise<any[]> {
    return await this.queue.getInAppNotifications(userId, limit);
  }

  /**
   * Mark in-app notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    await this.queue.markNotificationAsRead(userId, notificationId);
  }

  /**
   * Get notification templates
   */
  async getTemplates(): Promise<NotificationTemplate[]> {
    return await this.getAvailableTemplates();
  }

  /**
   * Validate notification request
   */
  private validateNotificationRequest(request: NotificationRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.template) {
      throw new Error('Template is required');
    }

    if (!request.data) {
      throw new Error('Notification data is required');
    }

    // Validate type-specific requirements
    switch (request.type) {
      case 'email':
        if (!request.data.email) {
          throw new Error('Email address is required for email notifications');
        }
        break;
      case 'sms':
        if (!request.data.phoneNumber) {
          throw new Error('Phone number is required for SMS notifications');
        }
        break;
    }
  }

  /**
   * Get notification template
   */
  private async getTemplate(templateName: string): Promise<NotificationTemplate> {
    const templates = await this.getAvailableTemplates();
    const template = templates.find(t => t.name === templateName);
    
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    return template;
  }

  /**
   * Process template with data
   */
  private processTemplate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key]?.toString() || match;
    });
  }

  /**
   * Get available templates (in a real implementation, this would come from a database)
   */
  private async getAvailableTemplates(): Promise<NotificationTemplate[]> {
    return [
      {
        name: 'payment_success',
        subject: 'Payment Successful - {{amount}} {{currency}}',
        title: 'Payment Successful',
        text: 'Your payment of {{amount}} {{currency}} has been processed successfully.',
        html: `
          <h2>Payment Successful</h2>
          <p>Your payment of <strong>{{amount}} {{currency}}</strong> has been processed successfully.</p>
          <p>Transaction ID: {{transactionId}}</p>
          <p>Thank you for using PayPass!</p>
        `,
      },
      {
        name: 'payment_failed',
        subject: 'Payment Failed - {{amount}} {{currency}}',
        title: 'Payment Failed',
        text: 'Your payment of {{amount}} {{currency}} has failed. Please try again.',
        html: `
          <h2>Payment Failed</h2>
          <p>Your payment of <strong>{{amount}} {{currency}}</strong> has failed.</p>
          <p>Reason: {{reason}}</p>
          <p>Please try again or contact support if the problem persists.</p>
        `,
      },
      {
        name: 'welcome',
        subject: 'Welcome to PayPass!',
        title: 'Welcome to PayPass',
        text: 'Welcome to PayPass! Your account has been created successfully.',
        html: `
          <h2>Welcome to PayPass!</h2>
          <p>Hi {{firstName}},</p>
          <p>Welcome to PayPass! Your account has been created successfully.</p>
          <p>You can now start sending and receiving money securely.</p>
        `,
      },
      {
        name: 'kyc_approved',
        subject: 'KYC Verification Approved',
        title: 'KYC Approved',
        text: 'Your KYC verification has been approved. You can now use all PayPass features.',
        html: `
          <h2>KYC Verification Approved</h2>
          <p>Congratulations! Your KYC verification has been approved.</p>
          <p>You can now use all PayPass features including cross-border payments.</p>
        `,
      },
      {
        name: 'kyc_rejected',
        subject: 'KYC Verification Rejected',
        title: 'KYC Rejected',
        text: 'Your KYC verification has been rejected. Please review and resubmit.',
        html: `
          <h2>KYC Verification Rejected</h2>
          <p>Your KYC verification has been rejected.</p>
          <p>Reason: {{reason}}</p>
          <p>Please review your documents and resubmit for verification.</p>
        `,
      },
    ];
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.queue.cleanup();
    await this.emailService.cleanup();
    await this.smsService.cleanup();
    await this.pushService.cleanup();
  }
}