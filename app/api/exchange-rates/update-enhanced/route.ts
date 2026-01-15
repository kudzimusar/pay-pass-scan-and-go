import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "../../_lib/drizzle"
import { exchangeRates } from "../../../../shared/schema"
import { eq, and } from "drizzle-orm"

const updateExchangeRateSchema = z.object({
  fromCurrency: z.string().length(3, "Currency code must be 3 characters"),
  toCurrency: z.string().length(3, "Currency code must be 3 characters"),
  rate: z.number().positive("Rate must be positive"),
  source: z.enum(["central_bank", "xe_api", "manual", "open_exchange_rates"]),
  validUntil: z.string().datetime().optional(),
})

/**
 * Enhanced exchange rate update endpoint
 * Supports both manual updates and automated fetching from external APIs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = updateExchangeRateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { fromCurrency, toCurrency, rate, source, validUntil } = validation.data

    // Validate currency codes
    if (!isValidCurrencyCode(fromCurrency) || !isValidCurrencyCode(toCurrency)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid currency code",
        },
        { status: 400 },
      )
    }

    // Prevent self-conversion
    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot create exchange rate for same currency",
        },
        { status: 400 },
      )
    }

    // Deactivate previous rates for this currency pair
    await db
      .update(exchangeRates)
      .set({ isActive: false })
      .where(
        and(
          eq(exchangeRates.fromCurrency, fromCurrency),
          eq(exchangeRates.toCurrency, toCurrency),
          eq(exchangeRates.isActive, true),
        ),
      )

    // Create new exchange rate
    const newRate = await db
      .insert(exchangeRates)
      .values({
        fromCurrency,
        toCurrency,
        rate: rate.toString(),
        source,
        isActive: true,
        validFrom: new Date(),
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
      })
      .returning()

    return NextResponse.json({
      success: true,
      rate: {
        id: newRate[0].id,
        fromCurrency: newRate[0].fromCurrency,
        toCurrency: newRate[0].toCurrency,
        rate: parseFloat(newRate[0].rate),
        source: newRate[0].source,
        validFrom: newRate[0].validFrom,
        validUntil: newRate[0].validUntil,
      },
      message: "Exchange rate updated successfully",
    })
  } catch (error) {
    console.error("Exchange rate update error:", error)
    return NextResponse.json(
      { error: "Failed to update exchange rate" },
      { status: 500 },
    )
  }
}

/**
 * Fetch and update exchange rates from external API
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get("source") || "open_exchange_rates"

    // Fetch rates from external source
    const rates = await fetchExternalExchangeRates(source)

    if (!rates || rates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch rates from ${source}`,
        },
        { status: 500 },
      )
    }

    // Update all rates in the database
    const updatedRates = []
    for (const rate of rates) {
      // Deactivate previous rates
      await db
        .update(exchangeRates)
        .set({ isActive: false })
        .where(
          and(
            eq(exchangeRates.fromCurrency, rate.fromCurrency),
            eq(exchangeRates.toCurrency, rate.toCurrency),
            eq(exchangeRates.isActive, true),
          ),
        )

      // Create new rate
      const newRate = await db
        .insert(exchangeRates)
        .values({
          fromCurrency: rate.fromCurrency,
          toCurrency: rate.toCurrency,
          rate: rate.rate.toString(),
          source,
          isActive: true,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        })
        .returning()

      updatedRates.push({
        fromCurrency: newRate[0].fromCurrency,
        toCurrency: newRate[0].toCurrency,
        rate: parseFloat(newRate[0].rate),
      })
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedRates.length} exchange rates from ${source}`,
      rates: updatedRates,
    })
  } catch (error) {
    console.error("Exchange rate fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch and update exchange rates" },
      { status: 500 },
    )
  }
}

/**
 * Fetch exchange rates from external API
 */
async function fetchExternalExchangeRates(
  source: string,
): Promise<Array<{ fromCurrency: string; toCurrency: string; rate: number }> | null> {
  try {
    switch (source) {
      case "open_exchange_rates":
        return await fetchFromOpenExchangeRates()

      case "xe_api":
        return await fetchFromXeApi()

      case "central_bank":
        return await fetchFromCentralBank()

      default:
        return null
    }
  } catch (error) {
    console.error(`Error fetching rates from ${source}:`, error)
    return null
  }
}

/**
 * Fetch from Open Exchange Rates API
 * Requires OPEN_EXCHANGE_RATES_API_KEY environment variable
 */
async function fetchFromOpenExchangeRates(): Promise<
  Array<{ fromCurrency: string; toCurrency: string; rate: number }>
> {
  const apiKey = process.env.OPEN_EXCHANGE_RATES_API_KEY
  if (!apiKey) {
    throw new Error("OPEN_EXCHANGE_RATES_API_KEY not configured")
  }

  const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${apiKey}&base=USD`)
  const data = await response.json()

  if (!data.rates) {
    throw new Error("Invalid response from Open Exchange Rates")
  }

  // Convert to our format (USD as base)
  const rates: Array<{ fromCurrency: string; toCurrency: string; rate: number }> = []

  const supportedCurrencies = ["USD", "EUR", "GBP", "ZAR", "ZWL", "KES", "NGN", "GHS"]

  for (const targetCurrency of supportedCurrencies) {
    if (targetCurrency !== "USD" && data.rates[targetCurrency]) {
      rates.push({
        fromCurrency: "USD",
        toCurrency: targetCurrency,
        rate: data.rates[targetCurrency],
      })

      // Also add reverse rate
      rates.push({
        fromCurrency: targetCurrency,
        toCurrency: "USD",
        rate: 1 / data.rates[targetCurrency],
      })
    }
  }

  return rates
}

/**
 * Fetch from XE API
 * Requires XE_API_KEY and XE_API_SECRET environment variables
 */
async function fetchFromXeApi(): Promise<
  Array<{ fromCurrency: string; toCurrency: string; rate: number }>
> {
  const apiKey = process.env.XE_API_KEY
  const apiSecret = process.env.XE_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error("XE_API_KEY or XE_API_SECRET not configured")
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")

  const response = await fetch("https://api.xe.com/v1/convert_from/", {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  const data = await response.json()

  if (!data.to) {
    throw new Error("Invalid response from XE API")
  }

  // Convert to our format
  const rates: Array<{ fromCurrency: string; toCurrency: string; rate: number }> = []

  for (const rate of data.to) {
    rates.push({
      fromCurrency: data.from,
      toCurrency: rate.quotecurrency,
      rate: parseFloat(rate.mid),
    })
  }

  return rates
}

/**
 * Fetch from Central Bank (mock implementation)
 * In production, this would fetch from actual central bank APIs
 */
async function fetchFromCentralBank(): Promise<
  Array<{ fromCurrency: string; toCurrency: string; rate: number }>
> {
  // Mock implementation - replace with actual central bank API calls
  // For example, Reserve Bank of Zimbabwe, South African Reserve Bank, etc.

  const rates: Array<{ fromCurrency: string; toCurrency: string; rate: number }> = [
    { fromCurrency: "USD", toCurrency: "ZWL", rate: 15.5 }, // Mock rate
    { fromCurrency: "ZWL", toCurrency: "USD", rate: 1 / 15.5 },
    { fromCurrency: "USD", toCurrency: "ZAR", rate: 18.5 },
    { fromCurrency: "ZAR", toCurrency: "USD", rate: 1 / 18.5 },
  ]

  return rates
}

/**
 * Validate currency code (ISO 4217)
 */
function isValidCurrencyCode(code: string): boolean {
  const validCodes = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "AUD",
    "CAD",
    "CHF",
    "CNY",
    "SEK",
    "NZD",
    "ZAR",
    "ZWL",
    "KES",
    "NGN",
    "GHS",
    "UGX",
    "TZS",
    "ETB",
    "RWF",
    "MWK",
    "ZMW",
    "BWP",
    "NAD",
    "MZN",
    "AOA",
    "CDF",
    "XOF",
    "XAF",
    "EGP",
    "LYD",
    "TND",
    "DZD",
    "MAD",
    "MUR",
    "SCR",
    "KMF",
    "MGA",
    "INR",
    "PKR",
    "BDT",
    "LKR",
    "NPR",
    "BTN",
    "AFN",
    "IRR",
    "IQD",
    "SAR",
    "AED",
    "QAR",
    "KWD",
    "BHD",
    "OMR",
    "YER",
    "JOD",
    "ILS",
    "SYP",
    "TRY",
    "KRW",
    "THB",
    "VND",
    "MYR",
    "SGD",
    "IDR",
    "PHP",
    "BRL",
    "MXN",
    "ARS",
    "CLP",
    "COP",
    "PEN",
    "VEF",
    "ECU",
    "BOB",
    "PYG",
    "UYU",
    "CZK",
    "SKK",
    "HUF",
    "RON",
    "BGN",
    "HRK",
    "SIT",
    "RUB",
    "UAH",
    "BYR",
    "KZT",
    "UZS",
    "TMT",
    "KGS",
    "TJS",
  ]

  return validCodes.includes(code.toUpperCase())
}
