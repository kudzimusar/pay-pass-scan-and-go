/**
 * EcoCash Provider Integration
 * Implements direct integration with EcoCash mobile money service
 */

import { BaseProvider, ProviderConfig, ProviderResponse, ProviderTransaction, TransactionType } from '../provider-integration';
import crypto from 'crypto';

export class EcoCashProvider extends BaseProvider {
  private sessionToken?: string;

  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * Initialize EcoCash connection
   */
  async initialize(): Promise<void> {
    try {
      const isValid = await this.validateCredentials();
      if (!isValid) {
        throw new Error('EcoCash credentials validation failed');
      }
      console.log('✅ EcoCash provider initialized');
    } catch (error) {
      console.error('❌ EcoCash initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate EcoCash credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            signature: this.generateSignature('validate'),
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`EcoCash validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionToken = data.sessionToken;
      return true;
    } catch (error) {
      console.error('EcoCash credential validation error:', error);
      return false;
    }
  }

  /**
   * Process a top-up transaction
   */
  async topup(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `eco-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        fetch(`${this.config.apiEndpoint}/transactions/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionToken || this.config.apiKey}`,
          },
          body: JSON.stringify({
            ...payload,
            signature: this.generateSignature(JSON.stringify(payload)),
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.externalReference,
          message: 'Top-up initiated successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Top-up failed');
      }
    } catch (error) {
      console.error('EcoCash top-up error:', error);
      return {
        success: false,
        transactionId,
        message: `Top-up failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process a withdrawal transaction
   */
  async withdraw(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `eco-withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        fetch(`${this.config.apiEndpoint}/transactions/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionToken || this.config.apiKey}`,
          },
          body: JSON.stringify({
            ...payload,
            signature: this.generateSignature(JSON.stringify(payload)),
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.externalReference,
          message: 'Withdrawal initiated successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('EcoCash withdrawal error:', error);
      return {
        success: false,
        transactionId,
        message: `Withdrawal failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process a transfer transaction
   */
  async transfer(
    fromUserId: string,
    toUserId: string,
    amount: number,
    currency: string
  ): Promise<ProviderResponse> {
    const transactionId = `eco-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        fetch(`${this.config.apiEndpoint}/transactions/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.sessionToken || this.config.apiKey}`,
          },
          body: JSON.stringify({
            ...payload,
            signature: this.generateSignature(JSON.stringify(payload)),
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId,
          externalReference: data.externalReference,
          message: 'Transfer completed successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('EcoCash transfer error:', error);
      return {
        success: false,
        transactionId,
        message: `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check transaction status
   */
  async checkStatus(transactionId: string): Promise<ProviderTransaction> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/transactions/${transactionId}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.sessionToken || this.config.apiKey}`,
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
        externalReference: data.externalReference,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
      };
    } catch (error) {
      console.error('EcoCash status check error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/accounts/${userId}/balance`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.sessionToken || this.config.apiKey}`,
          },
        })
      );

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('EcoCash balance check error:', error);
      throw error;
    }
  }

  /**
   * Generate HMAC signature for request authentication
   */
  private generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
  }
}
