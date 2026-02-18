/**
 * WhatsApp Service Unit Tests
 * Tests for WhatsApp Business API integration and payment functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WhatsAppService from '../../app/api/_lib/whatsapp-service';

// Mock fetch globally
global.fetch = vi.fn();

// Use vi.hoisted to allow access inside vi.mock
const { mockDb, createChainableMock } = vi.hoisted(() => {
  const createChainableMock = () => {
    const mock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
    };
    return mock;
  };

  const mockDb = {
    select: vi.fn(() => createChainableMock()),
    insert: vi.fn(() => createChainableMock()),
    update: vi.fn(() => createChainableMock()),
    delete: vi.fn(() => createChainableMock()),
  };

  return { mockDb, createChainableMock };
});

// Mock database
vi.mock('../../app/api/_lib/drizzle', () => ({
  db: mockDb,
}));

describe('WhatsAppService', () => {
  let whatsappService: WhatsAppService;
  
  beforeEach(() => {
    // Setup environment variables
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';
    process.env.WHATSAPP_API_VERSION = 'v18.0';
    process.env.WHATSAPP_BASE_URL = 'https://graph.facebook.com';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    
    whatsappService = new WhatsAppService();

    // Reset mocks
    vi.clearAllMocks();

    // Reset mockDb implementations to default chainable
    mockDb.select.mockImplementation(() => createChainableMock());
    mockDb.insert.mockImplementation(() => createChainableMock());
    mockDb.update.mockImplementation(() => createChainableMock());
    mockDb.delete.mockImplementation(() => createChainableMock());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send a text message successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          messages: [{ id: 'test_message_id' }],
        }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const message = {
        messaging_product: 'whatsapp' as const,
        to: '+1234567890',
        type: 'text' as const,
        text: {
          body: 'Hello, this is a test message!',
        },
      };

      const result = await whatsappService.sendMessage(message);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test_message_id');
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test_phone_id/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test_token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid phone number' },
        }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const message = {
        messaging_product: 'whatsapp' as const,
        to: 'invalid_number',
        type: 'text' as const,
        text: {
          body: 'Test message',
        },
      };

      const result = await whatsappService.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const message = {
        messaging_product: 'whatsapp' as const,
        to: '+1234567890',
        type: 'text' as const,
        text: {
          body: 'Test message',
        },
      };

      const result = await whatsappService.sendMessage(message);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('sendPaymentRequest', () => {
    it('should send a payment request with interactive buttons', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          messages: [{ id: 'payment_request_id' }],
        }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      // Mock DB for getOrCreateConversation (select existing)
      const selectChain = createChainableMock();
      selectChain.limit.mockResolvedValue([{
        id: 'conversation_id',
        whatsappNumber: '+1234567890',
      }]);
      mockDb.select.mockReturnValueOnce(selectChain);

      // Mock DB for update conversation
      const updateChain = createChainableMock();
      mockDb.update.mockReturnValueOnce(updateChain);

      // Mock DB for payment session insert
      const insertChain = createChainableMock();
      insertChain.returning.mockResolvedValue([{
        id: 'session_id',
        paymentIntent: '{"amount":50,"currency":"USD"}',
      }]);
      mockDb.insert.mockReturnValueOnce(insertChain); // session insert

      // Mock DB for storing message (fire and forget)
      mockDb.insert.mockReturnValueOnce(createChainableMock());

      const paymentRequest = {
        to: '+1234567890',
        amount: 50,
        currency: 'USD',
        senderName: 'John Doe',
        message: 'Payment for dinner',
      };

      const result = await whatsappService.sendPaymentRequest(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('payment_request_id');
    });
  });

  describe('verifyWebhook', () => {
    it('should verify valid webhook signature', () => {
      const body = '{"test":"data"}';
      // Calculate expected signature dynamically to ensure match
      const crypto = require('crypto');
      const expectedHash = crypto
        .createHmac('sha256', 'test_verify_token')
        .update(body)
        .digest('hex');
      const validSignature = `sha256=${expectedHash}`;
      
      const isValid = whatsappService.verifyWebhook(validSignature, body);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const body = '{"test":"data"}';
      const invalidSignature = 'sha256=invalid_signature';
      const isValid = whatsappService.verifyWebhook(invalidSignature, body);
      expect(isValid).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('should process incoming text message webhook', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_id',
              },
              messages: [{
                from: '+0987654321',
                id: 'message_id',
                timestamp: '1640995200',
                text: {
                  body: 'help',
                },
                type: 'text',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      // Mock DB for getOrCreateConversation (new conversation)
      const selectChain = createChainableMock();
      selectChain.limit.mockResolvedValue([]); // No existing conversation
      mockDb.select.mockReturnValueOnce(selectChain);

      const insertConvChain = createChainableMock();
      insertConvChain.returning.mockResolvedValue([{
        id: 'conversation_id',
        whatsappNumber: '+0987654321',
      }]);
      mockDb.insert.mockReturnValueOnce(insertConvChain); // create conversation

      // Mock DB for storing incoming message
      mockDb.insert.mockReturnValueOnce(createChainableMock());

      // Mock sendMessage
      const sendMessageSpy = vi.spyOn(whatsappService, 'sendMessage').mockResolvedValue({
        success: true,
        messageId: 'response_message_id',
      });

      await whatsappService.processWebhook(webhook);

      // Verify that a help response was sent
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+0987654321',
          type: 'text',
          text: expect.objectContaining({
            body: expect.stringContaining('PayPass Help'),
          }),
        })
      );
    });

    it('should handle button interactions', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'entry_id',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test_phone_id',
              },
              messages: [{
                from: '+0987654321',
                id: 'message_id',
                timestamp: '1640995200',
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: 'pay_now_session_123',
                    title: 'Pay Now',
                  },
                },
                type: 'interactive',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      // Mock DB for getOrCreateConversation
      const selectChain = createChainableMock();
      selectChain.limit.mockResolvedValue([{
        id: 'conversation_id',
        whatsappNumber: '+0987654321',
      }]);
      mockDb.select.mockReturnValueOnce(selectChain);

      // Mock DB update conversation
      mockDb.update.mockReturnValueOnce(createChainableMock());

      // Mock DB store incoming message
      mockDb.insert.mockReturnValueOnce(createChainableMock());

      // Mock DB select payment session
      const selectSessionChain = createChainableMock();
      selectSessionChain.limit.mockResolvedValue([{
        id: 'session_123',
        paymentIntent: '{"amount":50,"currency":"USD","senderName":"John"}',
      }]);
      mockDb.select.mockReturnValueOnce(selectSessionChain);

      // Mock sendMessage
      const sendMessageSpy = vi.spyOn(whatsappService, 'sendMessage').mockResolvedValue({
        success: true,
        messageId: 'response_message_id',
      });

      await whatsappService.processWebhook(webhook);

      // Verify that a payment link was sent
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+0987654321',
          type: 'text',
          text: expect.objectContaining({
            body: expect.stringContaining('Complete your payment'),
          }),
        })
      );
    });
  });

  describe('sendNotificationViaWhatsApp', () => {
    it('should send notification to user via WhatsApp', async () => {
      // Mock database user lookup
      const selectChain = createChainableMock();
      selectChain.limit.mockResolvedValue([{
        id: 'user_123',
        phone: '+1234567890',
        fullName: 'John Doe',
      }]);
      mockDb.select.mockReturnValueOnce(selectChain);

      // Mock sendMessage
      const sendMessageSpy = vi.spyOn(whatsappService, 'sendMessage').mockResolvedValue({
        success: true,
        messageId: 'notification_message_id',
      });

      const notification = {
        title: 'Payment Received',
        message: 'You received $50 from Jane Doe',
        type: 'payment',
      };

      const result = await whatsappService.sendNotificationViaWhatsApp('user_123', notification);

      expect(result).toBe(true);
      expect(sendMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+1234567890',
          type: 'text',
          text: expect.objectContaining({
            body: expect.stringContaining('Payment Received'),
          }),
        })
      );
    });

    it('should return false for non-existent user', async () => {
      // Mock database user lookup returning no user
      const selectChain = createChainableMock();
      selectChain.limit.mockResolvedValue([]);
      mockDb.select.mockReturnValueOnce(selectChain);

      const notification = {
        title: 'Test',
        message: 'Test message',
        type: 'test',
      };

      const result = await whatsappService.sendNotificationViaWhatsApp('non_existent_user', notification);

      expect(result).toBe(false);
    });
  });
});
