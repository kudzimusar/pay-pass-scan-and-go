/**
 * WhatsApp Webhook Integration Tests
 * Tests for WhatsApp webhook processing and payment flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../app/api/whatsapp/webhook/route';

// Mock the WhatsApp service
vi.mock('../../app/api/_lib/whatsapp-service', () => ({
  default: class MockWhatsAppService {
    verifyWebhook = vi.fn();
    processWebhook = vi.fn();
  },
}));

describe('WhatsApp Webhook Integration', () => {
  beforeEach(() => {
    // Setup environment variables
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/whatsapp/webhook - Webhook Verification', () => {
    it('should verify webhook with correct parameters', async () => {
      const url = new URL('http://localhost:3000/api/whatsapp/webhook');
      url.searchParams.set('hub.mode', 'subscribe');
      url.searchParams.set('hub.verify_token', 'test_verify_token');
      url.searchParams.set('hub.challenge', 'test_challenge');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(200);
      const responseText = await response.text();
      expect(responseText).toBe('test_challenge');
    });

    it('should reject webhook verification with wrong token', async () => {
      const url = new URL('http://localhost:3000/api/whatsapp/webhook');
      url.searchParams.set('hub.mode', 'subscribe');
      url.searchParams.set('hub.verify_token', 'wrong_token');
      url.searchParams.set('hub.challenge', 'test_challenge');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(403);
      const responseText = await response.text();
      expect(responseText).toBe('Forbidden');
    });

    it('should reject webhook verification with wrong mode', async () => {
      const url = new URL('http://localhost:3000/api/whatsapp/webhook');
      url.searchParams.set('hub.mode', 'unsubscribe');
      url.searchParams.set('hub.verify_token', 'test_verify_token');
      url.searchParams.set('hub.challenge', 'test_challenge');

      const request = new NextRequest(url);
      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/whatsapp/webhook - Webhook Processing', () => {
    it('should process valid webhook payload', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: 'PHONE_NUMBER',
                phone_number_id: 'PHONE_NUMBER_ID',
              },
              messages: [{
                from: '+1234567890',
                id: 'wamid.ID',
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

      const { default: WhatsAppService } = await import('../../app/api/_lib/whatsapp-service');
      const mockService = new WhatsAppService();
      vi.mocked(mockService.verifyWebhook).mockReturnValue(true);
      vi.mocked(mockService.processWebhook).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=test_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const responseText = await response.text();
      expect(responseText).toBe('OK');
    });

    it('should handle malformed webhook payload gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);

      // Should still return 200 to prevent WhatsApp retries
      expect(response.status).toBe(200);
    });

    it('should reject requests with invalid signature', async () => {
      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const { default: WhatsAppService } = await import('../../app/api/_lib/whatsapp-service');
      const mockService = new WhatsAppService();
      vi.mocked(mockService.verifyWebhook).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=invalid_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const responseText = await response.text();
      expect(responseText).toBe('Unauthorized');
    });
  });

  describe('Webhook Processing Flow', () => {
    it('should process incoming text message and respond appropriately', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '+1234567890',
                id: 'test_message_id',
                text: { body: 'help' },
                type: 'text',
              }],
            },
          }],
        }],
      };

      const { default: WhatsAppService } = await import('../../app/api/_lib/whatsapp-service');
      const mockService = new WhatsAppService();
      
      let processedWebhook: any;
      vi.mocked(mockService.processWebhook).mockImplementation(async (webhookData) => {
        processedWebhook = webhookData;
      });
      vi.mocked(mockService.verifyWebhook).mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhook),
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=valid_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.processWebhook).toHaveBeenCalledWith(webhook);
    });

    it('should process button reply interactions', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{
          changes: [{
            value: {
              messages: [{
                from: '+1234567890',
                id: 'test_message_id',
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
          }],
        }],
      };

      const { default: WhatsAppService } = await import('../../app/api/_lib/whatsapp-service');
      const mockService = new WhatsAppService();
      vi.mocked(mockService.verifyWebhook).mockReturnValue(true);
      vi.mocked(mockService.processWebhook).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhook),
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=valid_signature',
        },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockService.processWebhook).toHaveBeenCalledWith(webhook);
    });
  });

  describe('Error Handling', () => {
    it('should handle webhook processing errors gracefully', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [{ changes: [{ value: { messages: [] } }] }],
      };

      const { default: WhatsAppService } = await import('../../app/api/_lib/whatsapp-service');
      const mockService = new WhatsAppService();
      vi.mocked(mockService.verifyWebhook).mockReturnValue(true);
      vi.mocked(mockService.processWebhook).mockRejectedValue(new Error('Processing error'));

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhook),
        headers: {
          'Content-Type': 'application/json',
          'x-hub-signature-256': 'sha256=valid_signature',
        },
      });

      const response = await POST(request);

      // Should still return 200 to prevent retries
      expect(response.status).toBe(200);
    });

    it('should handle missing signature header', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const request = new NextRequest('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        body: JSON.stringify(webhook),
        headers: {
          'Content-Type': 'application/json',
          // No signature header
        },
      });

      const response = await POST(request);

      // Should process normally when no signature is provided (for testing)
      expect(response.status).toBe(200);
    });
  });
});
