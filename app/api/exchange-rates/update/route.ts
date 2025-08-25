import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../_lib/drizzle";
import { exchangeRates } from "../../../../shared/schema";
import { and, eq } from "drizzle-orm";

const updateExchangeRateSchema = z.object({
  fromCurrency: z.enum(["USD", "EUR", "GBP", "ZAR"]),
  toCurrency: z.enum(["USD", "ZWL", "EUR", "GBP", "ZAR"]),
  rate: z.number().positive("Rate must be positive"),
  source: z.enum(["central_bank", "xe_api", "manual"]).default("manual"),
  validUntil: z.string().datetime().optional(),
});

// Mock exchange rates for demonstration
const MOCK_RATES: Record<string, number> = {
  "USD-ZWL": 1320.00,
  "EUR-USD": 1.09,
  "EUR-ZWL": 1438.80,
  "GBP-USD": 1.27,
  "GBP-ZWL": 1676.40,
  "ZAR-USD": 0.055,
  "ZAR-ZWL": 72.60,
  "USD-USD": 1.00,
  "ZWL-USD": 0.00076,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromCurrency, toCurrency, rate, source, validUntil } = updateExchangeRateSchema.parse(body);

    // Deactivate previous rates for this currency pair
    await db
      .update(exchangeRates)
      .set({ isActive: false })
      .where(
        and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency)
        )
      );

    // Insert new rate
    const newRate = await db
      .insert(exchangeRates)
      .values({
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
        source,
        validUntil: validUntil ? new Date(validUntil) : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      rate: newRate[0],
    });
  } catch (error) {
    console.error("Update exchange rate error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update exchange rate" },
      { status: 500 }
    );
  }
}

// Seed default exchange rates
export async function GET() {
  try {
    const existingRates = await db.select().from(exchangeRates).limit(1);
    
    if (existingRates.length === 0) {
      // Seed with mock rates
      const ratesToInsert = Object.entries(MOCK_RATES).map(([pair, rate]) => {
        const [fromCurrency, toCurrency] = pair.split("-");
        return {
          fromCurrency,
          toCurrency,
          rate: rate.toString(),
          source: "manual" as const,
        };
      });

      await db.insert(exchangeRates).values(ratesToInsert);

      return NextResponse.json({
        success: true,
        message: "Exchange rates seeded successfully",
        rates: ratesToInsert.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Exchange rates already exist",
    });
  } catch (error) {
    console.error("Seed exchange rates error:", error);
    return NextResponse.json(
      { error: "Failed to seed exchange rates" },
      { status: 500 }
    );
  }
}