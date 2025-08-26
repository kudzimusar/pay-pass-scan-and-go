/**
 * WhatsApp Service Integration
 * Core service for handling WhatsApp Business API integration with PayPass
 * Supports payment requests, notifications, and conversational commerce
 */

import { storage } from "./storage";
import { 
  whatsappContacts, 
  whatsappConversations, 
  whatsappMessages, 
  whatsappPaymentSessions,
  whatsappTemplates,
  users,
  friendNetworks,
  crossBorderPayments,
  InsertWhatsappContact,
  InsertWhatsappConversation,
  InsertWhatsappMessage,
  InsertWhatsappPaymentSession,
  WhatsappContact,
  WhatsappConversation,
  WhatsappPaymentSession
} from "../../../shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { NotificationService } from "./notification-service";

// WhatsApp API Configuration
interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  apiVersion: string;
  webhookVerifyToken: string;
  baseUrl: string;
}

// WhatsApp Message Types
interface TextMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "text";
  text: {
    body: string;
  };
}

interface InteractiveMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "interactive";
  interactive: {
    type: "button";
    header?: {
      type: "text";
      text: string;
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
    };
  };
}

interface TemplateMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: "header" | "body" | "footer" | "button";
      parameters?: Array<{
        type: "text" | "currency" | "date_time";
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
      }>;
      sub_type?: "url" | "quick_reply";
      index?: number;
    }>;
  };
}

type WhatsAppMessage = TextMessage | InteractiveMessage | TemplateMessage;

interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: any;
}

// Payment Request Interface
interface PaymentRequestData {
  to: string;
  amount: number;
  currency: string;
  senderName: string;
  message?: string;
  dueDate?: string;
  paymentLink?: string;
}

// Webhook payload interfaces
interface WhatsAppWebhook {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    this.config = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      baseUrl: process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com'
    };
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const url = `${this.config.baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[WhatsApp Service] API Error:', result);
        return {
          success: false,
          error: result.error?.message || 'Failed to send message',
        };
      }

      return {
        success: true,
        messageId: result.messages?.[0]?.id,
        data: result,
      };
    } catch (error) {
      console.error('[WhatsApp Service] Network Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Send a payment request via WhatsApp
   */
  async sendPaymentRequest(request: PaymentRequestData): Promise<WhatsAppResponse> {
    try {
      // Create or get conversation
      const conversation = await this.getOrCreateConversation(request.to);
      
      // Create payment session
      const sessionData: InsertWhatsappPaymentSession = {
        conversationId: conversation.id,
        paymentIntent: JSON.stringify({
          amount: request.amount,
          currency: request.currency,
          senderName: request.senderName,
          message: request.message,
        }),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      const [session] = await db.insert(whatsappPaymentSessions)
        .values(sessionData)
        .returning();

      // Build interactive message
      const interactiveMessage: InteractiveMessage = {
        messaging_product: "whatsapp",
        to: request.to,
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "text",
            text: `💰 Payment Request from ${request.senderName}`,
          },
          body: {
            text: `${request.senderName} is requesting you to pay ${request.amount} ${request.currency}.\n\n${request.message || 'No message provided'}`,
          },
          footer: {
            text: "Powered by PayPass",
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: `pay_now_${session.id}`,
                  title: "Pay Now",
                },
              },
              {
                type: "reply",
                reply: {
                  id: `view_details_${session.id}`,
                  title: "View Details",
                },
              },
              {
                type: "reply",
                reply: {
                  id: `decline_${session.id}`,
                  title: "Decline",
                },
              },
            ],
          },
        },
      };

      const result = await this.sendMessage(interactiveMessage);

      // Store message if sent successfully
      if (result.success && result.messageId) {
        await this.storeMessage({
          conversationId: conversation.id,
          messageId: result.messageId,
          direction: 'outbound',
          messageType: 'interactive',
          content: JSON.stringify(interactiveMessage),
        });
      }

      return result;
    } catch (error) {
      console.error('[WhatsApp Service] Payment Request Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send payment request',
      };
    }
  }

  /**
   * Send a payment confirmation message
   */
  async sendPaymentConfirmation(data: {
    to: string;
    transactionId: string;
    amount: number;
    currency: string;
    recipientName: string;
  }): Promise<WhatsAppResponse> {
    const message: TextMessage = {
      messaging_product: "whatsapp",
      to: data.to,
      type: "text",
      text: {
        body: `✅ *Payment Successful!*\n\nYou have successfully sent ${data.amount} ${data.currency} to ${data.recipientName}.\n\nTransaction ID: ${data.transactionId}\n\nThank you for using PayPass!`,
      },
    };

    const result = await this.sendMessage(message);

    // Store message if sent successfully
    if (result.success && result.messageId) {
      const conversation = await this.getOrCreateConversation(data.to);
      await this.storeMessage({
        conversationId: conversation.id,
        messageId: result.messageId,
        direction: 'outbound',
        messageType: 'text',
        content: JSON.stringify(message),
      });
    }

    return result;
  }

  /**
   * Handle incoming WhatsApp webhook
   */
  async processWebhook(webhook: WhatsAppWebhook): Promise<void> {
    try {
      for (const entry of webhook.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              await this.processIncomingMessage({
                from: message.from,
                messageId: message.id,
                timestamp: message.timestamp,
                type: message.type,
                text: message.text,
                interactive: message.interactive,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[WhatsApp Service] Webhook Processing Error:', error);
      throw error;
    }
  }

  /**
   * Process incoming message from user
   */
  private async processIncomingMessage(message: {
    from: string;
    messageId: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    interactive?: any;
  }): Promise<void> {
    try {
      // Get or create conversation
      const conversation = await this.getOrCreateConversation(message.from);

      // Store incoming message
      await this.storeMessage({
        conversationId: conversation.id,
        messageId: message.messageId,
        direction: 'inbound',
        messageType: message.type,
        content: JSON.stringify(message),
      });

      // Process based on message type
      if (message.type === 'interactive' && message.interactive?.button_reply) {
        await this.handleButtonReply(conversation, message.interactive.button_reply);
      } else if (message.type === 'text' && message.text?.body) {
        await this.handleTextMessage(conversation, message.text.body);
      }
    } catch (error) {
      console.error('[WhatsApp Service] Message Processing Error:', error);
    }
  }

  /**
   * Handle button reply interactions
   */
  private async handleButtonReply(conversation: WhatsappConversation, buttonReply: { id: string; title: string }): Promise<void> {
    const buttonId = buttonReply.id;

    if (buttonId.startsWith('pay_now_')) {
      const sessionId = buttonId.replace('pay_now_', '');
      await this.handlePaymentAction(conversation, sessionId, 'pay');
    } else if (buttonId.startsWith('view_details_')) {
      const sessionId = buttonId.replace('view_details_', '');
      await this.handlePaymentAction(conversation, sessionId, 'details');
    } else if (buttonId.startsWith('decline_')) {
      const sessionId = buttonId.replace('decline_', '');
      await this.handlePaymentAction(conversation, sessionId, 'decline');
    }
  }

  /**
   * Handle payment-related actions
   */
  private async handlePaymentAction(conversation: WhatsappConversation, sessionId: string, action: 'pay' | 'details' | 'decline'): Promise<void> {
    try {
      // Get payment session
      const [session] = await db.select()
        .from(whatsappPaymentSessions)
        .where(eq(whatsappPaymentSessions.id, sessionId))
        .limit(1);

      if (!session) {
        await this.sendErrorMessage(conversation.whatsappNumber, 'Payment session not found or expired.');
        return;
      }

      const paymentIntent = JSON.parse(session.paymentIntent);

      switch (action) {
        case 'pay':
          // Generate payment link and send
          const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/payment/${sessionId}`;
          await this.sendMessage({
            messaging_product: "whatsapp",
            to: conversation.whatsappNumber,
            type: "text",
            text: {
              body: `🔗 *Complete your payment*\n\nClick the link below to securely complete your payment of ${paymentIntent.amount} ${paymentIntent.currency}:\n\n${paymentLink}\n\n⏰ This link expires in 24 hours.`,
            },
          });
          break;

        case 'details':
          await this.sendMessage({
            messaging_product: "whatsapp",
            to: conversation.whatsappNumber,
            type: "text",
            text: {
              body: `📋 *Payment Details*\n\n💰 Amount: ${paymentIntent.amount} ${paymentIntent.currency}\n👤 From: ${paymentIntent.senderName}\n💬 Message: ${paymentIntent.message || 'No message'}\n\nUse "Pay Now" to proceed with payment.`,
            },
          });
          break;

        case 'decline':
          // Update session status
          await db.update(whatsappPaymentSessions)
            .set({ sessionStatus: 'cancelled' })
            .where(eq(whatsappPaymentSessions.id, sessionId));

          await this.sendMessage({
            messaging_product: "whatsapp",
            to: conversation.whatsappNumber,
            type: "text",
            text: {
              body: `❌ Payment request declined.\n\nYou have declined the payment request from ${paymentIntent.senderName}.`,
            },
          });
          break;
      }
    } catch (error) {
      console.error('[WhatsApp Service] Payment Action Error:', error);
      await this.sendErrorMessage(conversation.whatsappNumber, 'An error occurred processing your request.');
    }
  }

  /**
   * Handle simple text messages (basic bot functionality)
   */
  private async handleTextMessage(conversation: WhatsappConversation, text: string): Promise<void> {
    const lowerText = text.toLowerCase().trim();

    // Simple bot responses
    if (lowerText === 'help' || lowerText === 'menu') {
      await this.sendMessage({
        messaging_product: "whatsapp",
        to: conversation.whatsappNumber,
        type: "text",
        text: {
          body: `🤖 *PayPass Help*\n\nHere's what you can do:\n\n💰 Receive payment requests\n💳 Complete payments securely\n📊 Check payment status\n\nNeed more help? Visit our website or contact support.`,
        },
      });
    } else if (lowerText.includes('balance')) {
      // Simple balance check response
      await this.sendMessage({
        messaging_product: "whatsapp",
        to: conversation.whatsappNumber,
        type: "text",
        text: {
          body: `💳 To check your balance, please visit the PayPass app or website.\n\nDownload: ${process.env.NEXT_PUBLIC_APP_URL}`,
        },
      });
    } else {
      // Default response
      await this.sendMessage({
        messaging_product: "whatsapp",
        to: conversation.whatsappNumber,
        type: "text",
        text: {
          body: `Thanks for your message! 👋\n\nFor full PayPass features, please use our app or type "help" for assistance.`,
        },
      });
    }
  }

  /**
   * Send error message
   */
  private async sendErrorMessage(to: string, errorMessage: string): Promise<void> {
    await this.sendMessage({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: `❌ ${errorMessage}\n\nIf you need assistance, please contact our support team.`,
      },
    });
  }

  /**
   * Get or create WhatsApp conversation
   */
  private async getOrCreateConversation(whatsappNumber: string, userId?: string): Promise<WhatsappConversation> {
    // Try to find existing conversation
    const [existing] = await db.select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.whatsappNumber, whatsappNumber))
      .limit(1);

    if (existing) {
      // Update last message time
      await db.update(whatsappConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(whatsappConversations.id, existing.id));
      return existing;
    }

    // Create new conversation
    const conversationData: InsertWhatsappConversation = {
      userId: userId || 'unknown', // Will be linked later when user is identified
      whatsappNumber,
      conversationType: 'individual',
      status: 'active',
    };

    const [newConversation] = await db.insert(whatsappConversations)
      .values(conversationData)
      .returning();

    return newConversation;
  }

  /**
   * Store message in database
   */
  private async storeMessage(data: InsertWhatsappMessage): Promise<void> {
    try {
      await db.insert(whatsappMessages).values(data);
    } catch (error) {
      console.error('[WhatsApp Service] Store Message Error:', error);
    }
  }

  /**
   * Sync WhatsApp contacts for a user
   */
  async syncUserContacts(userId: string, whatsappContacts: Array<{ number: string; name: string }>): Promise<void> {
    try {
      for (const contact of whatsappContacts) {
        const contactData: InsertWhatsappContact = {
          userId,
          whatsappNumber: contact.number,
          displayName: contact.name,
          isVerified: false,
          trustScore: "0.50", // Default trust score
        };

        // Insert or update contact
        await db.insert(whatsappContacts)
          .values(contactData)
          .onConflictDoUpdate({
            target: [whatsappContacts.userId, whatsappContacts.whatsappNumber],
            set: {
              displayName: contact.name,
              updatedAt: new Date(),
            },
          });
      }
    } catch (error) {
      console.error('[WhatsApp Service] Sync Contacts Error:', error);
      throw error;
    }
  }

  /**
   * Get user's WhatsApp contacts
   */
  async getUserContacts(userId: string): Promise<WhatsappContact[]> {
    return await db.select()
      .from(whatsappContacts)
      .where(eq(whatsappContacts.userId, userId));
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(signature: string, body: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookVerifyToken)
        .update(body)
        .digest('hex');

      return `sha256=${expectedSignature}` === signature;
    } catch (error) {
      console.error('[WhatsApp Service] Webhook Verification Error:', error);
      return false;
    }
  }

  /**
   * Integration with existing notification service
   */
  async sendNotificationViaWhatsApp(userId: string, notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
  }): Promise<boolean> {
    try {
      // Get user's WhatsApp number from their contacts or profile
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return false;
      }

      // Use phone number as WhatsApp number (assuming they're the same)
      const message: TextMessage = {
        messaging_product: "whatsapp",
        to: user.phone,
        type: "text",
        text: {
          body: `📢 *${notification.title}*\n\n${notification.message}`,
        },
      };

      const result = await this.sendMessage(message);
      return result.success;
    } catch (error) {
      console.error('[WhatsApp Service] Notification Error:', error);
      return false;
    }
  }
}

export default WhatsAppService;
