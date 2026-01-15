/**
 * Paynow Provider Integration
 * Implements integration with Paynow API for Zimbabwe payments
 * Supports both mobile money and card payments
 */

import { BaseProvider, ProviderConfig, ProviderResponse, ProviderTransaction, TransactionType } from '../provider-integration';
import crypto from 'crypto';

export class PaynowProvider extends BaseProvider {
  private sessionToken?: string;
  private readonly PAYNOW_API_VERSION = 'v1';

  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * Initialize Paynow connection
   */
  async initialize(): Promise<void> {
    try {
      const isValid = await this.validateCredentials();
      if (!isValid) {
        throw new Error('Paynow credentials validation failed');
      }
      console.log('✅ Paynow provider initialized');
    } catch (error) {
      console.error('❌ Paynow initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate Paynow credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`Paynow validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionToken = data.sessionToken;
      return true;
    } catch (error) {
      console.error('Paynow credential validation error:', error);
      return false;
    }
  }

  /**
   * Process a top-up transaction via Paynow
   */
  async topup(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `paynow-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const payload = {
        transactionId,
        userId,
        amount,
        currency,
        type: 'TOPUP',
        timestamp: new Date().toISOString(),
      };

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/transactions/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
            'Authorization': `Bearer ${this.sessionToken || ''}`,
          },
          body: JSON.stringify(payload),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.pollUrl || data.transactionId,
          message: 'Top-up initiated successfully via Paynow',
          data: { 
            balance: data.balance,
            pollUrl: data.pollUrl,
          },
        };
      } else {
        throw new Error(data.message || 'Top-up failed');
      }
    } catch (error) {
      console.error('Paynow top-up error:', error);
      return {
        success: false,
        transactionId,
        message: `Top-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process a withdrawal transaction via Paynow
   */
  async withdraw(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `paynow-withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const payload = {
        transactionId,
        userId,
        amount,
        currency,
        type: 'WITHDRAWAL',
        timestamp: new Date().toISOString(),
      };

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/transactions/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
            'Authorization': `Bearer ${this.sessionToken || ''}`,
          },
          body: JSON.stringify(payload),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.pollUrl || data.transactionId,
          message: 'Withdrawal initiated successfully via Paynow',
          data: { 
            balance: data.balance,
            pollUrl: data.pollUrl,
          },
        };
      } else {
        throw new Error(data.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Paynow withdrawal error:', error);
      return {
        success: false,
        transactionId,
        message: `Withdrawal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process a transfer transaction via Paynow
   */
  async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string
  ): Promise<ProviderResponse> {
    const transactionId = `paynow-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const payload = {
        transactionId,
        fromUserId,
        toUserId,
        amount,
        currency,
        type: 'TRANSFER',
        timestamp: new Date().toISOString(),
      };

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/transactions/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
            'Authorization': `Bearer ${this.sessionToken || ''}`,
          },
          body: JSON.stringify(payload),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.pollUrl || data.transactionId,
          message: 'Transfer completed successfully via Paynow',
          data: { 
            balance: data.balance,
            pollUrl: data.pollUrl,
          },
        };
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('Paynow transfer error:', error);
      return {
        success: false,
        transactionId,
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check transaction status via Paynow polling
   */
  async checkStatus(transactionId: string): Promise<ProviderTransaction> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/transactions/${transactionId}/status`, {
          method: 'GET',
          headers: {
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
            'Authorization': `Bearer ${this.sessionToken || ''}`,
          },
        })
      );

      const data = await response.json();

      return {
        transactionId,
        providerId: this.config.providerId,
        userId: data.userId,
        type: data.type as TransactionType,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        externalReference: data.pollUrl || data.transactionId,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
      };
    } catch (error) {
      console.error('Paynow status check error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/accounts/${userId}/balance`, {
          method: 'GET',
          headers: {
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
            'Authorization': `Bearer ${this.sessionToken || ''}`,
          },
        })
      );

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('Paynow balance check error:', error);
      throw error;
    }
  }

  /**
   * Create a Paynow payment link for checkout
   */
  async createPaymentLink(
    userId: string,
    amount: number,
    currency: string,
    description: string,
    returnUrl: string
  ): Promise<{ success: boolean; paymentLink?: string; pollUrl?: string; message: string }> {
    try {
      const payload = {
        integrationId: this.config.apiKey,
        reference: `paypass-${Date.now()}`,
        amount,
        currency,
        description,
        returnUrl,
        userId,
        timestamp: new Date().toISOString(),
      };

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/${this.PAYNOW_API_VERSION}/payments/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
          },
          body: JSON.stringify(payload),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          paymentLink: data.link,
          pollUrl: data.pollUrl,
          message: 'Payment link created successfully',
        };
      } else {
        throw new Error(data.message || 'Payment link creation failed');
      }
    } catch (error) {
      console.error('Paynow payment link creation error:', error);
      return {
        success: false,
        message: `Payment link creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Poll transaction status (Paynow uses polling instead of webhooks)
   */
  async pollTransactionStatus(pollUrl: string): Promise<{ status: string; success: boolean }> {
    try {
      const response = await this.retry(() =>
        fetch(pollUrl, {
          method: 'GET',
          headers: {
            'Integration-ID': this.config.apiKey,
            'Integration-Key': this.config.apiSecret,
          },
        })
      );

      const data = await response.json();

      return {
        status: data.status,
        success: data.status === 'Paid' || data.status === 'Complete',
      };
    } catch (error) {
      console.error('Paynow polling error:', error);
      throw error;
    }
  }
}
