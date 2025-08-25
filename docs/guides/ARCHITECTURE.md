# Architecture Guidelines 🏗️

## Table of Contents
- [System Overview](#system-overview)
- [Microservices Architecture](#microservices-architecture)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Security Architecture](#security-architecture)
- [Scalability Patterns](#scalability-patterns)
- [Integration Patterns](#integration-patterns)
- [Deployment Architecture](#deployment-architecture)

## System Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Admin Panel   │
│   (Vite/React)  │    │   (React Native)│    │   (Next.js)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     API Gateway         │
                    │   (Next.js/Cloudflare) │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
   ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
   │   Auth Service  │  │ Payment Service │  │  User Service   │
   │                 │  │                 │  │                 │
   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Data Layer          │
                    │  (Neon PostgreSQL)      │
                    └─────────────────────────┘
```

### Current State: Monolithic Foundation
**Phase 1**: Single Next.js application with clear service boundaries
- API routes organized by domain
- Shared database with proper schemas
- Clear separation of concerns
- Foundation for microservices migration

### Target State: Microservices Architecture
**Phase 3**: Distributed system with independent services
- Language-agnostic services (Node.js, Java Spring Boot)
- Independent databases per service
- Event-driven communication
- Cloud-native deployment

## Microservices Architecture

### Service Decomposition Strategy

#### 1. Authentication & Authorization Service
```typescript
// Domain Boundary: User identity and access control
interface AuthService {
  // User authentication
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  logout(userId: string): Promise<void>;
  
  // Multi-factor authentication
  enableMFA(userId: string, method: MFAMethod): Promise<MFASetup>;
  verifyMFA(userId: string, token: string): Promise<boolean>;
  
  // Authorization
  authorize(userId: string, resource: string, action: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<Permission[]>;
}

// Technology Stack:
// - Language: Node.js/TypeScript (current) → Java Spring Boot (future)
// - Database: Dedicated auth schema
// - Cache: Redis for session management
// - External: OAuth providers, MFA services
```

#### 2. Payment Processing Service
```typescript
// Domain Boundary: Payment transactions and processing
interface PaymentService {
  // Core payment operations
  processPayment(request: PaymentRequest): Promise<Payment>;
  cancelPayment(paymentId: string): Promise<void>;
  refundPayment(paymentId: string, amount?: number): Promise<Refund>;
  
  // Cross-border payments (USP)
  processCrossBorderPayment(request: CrossBorderRequest): Promise<Payment>;
  getExchangeRate(from: Currency, to: Currency): Promise<ExchangeRate>;
  
  // Payment status
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  trackPayment(paymentId: string): Promise<PaymentTrack>;
}

// Technology Stack:
// - Language: Java Spring Boot (high reliability required)
// - Database: Dedicated payment schema with ACID compliance
// - Queue: Message queues for async processing
// - External: Payment gateways, banks, mobile money providers
```

#### 3. User Management Service
```typescript
// Domain Boundary: User profiles and relationships
interface UserService {
  // User lifecycle
  createUser(userData: CreateUserRequest): Promise<User>;
  updateUser(userId: string, updates: UpdateUserRequest): Promise<User>;
  deactivateUser(userId: string): Promise<void>;
  
  // Friend/family network (USP feature)
  addFriend(userId: string, friendId: string): Promise<Friendship>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  getFriends(userId: string): Promise<User[]>;
  
  // Profile management
  updateProfile(userId: string, profile: ProfileData): Promise<Profile>;
  uploadDocument(userId: string, document: Document): Promise<void>;
}

// Technology Stack:
// - Language: Node.js/TypeScript
// - Database: User profiles and relationships
// - Storage: File storage for documents
// - Search: User search and discovery
```

#### 4. Notification Service
```typescript
// Domain Boundary: Communication and notifications
interface NotificationService {
  // Multi-channel notifications
  sendSMS(phoneNumber: string, message: string): Promise<void>;
  sendEmail(email: string, template: EmailTemplate): Promise<void>;
  sendPushNotification(deviceId: string, notification: PushNotification): Promise<void>;
  
  // Real-time updates
  sendRealTimeUpdate(userId: string, update: RealtimeUpdate): Promise<void>;
  subscribeToUpdates(userId: string, channel: string): Promise<Subscription>;
  
  // Notification preferences
  updatePreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}

// Technology Stack:
// - Language: Node.js/TypeScript
// - Queue: Message queues for reliable delivery
// - External: SMS providers, email services, push notification services
// - WebSocket: Real-time communication
```

#### 5. Analytics & Reporting Service
```typescript
// Domain Boundary: Data analysis and business intelligence
interface AnalyticsService {
  // Transaction analytics
  getTransactionMetrics(filters: AnalyticsFilters): Promise<TransactionMetrics>;
  getUserAnalytics(userId: string): Promise<UserAnalytics>;
  getBusinessInsights(merchantId: string): Promise<BusinessInsights>;
  
  // Real-time monitoring
  getSystemHealth(): Promise<HealthMetrics>;
  getPerformanceMetrics(): Promise<PerformanceMetrics>;
  
  // Compliance reporting
  generateComplianceReport(type: ReportType, period: DateRange): Promise<Report>;
}

// Technology Stack:
// - Language: Python (data processing) or Java
// - Database: Data warehouse (PostgreSQL/BigQuery)
// - Queue: Event streams for real-time processing
// - Analytics: Data processing frameworks
```

### Service Communication Patterns

#### 1. Synchronous Communication (API Calls)
```typescript
// For immediate responses and consistency requirements
interface PaymentAPIClient {
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new PaymentError(`Payment failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Circuit breaker pattern for resilience
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

#### 2. Asynchronous Communication (Events)
```typescript
// Event-driven architecture for loose coupling
interface PaymentEvent {
  eventId: string;
  eventType: 'payment.created' | 'payment.completed' | 'payment.failed';
  timestamp: Date;
  data: PaymentEventData;
  metadata: EventMetadata;
}

class EventBus {
  async publish(event: PaymentEvent): Promise<void> {
    // Publish to message queue (Redis Streams, RabbitMQ, etc.)
    await this.messageQueue.publish('payment.events', event);
    
    // Store event for audit trail
    await this.eventStore.store(event);
  }
  
  async subscribe(
    eventType: string,
    handler: (event: PaymentEvent) => Promise<void>
  ): Promise<void> {
    await this.messageQueue.subscribe(eventType, handler);
  }
}

// Event handlers for cross-service communication
class NotificationEventHandler {
  async handlePaymentCompleted(event: PaymentEvent): Promise<void> {
    if (event.eventType === 'payment.completed') {
      await this.notificationService.sendSMS(
        event.data.recipientPhone,
        `Payment of ${event.data.amount} received from ${event.data.senderName}`
      );
    }
  }
}
```

#### 3. SAGA Pattern for Distributed Transactions
```typescript
// Orchestrator-based SAGA for cross-border payments
class CrossBorderPaymentSaga {
  async execute(request: CrossBorderPaymentRequest): Promise<void> {
    const sagaId = generateSagaId();
    
    try {
      // Step 1: Reserve funds from sender
      const reservation = await this.paymentService.reserveFunds({
        userId: request.senderId,
        amount: request.amount,
        sagaId,
      });
      
      // Step 2: Validate recipient
      const recipientValidation = await this.userService.validateRecipient({
        recipientId: request.recipientId,
        sagaId,
      });
      
      // Step 3: Convert currency
      const exchangeRate = await this.currencyService.convertCurrency({
        from: request.fromCurrency,
        to: request.toCurrency,
        amount: request.amount,
        sagaId,
      });
      
      // Step 4: Process international transfer
      const transfer = await this.transferService.processInternational({
        ...request,
        exchangeRate,
        sagaId,
      });
      
      // Step 5: Complete payment
      await this.paymentService.completePayment({
        reservationId: reservation.id,
        transferId: transfer.id,
        sagaId,
      });
      
    } catch (error) {
      // Compensating actions in reverse order
      await this.compensate(sagaId, error);
      throw error;
    }
  }
  
  private async compensate(sagaId: string, error: Error): Promise<void> {
    // Rollback completed steps
    const completedSteps = await this.getCompletedSteps(sagaId);
    
    for (const step of completedSteps.reverse()) {
      try {
        await this.executeCompensation(step);
      } catch (compensationError) {
        // Log compensation failure but continue
        console.error('Compensation failed:', compensationError);
      }
    }
  }
}
```

## Database Design

### Database Per Service Pattern
```sql
-- Authentication Service Database
CREATE SCHEMA auth;

CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth.mfa_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  method VARCHAR(20) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT[],
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment Service Database
CREATE SCHEMA payments;

CREATE TABLE payments.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments.cross_border_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES payments.transactions(id),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(15,6) NOT NULL,
  original_amount DECIMAL(15,2) NOT NULL,
  converted_amount DECIMAL(15,2) NOT NULL,
  fees DECIMAL(15,2) NOT NULL,
  compliance_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Service Database
CREATE SCHEMA users;

CREATE TABLE users.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL, -- References auth.users(id)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200),
  email VARCHAR(255),
  country_code VARCHAR(2),
  language VARCHAR(5) DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);
```

### Drizzle ORM Schema Design
```typescript
// schemas/auth.ts
import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  userType: varchar('user_type', { length: 20 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// schemas/payments.ts
import { pgTable, uuid, decimal, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id').notNull(),
  recipientId: uuid('recipient_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const crossBorderPayments = pgTable('cross_border_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').references(() => transactions.id),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
  toCurrency: varchar('to_currency', { length: 3 }).notNull(),
  exchangeRate: decimal('exchange_rate', { precision: 15, scale: 6 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 15, scale: 2 }).notNull(),
  convertedAmount: decimal('converted_amount', { precision: 15, scale: 2 }).notNull(),
  fees: decimal('fees', { precision: 15, scale: 2 }).notNull(),
  complianceData: jsonb('compliance_data'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Database Transaction Management
```typescript
// Transaction patterns for data consistency
class PaymentRepository {
  constructor(private db: DrizzleDB) {}
  
  async createPaymentWithSideEffects(
    paymentData: CreatePaymentRequest
  ): Promise<Payment> {
    return await this.db.transaction(async (tx) => {
      // 1. Create payment record
      const [payment] = await tx
        .insert(transactions)
        .values(paymentData)
        .returning();
      
      // 2. Update user balance
      await tx
        .update(userBalances)
        .set({ 
          balance: sql`balance - ${paymentData.amount}` 
        })
        .where(eq(userBalances.userId, paymentData.senderId));
      
      // 3. Create audit log
      await tx
        .insert(auditLogs)
        .values({
          action: 'payment_created',
          entityId: payment.id,
          userId: paymentData.senderId,
          metadata: { amount: paymentData.amount },
        });
      
      return payment;
    });
  }
  
  async processCrossBorderPayment(
    request: CrossBorderPaymentRequest
  ): Promise<CrossBorderPayment> {
    return await this.db.transaction(async (tx) => {
      // Distributed transaction coordination
      const sagaId = generateSagaId();
      
      try {
        // Step 1: Create main transaction
        const [transaction] = await tx
          .insert(transactions)
          .values({
            ...request,
            status: 'processing',
            metadata: { sagaId },
          })
          .returning();
        
        // Step 2: Create cross-border payment record
        const [crossBorderPayment] = await tx
          .insert(crossBorderPayments)
          .values({
            transactionId: transaction.id,
            fromCurrency: request.fromCurrency,
            toCurrency: request.toCurrency,
            exchangeRate: request.exchangeRate,
            originalAmount: request.amount,
            convertedAmount: request.convertedAmount,
            fees: request.fees,
            complianceData: request.complianceData,
          })
          .returning();
        
        // Step 3: Record SAGA state
        await tx
          .insert(sagaStates)
          .values({
            sagaId,
            type: 'cross_border_payment',
            status: 'in_progress',
            data: { transactionId: transaction.id },
          });
        
        return crossBorderPayment;
        
      } catch (error) {
        // Automatic rollback on error
        throw new DatabaseTransactionError(
          'Cross-border payment creation failed',
          error
        );
      }
    });
  }
}
```

### Database Migration Strategy
```typescript
// migrations/0001_initial_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS users;

-- Create tables with proper constraints and indexes
-- (See above schema definitions)

-- Create indexes for performance
CREATE INDEX idx_users_phone_number ON auth.users(phone_number);
CREATE INDEX idx_sessions_user_id ON auth.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON auth.sessions(expires_at);

CREATE INDEX idx_transactions_sender ON payments.transactions(sender_id);
CREATE INDEX idx_transactions_recipient ON payments.transactions(recipient_id);
CREATE INDEX idx_transactions_status ON payments.transactions(status);
CREATE INDEX idx_transactions_created_at ON payments.transactions(created_at);

-- migrations/0002_add_cross_border_features.sql
ALTER TABLE payments.transactions 
ADD COLUMN is_cross_border BOOLEAN DEFAULT false;

CREATE TABLE payments.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15,6) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration execution with rollback support
class MigrationRunner {
  async up(): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Apply migration
      await tx.execute(migrationSQL);
      
      // Record migration
      await tx
        .insert(migrations)
        .values({
          name: migrationName,
          appliedAt: new Date(),
        });
    });
  }
  
  async down(): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Rollback migration
      await tx.execute(rollbackSQL);
      
      // Remove migration record
      await tx
        .delete(migrations)
        .where(eq(migrations.name, migrationName));
    });
  }
}
```

## API Design

### RESTful API Standards
```typescript
// Resource-based URL structure
const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: 'POST /api/auth/login',
    LOGOUT: 'POST /api/auth/logout',
    REFRESH: 'POST /api/auth/refresh',
    MFA_ENABLE: 'POST /api/auth/mfa/enable',
    MFA_VERIFY: 'POST /api/auth/mfa/verify',
  },
  
  // Users
  USERS: {
    LIST: 'GET /api/users',
    GET: 'GET /api/users/:id',
    CREATE: 'POST /api/users',
    UPDATE: 'PATCH /api/users/:id',
    DELETE: 'DELETE /api/users/:id',
    
    // Sub-resources
    FRIENDS: 'GET /api/users/:id/friends',
    ADD_FRIEND: 'POST /api/users/:id/friends',
    REMOVE_FRIEND: 'DELETE /api/users/:id/friends/:friendId',
  },
  
  // Payments
  PAYMENTS: {
    LIST: 'GET /api/payments',
    GET: 'GET /api/payments/:id',
    CREATE: 'POST /api/payments',
    CANCEL: 'POST /api/payments/:id/cancel',
    REFUND: 'POST /api/payments/:id/refund',
    
    // Cross-border specific
    CROSS_BORDER: 'POST /api/payments/cross-border',
    EXCHANGE_RATE: 'GET /api/payments/exchange-rate',
  },
} as const;
```

### API Response Standards
```typescript
// Consistent response wrapper
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  traceId?: string;
}

interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMetadata;
}

interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Success response examples
const successResponse: ApiResponse<Payment> = {
  success: true,
  data: {
    id: 'payment_123',
    amount: 100.00,
    currency: 'USD',
    status: 'completed',
    createdAt: '2024-01-01T00:00:00Z',
  },
  metadata: {
    timestamp: '2024-01-01T00:00:00Z',
    requestId: 'req_456',
    version: '1.0.0',
  },
};

// Error response examples
const errorResponse: ApiResponse = {
  success: false,
  error: {
    code: 'INSUFFICIENT_FUNDS',
    message: 'The sender does not have sufficient funds for this transaction',
    details: {
      availableBalance: 50.00,
      requiredAmount: 100.00,
    },
    traceId: 'trace_789',
  },
  metadata: {
    timestamp: '2024-01-01T00:00:00Z',
    requestId: 'req_456',
    version: '1.0.0',
  },
};

// Paginated response example
const paginatedResponse: ApiResponse<Payment[]> = {
  success: true,
  data: [/* array of payments */],
  metadata: {
    timestamp: '2024-01-01T00:00:00Z',
    requestId: 'req_456',
    version: '1.0.0',
    pagination: {
      page: 1,
      pageSize: 20,
      totalItems: 150,
      totalPages: 8,
      hasNext: true,
      hasPrevious: false,
    },
  },
};
```

### Input Validation with Zod
```typescript
// Comprehensive validation schemas
import { z } from 'zod';

// Base schemas
const uuidSchema = z.string().uuid();
const phoneNumberSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);
const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'ZWL', 'ZAR']);
const amountSchema = z.number().positive().max(1000000);

// Authentication schemas
export const loginSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(6).max(100),
  rememberMe: z.boolean().optional().default(false),
});

export const mfaVerificationSchema = z.object({
  userId: uuidSchema,
  token: z.string().length(6).regex(/^\d{6}$/),
});

// Payment schemas
export const createPaymentSchema = z.object({
  amount: amountSchema,
  currency: currencySchema,
  recipientId: uuidSchema,
  description: z.string().max(500).optional(),
  paymentMethod: z.enum(['wallet', 'mobile_money', 'bank_transfer']),
  metadata: z.record(z.unknown()).optional(),
});

export const crossBorderPaymentSchema = z.object({
  amount: amountSchema,
  fromCurrency: currencySchema,
  toCurrency: currencySchema,
  recipientId: uuidSchema,
  recipientCountry: z.string().length(2),
  senderCountry: z.string().length(2),
  purpose: z.enum(['family_support', 'business', 'education', 'other']),
  complianceData: z.object({
    senderIdentification: z.object({
      type: z.enum(['passport', 'national_id', 'drivers_license']),
      number: z.string(),
      expiryDate: z.string().datetime(),
    }),
    recipientDetails: z.object({
      fullName: z.string(),
      address: z.string(),
      bankDetails: z.object({
        accountNumber: z.string(),
        routingNumber: z.string().optional(),
        bankName: z.string(),
      }).optional(),
    }),
  }),
});

// User management schemas
export const createUserSchema = z.object({
  phoneNumber: phoneNumberSchema,
  password: z.string().min(8).max(100),
  userType: z.enum(['user', 'merchant', 'operator', 'partner', 'admin']),
  profile: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().optional(),
    countryCode: z.string().length(2),
  }),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paymentFiltersSchema = z.object({
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  currency: currencySchema.optional(),
}).merge(paginationSchema);
```

### Rate Limiting Strategy
```typescript
// Multi-tier rate limiting
class RateLimitManager {
  private redis: Redis;
  
  constructor(redis: Redis) {
    this.redis = redis;
  }
  
  async checkRateLimit(
    identifier: string,
    limits: RateLimit[]
  ): Promise<RateLimitResult> {
    const results = await Promise.all(
      limits.map(limit => this.checkSingleLimit(identifier, limit))
    );
    
    const blockedLimit = results.find(result => !result.allowed);
    
    if (blockedLimit) {
      return {
        allowed: false,
        limit: blockedLimit.limit,
        remaining: 0,
        resetTime: blockedLimit.resetTime,
      };
    }
    
    const mostRestrictive = results.reduce((min, current) => 
      current.remaining < min.remaining ? current : min
    );
    
    return {
      allowed: true,
      limit: mostRestrictive.limit,
      remaining: mostRestrictive.remaining,
      resetTime: mostRestrictive.resetTime,
    };
  }
  
  private async checkSingleLimit(
    identifier: string,
    limit: RateLimit
  ): Promise<RateLimitCheck> {
    const key = `ratelimit:${limit.name}:${identifier}`;
    const now = Date.now();
    const window = limit.windowMs;
    const windowStart = now - window;
    
    // Remove old entries
    await this.redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    const currentCount = await this.redis.zcard(key);
    
    if (currentCount >= limit.max) {
      const oldestEntry = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestEntry.length > 0 
        ? new Date(parseInt(oldestEntry[1]) + window)
        : new Date(now + window);
      
      return {
        allowed: false,
        limit: limit.max,
        remaining: 0,
        resetTime,
      };
    }
    
    // Add current request
    await this.redis.zadd(key, now, `${now}-${Math.random()}`);
    await this.redis.expire(key, Math.ceil(window / 1000));
    
    return {
      allowed: true,
      limit: limit.max,
      remaining: limit.max - currentCount - 1,
      resetTime: new Date(now + window),
    };
  }
}

// Rate limit configurations
const RATE_LIMITS = {
  // Authentication endpoints
  AUTH_LOGIN: [
    { name: 'login_per_ip', max: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 minutes
    { name: 'login_per_user', max: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 minutes
  ],
  
  // Payment endpoints
  PAYMENT_CREATE: [
    { name: 'payment_per_user', max: 10, windowMs: 60 * 1000 }, // 10 per minute
    { name: 'payment_per_user_hour', max: 50, windowMs: 60 * 60 * 1000 }, // 50 per hour
  ],
  
  // Cross-border payments (more restrictive)
  CROSS_BORDER_PAYMENT: [
    { name: 'cross_border_per_user', max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    { name: 'cross_border_per_user_day', max: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 per day
  ],
  
  // General API access
  API_GENERAL: [
    { name: 'api_per_user', max: 100, windowMs: 60 * 1000 }, // 100 per minute
    { name: 'api_per_ip', max: 1000, windowMs: 60 * 1000 }, // 1000 per minute per IP
  ],
} as const;
```

### API Versioning Strategy
```typescript
// Version management
enum ApiVersion {
  V1 = '1.0.0',
  V2 = '2.0.0',
}

interface VersionedEndpoint {
  version: ApiVersion;
  path: string;
  handler: RequestHandler;
  deprecated?: Date;
  sunset?: Date;
}

class ApiVersionManager {
  private endpoints = new Map<string, VersionedEndpoint[]>();
  
  register(endpoint: VersionedEndpoint): void {
    const key = endpoint.path;
    const existing = this.endpoints.get(key) || [];
    existing.push(endpoint);
    this.endpoints.set(key, existing.sort((a, b) => 
      b.version.localeCompare(a.version)
    ));
  }
  
  async handle(request: Request): Promise<Response> {
    const version = this.extractVersion(request);
    const path = this.extractPath(request);
    
    const endpoints = this.endpoints.get(path);
    if (!endpoints) {
      return new Response('Not Found', { status: 404 });
    }
    
    const endpoint = this.selectEndpoint(endpoints, version);
    if (!endpoint) {
      return new Response('Version Not Supported', { status: 400 });
    }
    
    // Add deprecation warnings
    const response = await endpoint.handler(request);
    if (endpoint.deprecated) {
      response.headers.set('Deprecation', endpoint.deprecated.toISOString());
    }
    if (endpoint.sunset) {
      response.headers.set('Sunset', endpoint.sunset.toISOString());
    }
    
    return response;
  }
  
  private extractVersion(request: Request): string {
    // Try header first
    const headerVersion = request.headers.get('Api-Version');
    if (headerVersion) return headerVersion;
    
    // Try URL path
    const url = new URL(request.url);
    const pathMatch = url.pathname.match(/^\/api\/v(\d+(?:\.\d+)*)/);
    if (pathMatch) return pathMatch[1];
    
    // Default to latest
    return ApiVersion.V2;
  }
}

// Versioned endpoint examples
const paymentEndpoints: VersionedEndpoint[] = [
  {
    version: ApiVersion.V1,
    path: '/api/payments',
    handler: paymentsV1Handler,
    deprecated: new Date('2024-06-01'),
    sunset: new Date('2024-12-01'),
  },
  {
    version: ApiVersion.V2,
    path: '/api/payments',
    handler: paymentsV2Handler,
  },
];
```

---

## Security Architecture

### Defense in Depth Strategy
```typescript
// Multi-layer security implementation
class SecurityMiddleware {
  // Layer 1: Request validation and sanitization
  async validateRequest(request: Request): Promise<void> {
    // Rate limiting
    await this.rateLimitManager.checkLimit(request);
    
    // Input sanitization
    await this.sanitizeInput(request);
    
    // CSRF protection
    await this.validateCSRFToken(request);
    
    // Content type validation
    this.validateContentType(request);
  }
  
  // Layer 2: Authentication and authorization
  async authenticate(request: Request): Promise<User> {
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }
    
    const user = await this.authService.validateToken(token);
    if (!user) {
      throw new UnauthorizedError('Invalid authentication token');
    }
    
    return user;
  }
  
  async authorize(user: User, resource: string, action: string): Promise<void> {
    const hasPermission = await this.authService.checkPermission(
      user.id,
      resource,
      action
    );
    
    if (!hasPermission) {
      throw new ForbiddenError('Insufficient permissions');
    }
  }
  
  // Layer 3: Data encryption and protection
  async encryptSensitiveData(data: unknown): Promise<string> {
    return await this.cryptoService.encrypt(JSON.stringify(data));
  }
  
  async decryptSensitiveData<T>(encryptedData: string): Promise<T> {
    const decrypted = await this.cryptoService.decrypt(encryptedData);
    return JSON.parse(decrypted);
  }
}
```

### JWT Security Implementation
```typescript
// Secure JWT handling with refresh tokens
class JWTManager {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  
  async generateTokenPair(user: User): Promise<TokenPair> {
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    
    // Store refresh token securely
    await this.storeRefreshToken(user.id, refreshToken);
    
    return { accessToken, refreshToken };
  }
  
  private async generateAccessToken(user: User): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      type: 'access',
      userType: user.userType,
      permissions: await this.getUserPermissions(user.id),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
    };
    
    return jwt.sign(payload, this.accessTokenSecret, {
      algorithm: 'HS256',
      issuer: 'paypass-api',
      audience: 'paypass-client',
    });
  }
  
  private async generateRefreshToken(user: User): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };
    
    return jwt.sign(payload, this.refreshTokenSecret, {
      algorithm: 'HS256',
      issuer: 'paypass-api',
      audience: 'paypass-client',
    });
  }
  
  async validateAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
        issuer: 'paypass-api',
        audience: 'paypass-client',
      }) as AccessTokenPayload;
      
      // Additional validation
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      // Check if user is still active
      const user = await this.userService.getUser(payload.sub);
      if (!user || !user.isActive) {
        throw new Error('User account is inactive');
      }
      
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }
}
```

### PCI DSS Compliance Architecture
```typescript
// PCI DSS compliant payment processing
class PCICompliantPaymentProcessor {
  private encryptionService: EncryptionService;
  private auditLogger: AuditLogger;
  
  async processPayment(
    request: PaymentRequest,
    paymentData: SensitivePaymentData
  ): Promise<Payment> {
    // 1. Input validation and sanitization
    const validatedRequest = this.validatePaymentRequest(request);
    const sanitizedPaymentData = this.sanitizePaymentData(paymentData);
    
    // 2. Encrypt sensitive data before processing
    const encryptedPaymentData = await this.encryptionService.encrypt(
      sanitizedPaymentData,
      EncryptionAlgorithm.AES_256_GCM
    );
    
    // 3. Audit log for compliance
    await this.auditLogger.log({
      action: 'payment_processing_started',
      userId: request.userId,
      amount: request.amount,
      currency: request.currency,
      timestamp: new Date(),
      ipAddress: request.metadata.ipAddress,
    });
    
    try {
      // 4. Process payment through secure gateway
      const paymentResult = await this.securePaymentGateway.process({
        ...validatedRequest,
        encryptedPaymentData,
      });
      
      // 5. Store minimal necessary data
      const payment = await this.paymentRepository.create({
        id: paymentResult.id,
        userId: request.userId,
        amount: request.amount,
        currency: request.currency,
        status: paymentResult.status,
        // DO NOT store sensitive payment data
        paymentMethodToken: paymentResult.tokenizedPaymentMethod,
        createdAt: new Date(),
      });
      
      // 6. Audit log for successful processing
      await this.auditLogger.log({
        action: 'payment_processing_completed',
        paymentId: payment.id,
        userId: request.userId,
        status: payment.status,
        timestamp: new Date(),
      });
      
      return payment;
      
    } catch (error) {
      // 7. Audit log for failed processing
      await this.auditLogger.log({
        action: 'payment_processing_failed',
        userId: request.userId,
        error: error.message,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }
  
  private sanitizePaymentData(data: SensitivePaymentData): SensitivePaymentData {
    return {
      // Remove or mask sensitive fields according to PCI DSS requirements
      cardNumber: this.maskCardNumber(data.cardNumber),
      cvv: undefined, // Never store CVV
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      cardholderName: this.sanitizeText(data.cardholderName),
    };
  }
  
  private maskCardNumber(cardNumber: string): string {
    // Show only last 4 digits
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }
}
```

---

This comprehensive architecture guide provides the foundation for building a scalable, secure, and maintainable PayPass platform. Each section should be implemented progressively, starting with the monolithic foundation and evolving toward the microservices architecture as the platform grows.