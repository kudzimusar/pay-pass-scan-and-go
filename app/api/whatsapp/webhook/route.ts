/**
 * WhatsApp Webhook Endpoint
 * Handles incoming webhooks from WhatsApp Business API
 * Supports webhook verification and message processing
 */

import { NextRequest, NextResponse } from 'next/server';
import WhatsAppService from '../../_lib/whatsapp-service';

const whatsappService = new WhatsAppService();

/**
 * GET - Webhook verification
 * WhatsApp requires webhook verification before sending events
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Log verification attempt
    console.log('[WhatsApp Webhook] Verification attempt:', { mode, token: token ? '***' : null });

    // Verify the webhook
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log('[WhatsApp Webhook] Verification successful');
      return new NextResponse(challenge);
    }

    console.warn('[WhatsApp Webhook] Verification failed - invalid token or mode');
    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Verification error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST - Process incoming webhook events
 * Handles messages, delivery receipts, and other webhook events
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get request body
    const body = await request.text();
    
    // Verify webhook signature for security
    const signature = request.headers.get('x-hub-signature-256');
    if (signature && !whatsappService.verifyWebhook(signature, body)) {
      console.warn('[WhatsApp Webhook] Invalid signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse webhook payload
    const webhook = JSON.parse(body);
    
    // Log incoming webhook (be careful not to log sensitive data)
    console.log('[WhatsApp Webhook] Received webhook:', {
      object: webhook.object,
      entries: webhook.entry?.length || 0,
    });

    // Process webhook
    if (webhook.object === 'whatsapp_business_account') {
      await whatsappService.processWebhook(webhook);
    }

    // WhatsApp expects a 200 response
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Processing error:', error);
    
    // Still return 200 to prevent WhatsApp from retrying
    // Log the error for debugging but don't fail the webhook
    return new NextResponse('OK', { status: 200 });
  }
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-hub-signature-256',
    },
  });
}
