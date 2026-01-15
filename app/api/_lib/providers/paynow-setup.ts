/**
 * Paynow Provider Setup
 * Initializes and registers the Paynow provider with the provider registry
 */

import { PaynowProvider } from './paynow-provider';
import { PAYNOW_CONFIG, validatePaynowConfig } from './paynow-config';
import { providerRegistry, ProviderType } from '../provider-integration';

/**
 * Initialize Paynow Provider
 */
export async function initializePaynowProvider(): Promise<void> {
  try {
    // Validate configuration
    if (!validatePaynowConfig()) {
      throw new Error('Paynow configuration validation failed');
    }

    // Ensure the config has the correct type
    const config = {
      ...PAYNOW_CONFIG,
      type: ProviderType.CARD_PROCESSOR as any, // Paynow is a payment gateway/card processor
    };

    // Create provider instance
    const paynowProvider = new PaynowProvider(config);

    // Initialize provider
    await paynowProvider.initialize();

    // Register with provider registry
    providerRegistry.registerProvider(config, paynowProvider);

    console.log('✅ Paynow provider successfully initialized and registered');
  } catch (error) {
    console.error('❌ Failed to initialize Paynow provider:', error);
    throw error;
  }
}

/**
 * Get Paynow Provider Instance
 */
export function getPaynowProvider(): PaynowProvider | undefined {
  return providerRegistry.getProvider('paynow') as PaynowProvider | undefined;
}

/**
 * Check if Paynow is available
 */
export function isPaynowAvailable(): boolean {
  const provider = getPaynowProvider();
  return provider !== undefined;
}

/**
 * Reinitialize Paynow Provider (useful for credential updates)
 */
export async function reinitializePaynowProvider(): Promise<void> {
  try {
    // Remove existing provider
    const existingProvider = getPaynowProvider();
    if (existingProvider) {
      console.log('Removing existing Paynow provider...');
    }

    // Reinitialize
    await initializePaynowProvider();
    console.log('✅ Paynow provider reinitialized');
  } catch (error) {
    console.error('❌ Failed to reinitialize Paynow provider:', error);
    throw error;
  }
}
