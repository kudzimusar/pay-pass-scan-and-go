/**
 * Provider Status Endpoint
 * Returns the status and capabilities of all available payment providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { providerRegistry, ProviderType } from '../../_lib/provider-integration';

export async function GET(request: NextRequest) {
  try {
    const providers = providerRegistry.getAllProviders();
    const mobileMoneyProviders = providerRegistry.getProvidersByType(ProviderType.MOBILE_MONEY);

    const providerStatus = mobileMoneyProviders.map((provider) => {
      const config = providerRegistry.getConfig(provider.constructor.name.replace('Provider', '').toLowerCase());
      return {
        providerId: config?.providerId,
        providerName: config?.providerName,
        type: config?.type,
        isActive: config?.isActive,
        supportedCurrencies: config?.supportedCurrencies,
        transactionFees: config?.transactionFees,
        limits: {
          daily: config?.dailyLimit,
          monthly: config?.monthlyLimit,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Provider status retrieved successfully',
        data: {
          totalProviders: providers.length,
          activeProviders: mobileMoneyProviders.length,
          providers: providerStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Provider status error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve provider status',
      },
      { status: 500 }
    );
  }
}
