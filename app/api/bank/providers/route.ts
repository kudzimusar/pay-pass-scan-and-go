import { NextRequest, NextResponse } from "next/server";
import { BankProviderFactory } from "../../_lib/bank-integration";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const currency = searchParams.get("currency");

    // Get available bank providers
    let providers = BankProviderFactory.getAvailableProviders(country || undefined);

    // Filter by currency if specified
    if (currency) {
      providers = providers.filter(provider => 
        provider.supportedCurrencies.includes(currency.toUpperCase())
      );
    }

    // Format response with additional details
    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      country: provider.country,
      supportedCurrencies: provider.supportedCurrencies,
      capabilities: provider.capabilities.map(cap => ({
        type: cap.type,
        cost: cap.cost,
        processingTime: cap.processingTime,
        dailyLimit: cap.dailyLimit,
        monthlyLimit: cap.monthlyLimit,
      })),
      features: {
        instantTransfers: provider.capabilities.some(cap => 
          cap.processingTime === "instant"
        ),
        internationalTransfers: provider.capabilities.some(cap => 
          cap.type === "international_transfer"
        ),
        domesticTransfers: provider.capabilities.some(cap => 
          cap.type === "domestic_transfer"
        ),
        balanceInquiry: provider.capabilities.some(cap => 
          cap.type === "balance_inquiry"
        ),
      },
    }));

    return NextResponse.json({
      success: true,
      providers: formattedProviders,
      count: formattedProviders.length,
      filters: {
        country: country || "all",
        currency: currency || "all",
      },
    });
  } catch (error) {
    console.error("Get bank providers error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve bank providers" },
      { status: 500 }
    );
  }
}