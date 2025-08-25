/**
 * Service Abstractions for Microservices Migration
 * Provides clean interfaces and abstractions to prepare for service extraction
 */

import { z } from "zod";

// Base service interface
export interface BaseService {
  name: string;
  version: string;
  health(): Promise<HealthStatus>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  details?: Record<string, any>;
}

// User Service Interface
export interface IUserService extends BaseService {
  // Authentication
  authenticate(credentials: AuthCredentials): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<AuthResult>;
  logout(userId: string, tokenId: string): Promise<void>;
  
  // User Management
  createUser(userData: CreateUserRequest): Promise<User>;
  getUser(userId: string): Promise<User | null>;
  updateUser(userId: string, updates: UpdateUserRequest): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  
  // KYC Operations
  submitKYC(userId: string, documents: KYCDocuments): Promise<KYCSubmission>;
  getKYCStatus(userId: string): Promise<KYCStatus>;
  approveKYC(userId: string, reviewerId: string): Promise<void>;
  rejectKYC(userId: string, reason: string, reviewerId: string): Promise<void>;
  
  // MFA Operations
  setupMFA(userId: string): Promise<MFASetupResult>;
  verifyMFA(userId: string, token: string): Promise<boolean>;
  disableMFA(userId: string): Promise<void>;
}

// Wallet Service Interface
export interface IWalletService extends BaseService {
  // Wallet Operations
  createWallet(userId: string): Promise<Wallet>;
  getWallet(userId: string): Promise<Wallet | null>;
  getBalance(userId: string, currency: string): Promise<Balance>;
  
  // Transaction Operations
  reserveFunds(userId: string, amount: number, currency: string, reference: string): Promise<Reservation>;
  commitReservation(reservationId: string): Promise<void>;
  releaseReservation(reservationId: string): Promise<void>;
  
  // Balance Updates
  creditAccount(userId: string, amount: number, currency: string, reference: string): Promise<Transaction>;
  debitAccount(userId: string, amount: number, currency: string, reference: string): Promise<Transaction>;
  transferFunds(fromUserId: string, toUserId: string, amount: number, currency: string): Promise<Transaction>;
}

// Payment Service Interface
export interface IPaymentService extends BaseService {
  // Payment Processing
  initiatePayment(request: PaymentRequest): Promise<PaymentResult>;
  processQRPayment(qrData: string, userId: string, amount: number): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  cancelPayment(paymentId: string, reason: string): Promise<void>;
  
  // Payment History
  getPaymentHistory(userId: string, filters: PaymentHistoryFilters): Promise<PaymentHistory>;
  getPaymentDetails(paymentId: string): Promise<PaymentDetails>;
}

// Cross-Border Service Interface
export interface ICrossBorderService extends BaseService {
  // Cross-Border Payments
  initiateCrossBorderPayment(request: CrossBorderPaymentRequest): Promise<CrossBorderPaymentResult>;
  getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate>;
  calculateFees(amount: number, fromCurrency: string, toCurrency: string): Promise<FeeCalculation>;
  
  // Compliance
  performComplianceCheck(payment: CrossBorderPaymentRequest): Promise<ComplianceResult>;
  reportTransaction(transactionId: string, reportType: string): Promise<void>;
}

// Notification Service Interface
export interface INotificationService extends BaseService {
  // Send Notifications
  sendNotification(userId: string, notification: NotificationRequest): Promise<NotificationResult>;
  sendBulkNotification(userIds: string[], notification: NotificationRequest): Promise<BulkNotificationResult>;
  scheduleNotification(userId: string, notification: NotificationRequest, scheduledFor: Date): Promise<string>;
  
  // Notification Management
  getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
}

// Fraud Service Interface
export interface IFraudService extends BaseService {
  // Risk Assessment
  assessTransactionRisk(transaction: TransactionRiskRequest): Promise<RiskAssessment>;
  updateRiskModel(modelId: string, modelData: any): Promise<void>;
  getModelPerformance(modelId: string): Promise<ModelPerformance>;
  
  // Fraud Management
  reportFraud(transactionId: string, reporterId: string, details: string): Promise<void>;
  investigateFraud(fraudReportId: string): Promise<FraudInvestigation>;
  resolveCase(caseId: string, resolution: FraudResolution): Promise<void>;
}

// Analytics Service Interface
export interface IAnalyticsService extends BaseService {
  // Data Collection
  recordEvent(event: AnalyticsEvent): Promise<void>;
  recordMetric(metric: PerformanceMetric): Promise<void>;
  
  // Reporting
  generateReport(reportType: string, parameters: ReportParameters): Promise<AnalyticsReport>;
  getDashboardData(timeRange: string, filters: DashboardFilters): Promise<DashboardData>;
  getKPIs(timeRange: string): Promise<KPIData>;
}

// Data Transfer Objects (DTOs)

export const AuthCredentialsSchema = z.object({
  phone: z.string(),
  pin: z.string(),
  mfaToken: z.string().optional(),
});

export const CreateUserRequestSchema = z.object({
  fullName: z.string(),
  phone: z.string(),
  email: z.string().email(),
  pin: z.string(),
  countryCode: z.string(),
  isInternational: z.boolean().default(false),
});

export const PaymentRequestSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string(),
  recipientId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  paymentMethod: z.string(),
  description: z.string(),
});

export const CrossBorderPaymentRequestSchema = z.object({
  senderId: z.string().uuid(),
  recipientId: z.string().uuid(),
  senderAmount: z.number().positive(),
  senderCurrency: z.string(),
  recipientCurrency: z.string(),
  paymentMethod: z.string(),
  purpose: z.string(),
  friendNetworkId: z.string().uuid().optional(),
});

export const NotificationRequestSchema = z.object({
  type: z.enum(['payment', 'security', 'system', 'marketing']),
  title: z.string(),
  message: z.string(),
  channels: z.array(z.enum(['push', 'sms', 'email', 'in_app'])),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  data: z.record(z.any()).optional(),
});

// Type definitions
export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
export type CrossBorderPaymentRequest = z.infer<typeof CrossBorderPaymentRequestSchema>;
export type NotificationRequest = z.infer<typeof NotificationRequestSchema>;

export interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
}

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  countryCode: string;
  isInternational: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  mfaEnabled: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balances: Record<string, number>; // currency -> amount
  dailyLimits: Record<string, number>;
  monthlyLimits: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Balance {
  userId: string;
  currency: string;
  amount: number;
  reserved: number;
  available: number;
  lastUpdated: Date;
}

export interface Reservation {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  expiresAt: Date;
  status: 'active' | 'committed' | 'released' | 'expired';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'transfer';
  amount: number;
  currency: string;
  reference: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  estimatedCompletion?: Date;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface CrossBorderPaymentResult {
  success: boolean;
  paymentId?: string;
  exchangeRate: number;
  fees: FeeCalculation;
  estimatedDelivery: Date;
  complianceStatus: 'approved' | 'pending' | 'flagged';
  error?: string;
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  timestamp: Date;
  validUntil: Date;
}

export interface FeeCalculation {
  exchangeFee: number;
  transferFee: number;
  totalFees: number;
  currency: string;
}

export interface ComplianceResult {
  approved: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checks: ComplianceCheck[];
  requiresManualReview: boolean;
  notes?: string;
}

export interface ComplianceCheck {
  type: string;
  status: 'passed' | 'failed' | 'warning';
  details: string;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  deliveryResults: DeliveryResult[];
  error?: string;
}

export interface DeliveryResult {
  channel: 'push' | 'sms' | 'email' | 'in_app';
  success: boolean;
  timestamp: Date;
  error?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface RiskAssessment {
  transactionId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'allow' | 'review' | 'block';
  factors: string[];
  modelPredictions: ModelPrediction[];
}

export interface ModelPrediction {
  modelId: string;
  score: number;
  confidence: number;
  factors: string[];
}

// Service Registry and Discovery
export interface ServiceRegistry {
  registerService(service: ServiceInfo): Promise<void>;
  deregisterService(serviceId: string): Promise<void>;
  discoverService(serviceName: string): Promise<ServiceInfo[]>;
  getServiceHealth(serviceName: string): Promise<HealthStatus[]>;
}

export interface ServiceInfo {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  healthCheck: string;
  tags: string[];
  metadata: Record<string, string>;
}

// Event System for Service Communication
export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): Promise<void>;
  unsubscribe(eventType: string, handler: EventHandler): Promise<void>;
}

export interface DomainEvent {
  id: string;
  type: string;
  version: string;
  timestamp: Date;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
  metadata: Record<string, any>;
}

export type EventHandler = (event: DomainEvent) => Promise<void>;

// Configuration Management
export interface ConfigurationManager {
  getConfig<T>(serviceName: string, configKey: string): Promise<T>;
  setConfig<T>(serviceName: string, configKey: string, value: T): Promise<void>;
  watchConfig(serviceName: string, configKey: string, callback: ConfigChangeCallback): Promise<void>;
}

export type ConfigChangeCallback = (newValue: any, oldValue: any) => void;

// Circuit Breaker Pattern
export interface CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): 'closed' | 'open' | 'half-open';
  getMetrics(): CircuitBreakerMetrics;
}

export interface CircuitBreakerMetrics {
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  successRate: number;
  lastFailureTime?: Date;
}

// Service Factory for creating service instances
export class ServiceFactory {
  private services: Map<string, any> = new Map();
  
  register<T extends BaseService>(name: string, service: T): void {
    this.services.set(name, service);
  }
  
  get<T extends BaseService>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service;
  }
  
  async healthCheck(): Promise<Record<string, HealthStatus>> {
    const health: Record<string, HealthStatus> = {};
    
    for (const [name, service] of this.services) {
      try {
        health[name] = await service.health();
      } catch (error) {
        health[name] = {
          status: 'unhealthy',
          timestamp: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    }
    
    return health;
  }
}

// Export singleton factory instance
export const serviceFactory = new ServiceFactory();

// Service implementation base class
export abstract class BaseServiceImpl implements BaseService {
  abstract name: string;
  abstract version: string;
  
  async health(): Promise<HealthStatus> {
    // Basic health check - override in implementations for more detailed checks
    return {
      status: 'healthy',
      timestamp: new Date(),
      details: {
        name: this.name,
        version: this.version,
      },
    };
  }
}

// Utility functions for service communication
export class ServiceCommunication {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  }
  
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }
  
  static async withCircuitBreaker<T>(
    circuitBreaker: CircuitBreaker,
    operation: () => Promise<T>
  ): Promise<T> {
    return circuitBreaker.execute(operation);
  }
}