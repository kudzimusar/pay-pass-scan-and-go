/**
 * Event Bus Implementation for Microservices Communication
 * 
 * Provides a centralized event system for inter-service communication
 * using Redis Streams for reliable message delivery and persistence.
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface EventMetadata {
  eventId: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
  causationId?: string;
  version: string;
}

export interface Event<T = unknown> {
  eventId: string;
  eventType: string;
  data: T;
  metadata: EventMetadata;
}

export interface EventHandler<T = unknown> {
  (event: Event<T>): Promise<void>;
}

export interface EventSubscription {
  unsubscribe: () => void;
}

export class EventBus {
  private redis: Redis;
  private handlers: Map<string, EventHandler[]> = new Map();
  private subscriptions: Map<string, string[]> = new Map();
  private serviceName: string;

  constructor(redisUrl: string, serviceName: string) {
    this.redis = new Redis(redisUrl);
    this.serviceName = serviceName;
  }

  /**
   * Publish an event to the event bus
   */
  async publish<T>(eventType: string, data: T, metadata?: Partial<EventMetadata>): Promise<void> {
    const event: Event<T> = {
      eventId: uuidv4(),
      eventType,
      data,
      metadata: {
        eventId: uuidv4(),
        timestamp: new Date(),
        source: this.serviceName,
        version: '1.0.0',
        ...metadata,
      },
    };

    // Store event in Redis Stream for persistence
    await this.redis.xadd(
      'events',
      '*',
      'eventId', event.eventId,
      'eventType', event.eventType,
      'data', JSON.stringify(event.data),
      'metadata', JSON.stringify(event.metadata)
    );

    // Publish to Redis pub/sub for real-time delivery
    await this.redis.publish('event-bus', JSON.stringify(event));

    console.log(`[EventBus] Published event: ${eventType} (${event.eventId})`);
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe<T>(eventType: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);

    // Subscribe to Redis pub/sub channel
    this.redis.subscribe('event-bus');

    const subscription: EventSubscription = {
      unsubscribe: () => {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      },
    };

    console.log(`[EventBus] Subscribed to event: ${eventType}`);
    return subscription;
  }

  /**
   * Handle incoming events from Redis pub/sub
   */
  private async handleIncomingEvent(eventData: string): Promise<void> {
    try {
      const event: Event = JSON.parse(eventData);
      const handlers = this.handlers.get(event.eventType);

      if (handlers) {
        await Promise.all(
          handlers.map(handler => 
            handler(event).catch(error => {
              console.error(`[EventBus] Error handling event ${event.eventType}:`, error);
            })
          )
        );
      }
    } catch (error) {
      console.error('[EventBus] Error parsing event:', error);
    }
  }

  /**
   * Start listening for events
   */
  async start(): Promise<void> {
    this.redis.on('message', (channel, message) => {
      if (channel === 'event-bus') {
        this.handleIncomingEvent(message);
      }
    });

    console.log(`[EventBus] Started listening for events (${this.serviceName})`);
  }

  /**
   * Stop the event bus
   */
  async stop(): Promise<void> {
    await this.redis.quit();
    console.log(`[EventBus] Stopped (${this.serviceName})`);
  }

  /**
   * Get events from the stream (for replay/recovery)
   */
  async getEvents(count: number = 100): Promise<Event[]> {
    const events = await this.redis.xread(
      'COUNT', count,
      'STREAMS', 'events', '0'
    );

    if (!events || events.length === 0) {
      return [];
    }

    return events[0][1].map(([id, fields]) => {
      const eventId = fields[1];
      const eventType = fields[3];
      const data = JSON.parse(fields[5]);
      const metadata = JSON.parse(fields[7]);

      return {
        eventId,
        eventType,
        data,
        metadata,
      };
    });
  }
}

// Event types for PayPass platform
export const EventTypes = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DEACTIVATED: 'user.deactivated',
  USER_VERIFIED: 'user.verified',

  // Payment events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CANCELLED: 'payment.cancelled',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Cross-border payment events
  CROSS_BORDER_PAYMENT_INITIATED: 'cross-border-payment.initiated',
  CROSS_BORDER_PAYMENT_COMPLETED: 'cross-border-payment.completed',
  CROSS_BORDER_PAYMENT_FAILED: 'cross-border-payment.failed',

  // Wallet events
  WALLET_CREATED: 'wallet.created',
  BALANCE_UPDATED: 'balance.updated',
  FUNDS_RESERVED: 'funds.reserved',
  FUNDS_RELEASED: 'funds.released',

  // Fraud detection events
  FRAUD_DETECTED: 'fraud.detected',
  RISK_ASSESSED: 'risk.assessed',
  TRANSACTION_BLOCKED: 'transaction.blocked',

  // Notification events
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_DELIVERED: 'notification.delivered',
  NOTIFICATION_FAILED: 'notification.failed',

  // Analytics events
  METRICS_COLLECTED: 'metrics.collected',
  REPORT_GENERATED: 'report.generated',

  // Compliance events
  KYC_SUBMITTED: 'kyc.submitted',
  KYC_APPROVED: 'kyc.approved',
  KYC_REJECTED: 'kyc.rejected',
  AML_SCREENING_COMPLETED: 'aml.screening.completed',
} as const;

// Event data interfaces
export interface UserCreatedEvent {
  userId: string;
  phoneNumber: string;
  userType: string;
  createdAt: Date;
}

export interface PaymentCompletedEvent {
  paymentId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  completedAt: Date;
}

export interface CrossBorderPaymentCompletedEvent {
  paymentId: string;
  senderId: string;
  recipientId: string;
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  fees: number;
  completedAt: Date;
}

export interface FraudDetectedEvent {
  transactionId: string;
  userId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  detectedAt: Date;
}

// Singleton instance for the application
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const serviceName = process.env.SERVICE_NAME || 'paypass-api';
    eventBusInstance = new EventBus(redisUrl, serviceName);
  }
  return eventBusInstance;
}

export function initializeEventBus(): Promise<void> {
  const eventBus = getEventBus();
  return eventBus.start();
}