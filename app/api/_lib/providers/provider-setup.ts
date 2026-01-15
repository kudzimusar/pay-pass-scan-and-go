/**
 * Provider Setup & Initialization
 * Initializes all mobile money and bank providers with their configurations
 */

import { ProviderConfig, ProviderType, providerRegistry } from '../provider-integration';
import { EcoCashProvider } from './ecocash-provider';
import { TeleCashProvider } from './telecash-provider';
import { OneMoneyProvider } from './onemoney-provider';

/**
 * Initialize all configured providers
 */
export async function initializeProviders(): Promise<void> {
  console.log('🚀 Initializing Payment Providers...');

  // EcoCash Configuration
  const ecocashConfig: ProviderConfig = {
    providerId: 'ecocash',
    providerName: 'EcoCash',
    type: ProviderType.MOBILE_MONEY,
    apiEndpoint: process.env.ECOCASH_API_ENDPOINT || 'https://api.ecocash.co.zw',
    apiKey: process.env.ECOCASH_API_KEY || 'demo-key',
    apiSecret: process.env.ECOCASH_API_SECRET || 'demo-secret',
    isActive: process.env.ECOCASH_ENABLED === 'true',
    supportedCurrencies: ['ZWL', 'USD'],
    transactionFees: {
      topup: 0.02, // 2%
      withdrawal: 0.03, // 3%
      transfer: 0.01, // 1%
      payment: 0.015, // 1.5%
    },
    dailyLimit: 5000,
    monthlyLimit: 50000,
  };

  // TeleCash Configuration
  const telecashConfig: ProviderConfig = {
    providerId: 'telecash',
    providerName: 'TeleCash',
    type: ProviderType.MOBILE_MONEY,
    apiEndpoint: process.env.TELECASH_API_ENDPOINT || 'https://api.telecash.co.zw',
    apiKey: process.env.TELECASH_API_KEY || 'demo-key',
    apiSecret: process.env.TELECASH_API_SECRET || 'demo-secret',
    isActive: process.env.TELECASH_ENABLED === 'true',
    supportedCurrencies: ['ZWL', 'USD'],
    transactionFees: {
      topup: 0.02,
      withdrawal: 0.03,
      transfer: 0.01,
      payment: 0.015,
    },
    dailyLimit: 5000,
    monthlyLimit: 50000,
  };

  // OneMoney Configuration
  const onemoneyConfig: ProviderConfig = {
    providerId: 'onemoney',
    providerName: 'OneMoney',
    type: ProviderType.MOBILE_MONEY,
    apiEndpoint: process.env.ONEMONEY_API_ENDPOINT || 'https://api.onemoney.co.zw',
    apiKey: process.env.ONEMONEY_API_KEY || 'demo-key',
    apiSecret: process.env.ONEMONEY_API_SECRET || 'demo-secret',
    isActive: process.env.ONEMONEY_ENABLED === 'true',
    supportedCurrencies: ['ZWL', 'USD'],
    transactionFees: {
      topup: 0.02,
      withdrawal: 0.03,
      transfer: 0.01,
      payment: 0.015,
    },
    dailyLimit: 5000,
    monthlyLimit: 50000,
  };

  // Register providers
  try {
    if (ecocashConfig.isActive) {
      const ecocashProvider = new EcoCashProvider(ecocashConfig);
      await ecocashProvider.initialize();
      providerRegistry.registerProvider(ecocashConfig, ecocashProvider);
    }

    if (telecashConfig.isActive) {
      const telecashProvider = new TeleCashProvider(telecashConfig);
      await telecashProvider.initialize();
      providerRegistry.registerProvider(telecashConfig, telecashProvider);
    }

    if (onemoneyConfig.isActive) {
      const onemoneyProvider = new OneMoneyProvider(onemoneyConfig);
      await onemoneyProvider.initialize();
      providerRegistry.registerProvider(onemoneyConfig, onemoneyProvider);
    }

    console.log('✅ All active providers initialized successfully');
  } catch (error) {
    console.error('❌ Provider initialization failed:', error);
    throw error;
  }
}

/**
 * Get provider configuration from environment or defaults
 */
export function getProviderConfigs(): ProviderConfig[] {
  return [
    {
      providerId: 'ecocash',
      providerName: 'EcoCash',
      type: ProviderType.MOBILE_MONEY,
      apiEndpoint: process.env.ECOCASH_API_ENDPOINT || 'https://api.ecocash.co.zw',
      apiKey: process.env.ECOCASH_API_KEY || '',
      apiSecret: process.env.ECOCASH_API_SECRET || '',
      isActive: process.env.ECOCASH_ENABLED === 'true',
      supportedCurrencies: ['ZWL', 'USD'],
      transactionFees: { topup: 0.02, withdrawal: 0.03, transfer: 0.01, payment: 0.015 },
      dailyLimit: 5000,
      monthlyLimit: 50000,
    },
    {
      providerId: 'telecash',
      providerName: 'TeleCash',
      type: ProviderType.MOBILE_MONEY,
      apiEndpoint: process.env.TELECASH_API_ENDPOINT || 'https://api.telecash.co.zw',
      apiKey: process.env.TELECASH_API_KEY || '',
      apiSecret: process.env.TELECASH_API_SECRET || '',
      isActive: process.env.TELECASH_ENABLED === 'true',
      supportedCurrencies: ['ZWL', 'USD'],
      transactionFees: { topup: 0.02, withdrawal: 0.03, transfer: 0.01, payment: 0.015 },
      dailyLimit: 5000,
      monthlyLimit: 50000,
    },
    {
      providerId: 'onemoney',
      providerName: 'OneMoney',
      type: ProviderType.MOBILE_MONEY,
      apiEndpoint: process.env.ONEMONEY_API_ENDPOINT || 'https://api.onemoney.co.zw',
      apiKey: process.env.ONEMONEY_API_KEY || '',
      apiSecret: process.env.ONEMONEY_API_SECRET || '',
      isActive: process.env.ONEMONEY_ENABLED === 'true',
      supportedCurrencies: ['ZWL', 'USD'],
      transactionFees: { topup: 0.02, withdrawal: 0.03, transfer: 0.01, payment: 0.015 },
      dailyLimit: 5000,
      monthlyLimit: 50000,
    },
  ];
}
