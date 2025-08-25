import { NextRequest, NextResponse } from "next/server";
import { db } from "../../_lib/drizzle";
import { exchangeRates } from "../../../../shared/schema";
import { and, eq, desc, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get("from");
    const toCurrency = searchParams.get("to");

    if (fromCurrency && toCurrency) {
      // Get specific exchange rate
      const rate = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrency, fromCurrency),
            eq(exchangeRates.toCurrency, toCurrency),
            eq(exchangeRates.isActive, true)
          )
        )
        .orderBy(desc(exchangeRates.createdAt))
        .limit(1);

      if (!rate.length) {
        return NextResponse.json(
          { error: `Exchange rate not found for ${fromCurrency} to ${toCurrency}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        rate: rate[0],
      });
    }

    // Get all current exchange rates
    const rates = await db
      .select()
      .from(exchangeRates)
      .where(
        and(
          eq(exchangeRates.isActive, true),
          gte(exchangeRates.validFrom, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        )
      )
      .orderBy(desc(exchangeRates.createdAt));

    // Group by currency pair and get the latest rate for each
    const latestRates = rates.reduce((acc, rate) => {
      const key = `${rate.fromCurrency}-${rate.toCurrency}`;
      if (!acc[key] || new Date(rate.createdAt) > new Date(acc[key].createdAt)) {
        acc[key] = rate;
      }
      return acc;
    }, {} as Record<string, typeof rates[0]>);

    return NextResponse.json({
      success: true,
      rates: Object.values(latestRates),
      count: Object.keys(latestRates).length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Exchange rates error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve exchange rates" },
      { status: 500 }
    );
  }
}