/**
 * TeleCash Provider Integration
 * Implements direct integration with TeleCash mobile money service
 */

import { BaseProvider, ProviderConfig, ProviderResponse, ProviderTransaction, TransactionType } from '../provider-integration';

export class TeleCashProvider extends BaseProvider {
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * Initialize TeleCash connection
   */
  async initialize(): Promise<void> {
    try {
      const isValid = await this.validateCredentials();
      if (!isValid) {
        throw new Error('TeleCash credentials validation failed');
      }
      console.log('✅ TeleCash provider initialized');
    } catch (error) {
      console.error('❌ TeleCash initialization failed:', error);
      throw error;
    }
  }

  /**
   * Validate TeleCash credentials and obtain access token
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.config.apiKey,
            client_secret: this.config.apiSecret,
          }).toString(),
        })
      );

      if (!response.ok) {
        throw new Error(`TeleCash token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;
      return true;
    } catch (error) {
      console.error('TeleCash credential validation error:', error);
      return false;
    }
  }

  /**
   * Ensure access token is valid, refresh if needed
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000)) {
      await this.validateCredentials();
    }
  }

  /**
   * Process a top-up transaction
   */
  async topup(userId: string, amount: number, currency: string): Promise<ProviderResponse> {
    const transactionId = `tc-topup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await this.ensureValidToken();

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/v1/transactions/topup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            transactionId,
            customerId: userId,
            amount,
            currency,
            description: 'PayPass wallet top-up',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId,
          externalReference: data.referenceNumber,
          message: 'Top-up completed successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Top-up failed');
      }
    } catch (error) {
      console.error('TeleCash top-up error:', error);
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
    const transactionId = `tc-withdraw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await this.ensureValidToken();

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/v1/transactions/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            transactionId,
            customerId: userId,
            amount,
            currency,
            description: 'PayPass wallet withdrawal',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId,
          externalReference: data.referenceNumber,
          message: 'Withdrawal completed successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('TeleCash withdrawal error:', error);
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
    const transactionId = `tc-transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await this.ensureValidToken();

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/v1/transactions/transfer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            transactionId,
            fromCustomerId: fromUserId,
            toCustomerId: toUserId,
            amount,
            currency,
            description: 'PayPass peer-to-peer transfer',
          }),
        })
      );

      const data = await response.json();

      if (response.ok && data.status === 'SUCCESS') {
        return {
          success: true,
          transactionId,
          externalReference: data.referenceNumber,
          message: 'Transfer completed successfully',
          data: { balance: data.newBalance },
        };
      } else {
        throw new Error(data.message || 'Transfer failed');
      }
    } catch (error) {
      console.error('TeleCash transfer error:', error);
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
      await this.ensureValidToken();

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/v1/transactions/${transactionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })
      );

      const data = await response.json();

      return {
        transactionId,
        providerId: this.config.providerId,
        userId: data.customerId,
        type: data.transactionType as TransactionType,
        amount: data.amount,
        currency: data.currency,
        status: data.status.toLowerCase() as any,
        externalReference: data.referenceNumber,
        createdAt: data.createdAt,
        completedAt: data.completedAt,
      };
    } catch (error) {
      console.error('TeleCash status check error:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      await this.ensureValidToken();

      const response = await this.retry(() =>
        fetch(`${this.config.apiEndpoint}/v1/accounts/${userId}/balance`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        })
      );

      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error('TeleCash balance check error:', error);
      throw error;
    }
  }
}
