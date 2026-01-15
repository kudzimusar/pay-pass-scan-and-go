/**
 * Paynow Configuration
 * Stores and manages Paynow API credentials for Tengasell
 */

import { ProviderConfig } from '../provider-integration';

/**
 * Paynow Provider Configuration
 * Company: Tengasell
 * Type: 3rd Party Integration
 * Payment Link: Pay Pass
 */
export const PAYNOW_CONFIG: ProviderConfig = {
  providerId: 'paynow',
  providerName: 'Paynow',
  type: 'payment_gateway',
  isActive: true,
  supportedCurrencies: ['ZWL', 'USD'],
  supportedCountries: ['ZW'],
  
  // Tengasell Credentials
  apiKey: process.env.PAYNOW_INTEGRATION_ID || '23074',
  apiSecret: process.env.PAYNOW_INTEGRATION_KEY || 'cadc4968-7f35-4c38-aabe-9729e050be1f',
  apiEndpoint: process.env.PAYNOW_API_ENDPOINT || 'https://api.paynow.co.zw',
  
  // Transaction Fees (percentage + fixed amount)
  transactionFees: {
    topup: { percentage: 0.5, fixed: 0 }, // 0.5% for top-ups
    withdrawal: { percentage: 1, fixed: 0 }, // 1% for withdrawals
    transfer: { percentage: 0.5, fixed: 0 }, // 0.5% for transfers
    payment: { percentage: 2, fixed: 0 }, // 2% for payments
  },
  
  // Transaction Limits
  dailyLimit: 50000, // ZWL
  monthlyLimit: 500000, // ZWL
  minAmount: 1, // ZWL
  maxAmount: 100000, // ZWL
  
  // Supported Transaction Types
  supportedTransactionTypes: ['topup', 'withdrawal', 'transfer', 'payment'],
  
  // Retry Configuration
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  
  // Timeout Configuration
  requestTimeout: 30000, // milliseconds
  
  // Webhook Configuration (Paynow uses polling instead)
  webhookEnabled: false,
  pollingEnabled: true,
  pollingInterval: 5000, // milliseconds
};

/**
 * Validate Paynow Configuration
 */
export function validatePaynowConfig(): boolean {
  const required = ['apiKey', 'apiSecret', 'apiEndpoint'];
  
  for (const field of required) {
    if (!PAYNOW_CONFIG[field as keyof ProviderConfig]) {
      console.error(`❌ Missing required Paynow configuration: ${field}`);
      return false;
    }
  }
  
  console.log('✅ Paynow configuration validated');
  return true;
}

/**
 * Get Paynow Configuration
 */
export function getPaynowConfig(): ProviderConfig {
  if (!validatePaynowConfig()) {
    throw new Error('Invalid Paynow configuration');
  }
  return PAYNOW_CONFIG;
}

/**
 * Update Paynow Configuration (for runtime updates)
 */
export function updatePaynowConfig(updates: Partial<ProviderConfig>): void {
  Object.assign(PAYNOW_CONFIG, updates);
  console.log('✅ Paynow configuration updated');
}
