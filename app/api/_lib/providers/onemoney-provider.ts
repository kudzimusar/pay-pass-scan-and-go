/**
 * OneMoney Provider Integration
 * Implements direct integration with OneMoney mobile money service
 */

import { BaseProvider, ProviderConfig, ProviderResponse, ProviderTransaction, TransactionType } from '../provider-integration';

export class OneMoneyProvider extends BaseProvider {
  private sessionId?: string;

  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * Initialize OneMoney connection
   */
  async initialize(): Promise<void> {
    try {
      const isValid = await this.validateCredentials();
      if (!isValid) {
        throw new Error('OneMoney credentials validation failed');
      }
      console.log('✅ OneMoney provider initialized');
    } catch (error) {
      console.error('❌ OneMoney initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate OneMoney credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/api/v2/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: this.config.apiKey,
            apiSecret: this.config.apiSecret,
          }),
        })
      );

      if (!response.ok) {
        throw new Error(`OneMoney login failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.sessionId;
      return true;
    } catch (error) {
      console.error('OneMoney credential validation error:', error);
      return false;
    }
  }

  /**
   * Process a top-up transaction
   */
  async topup(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `om-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/api/v2/transactions/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || '',
          },
          body: JSON.stringify({
            transactionId,
            accountNumber: userId,
            amount,
            currency,
            narration: 'PayPass wallet top-up',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.responseCode === '0') {
        return {
          success: true,
          transactionId,
          externalReference: data.transactionReference,
          message: 'Top-up completed successfully',
          data: { balance: data.accountBalance },
        };
      } else {
        throw new Error(data.responseMessage || 'Top-up failed');
      }
    } catch (error) {
      console.error('OneMoney top-up error:', error);
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
    const transactionId = `om-withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/api/v2/transactions/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || '',
          },
          body: JSON.stringify({
            transactionId,
            accountNumber: userId,
            amount,
            currency,
            narration: 'PayPass wallet withdrawal',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.responseCode === '0') {
        return {
          success: true,
          transactionId,
          externalReference: data.transactionReference,
          message: 'Withdrawal completed successfully',
          data: { balance: data.accountBalance },
        };
      } else {
        throw new Error(data.responseMessage || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('OneMoney withdrawal error:', error);
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
    const transactionId = `om-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/api/v2/transactions/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': this.sessionId || '',
          },
          body: JSON.stringify({
            transactionId,
            fromAccountNumber: fromUserId,
            toAccountNumber: toUserId,
            amount,
            currency,
            narration: 'PayPass peer-to-peer transfer',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.responseCode === '0') {
        return {
          success: true,
          transactionId,
          externalReference: data.transactionReference,
          message: 'Transfer completed successfully',
          data: { balance: data.accountBalance },
        };
      } else {
        throw new Error(data.responseMessage || 'Transfer failed');
      }
    } catch (error) {
      console.error('OneMoney transfer error:', error);
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
        fetch(`${this.config.apiEndpoint}/api/v2/transactions/${transactionId}/status`, {
          method: 'GET',
          headers: {
            'X-Session-ID': this.sessionId || '',
          },
        })
      );

      const data = await response.json();

      return {
        transactionId,
        providerId: this.config.providerId,
        userId: data.accountNumber,
        type: data.transactionType as TransactionType,
        amount: data.amount,
        currency: data.currency,
        status: data.status.toLowerCase() as any,
        externalReference: data.transactionReference,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
      };
    } catch (error) {
      console.error('OneMoney status check error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/api/v2/accounts/${userId}/balance`, {
          method: 'GET',
          headers: {
            'X-Session-ID': this.sessionId || '',
          },
        })
      );

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('OneMoney balance check error:', error);
      throw error;
    }
  }
}
