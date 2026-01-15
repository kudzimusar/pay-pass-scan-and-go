/**
 * Unified Provider Integration Framework
 * Provides a standardized interface for integrating with mobile money providers and banks
 * Supports EcoCash, TeleCash, OneMoney, and bank partners
 */

import { financialLogger } from './financial-logger';
import { complianceEngine } from './compliance';

export enum ProviderType {
  MOBILE_MONEY = 'mobile_money',
  BANK = 'bank',
  CARD_PROCESSOR = 'card_processor',
}

export enum TransactionType {
  TOPUP = 'topup',
  WITHDRAWAL = 'withdrawal',
  TRANSFER = 'transfer',
  PAYMENT = 'payment',
}

export interface ProviderConfig {
  providerId: string;
  providerName: string;
  type: ProviderType;
  apiEndpoint: string;
  apiKey: string;
  apiSecret: string;
  isActive: boolean;
  supportedCurrencies: string[];
  transactionFees: Record<string, number>; // Fee percentage per transaction type
  dailyLimit: number;
  monthlyLimit: number;
}

export interface ProviderTransaction {
  transactionId: string;
  providerId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  externalReference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ProviderResponse {
  success: boolean;
  transactionId: string;
  externalReference?: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Abstract base class for provider implementations
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected retryAttempts = 3;
  protected retryDelay = 1000; // milliseconds

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Initialize provider connection
   */
  abstract initialize(): Promise<void>;

  /**
   * Process a top-up transaction
   */
  abstract topup(userId: string, amount: number, currency: string): Promise<ProviderResponse>;

  /**
   * Process a withdrawal transaction
   */
  abstract withdraw(userId: string, amount: number, currency: string): Promise<ProviderResponse>;

  /**
   * Process a transfer transaction
   */
  abstract transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string
  ): Promise<ProviderResponse>;

  /**
   * Check transaction status
   */
  abstract checkStatus(transactionId: string): Promise<ProviderTransaction>;

  /**
   * Get account balance
   */
  abstract getBalance(userId: string): Promise<number>;

  /**
   * Validate provider credentials
   */
  abstract validateCredentials(): Promise<boolean>;

  /**
   * Retry logic for failed requests
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (attempt + 1)));
        return this.retry(fn, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Log provider transaction
   */
  protected logTransaction(transaction: ProviderTransaction): void {
    financialLogger.logTransaction({
      operationId: transaction.transactionId,
      userId: transaction.userId,
      operationType: transaction.type as any,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status as any,
      description: `Provider transaction via ${this.config.providerName}`,
      metadata: {
        providerId: this.config.providerId,
        externalReference: transaction.externalReference,
      },
    });
  }
}

/**
 * Provider Registry - Manages all active providers
 */
export class ProviderRegistry {
  private providers: Map<string, BaseProvider> = new Map();
  private configs: Map<string, ProviderConfig> = new Map();

  /**
   * Register a provider
   */
  public registerProvider(config: ProviderConfig, provider: BaseProvider): void {
    if (!config.isActive) {
      console.warn(`Provider ${config.providerId} is not active. Skipping registration.`);
      return;
    }

    this.providers.set(config.providerId, provider);
    this.configs.set(config.providerId, config);
    console.log(`✅ Provider registered: ${config.providerName}`);
  }

  /**
   * Get a provider by ID
   */
  public getProvider(providerId: string): BaseProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all active providers
   */
  public getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  public getProvidersByType(type: ProviderType): BaseProvider[] {
    const providers: BaseProvider[] = [];
    this.configs.forEach((config, providerId) => {
      if (config.type === type) {
        const provider = this.providers.get(providerId);
        if (provider) providers.push(provider);
      }
    });
    return providers;
  }

  /**
   * Route transaction to best available provider
   */
  public async routeTransaction(
    type: TransactionType,
    amount: number,
    currency: string,
    preferredProviderId?: string
  ): Promise<BaseProvider> {
    // If preferred provider is specified, use it
    if (preferredProviderId) {
      const provider = this.getProvider(preferredProviderId);
      if (provider) return provider;
    }

    // Otherwise, find the best available provider
    const mobileMoneyProviders = this.getProvidersByType(ProviderType.MOBILE_MONEY);
    if (mobileMoneyProviders.length === 0) {
      throw new Error('No mobile money providers available');
    }

    // Simple routing logic: return first available provider
    // In production, this would consider fees, limits, and success rates
    return mobileMoneyProviders[0];
  }

  /**
   * Get provider configuration
   */
  public getConfig(providerId: string): ProviderConfig | undefined {
    return this.configs.get(providerId);
  }

  /**
   * Update provider configuration
   */
  public updateConfig(providerId: string, updates: Partial<ProviderConfig>): void {
    const config = this.configs.get(providerId);
    if (config) {
      Object.assign(config, updates);
      console.log(`✅ Provider config updated: ${providerId}`);
    }
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry();
