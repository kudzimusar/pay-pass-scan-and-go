import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface FareCalculationRequest {
  route_id: string
  station_id: string
  currency: "USD" | "ZIG"
  journey_time?: string // HH:MM format
  journey_date?: string // YYYY-MM-DD format
}

interface PricingRule {
  rule_id: string
  rule_name: string
  start_time: string
  end_time: string
  day_of_week: string
  fare_adjustment_type: "PERCENTAGE" | "FLAT_ADDITION"
  fare_adjustment_value_usd: number
  fare_adjustment_value_zig: number
}

export async function POST(request: NextRequest) {
  try {
    const body: FareCalculationRequest = await request.json()
    const { route_id, station_id, currency, journey_time, journey_date } = body

    // Validate required fields
    if (!route_id || !station_id || !currency) {
      return NextResponse.json({ error: "Missing required fields: route_id, station_id, currency" }, { status: 400 })
    }

    // Get route information
    const routes = await sql`
      SELECT * FROM routes 
      WHERE route_id = ${route_id} AND is_active = true
    `

    if (routes.length === 0) {
      return NextResponse.json({ error: "Route not found or inactive" }, { status: 404 })
    }

    const route = routes[0]

    // Get station information
    const stations = await sql`
      SELECT * FROM stations 
      WHERE station_id = ${station_id} AND route_id = ${route_id}
    `

    if (stations.length === 0) {
      return NextResponse.json({ error: "Station not found on this route" }, { status: 404 })
    }

    const station = stations[0]

    // Get base fare
    const baseFare = currency === "USD" ? route.base_fare_usd : route.base_fare_zig

    // Apply station fare multiplier
    const adjustedBaseFare = baseFare * station.fare_multiplier

    // Determine journey time and date
    const currentTime = journey_time || new Date().toTimeString().slice(0, 5)
    const currentDate = journey_date || new Date().toISOString().slice(0, 10)
    const dayOfWeek = new Date(currentDate).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()

    // Get applicable pricing rules
    const pricingRules = (await sql`
      SELECT * FROM pricing_rules
      WHERE route_id = ${route_id}
      AND status = 'ACTIVE'
      AND (day_of_week = 'ALL' OR day_of_week = ${dayOfWeek})
      AND ${currentTime} BETWEEN start_time AND end_time
      ORDER BY start_time ASC
    `) as PricingRule[]

    // Calculate surcharges
    let totalSurcharge = 0
    const appliedRules = []

    for (const rule of pricingRules) {
      let surcharge = 0

      if (rule.fare_adjustment_type === "FLAT_ADDITION") {
        surcharge = currency === "USD" ? rule.fare_adjustment_value_usd : rule.fare_adjustment_value_zig
      } else if (rule.fare_adjustment_type === "PERCENTAGE") {
        const percentage = currency === "USD" ? rule.fare_adjustment_value_usd : rule.fare_adjustment_value_zig
        surcharge = adjustedBaseFare * (percentage / 100)
      }

      totalSurcharge += surcharge
      appliedRules.push({
        rule_id: rule.rule_id,
        rule_name: rule.rule_name,
        adjustment_type: rule.fare_adjustment_type,
        surcharge: surcharge,
        time_range: `${rule.start_time}-${rule.end_time}`,
      })
    }

    // Calculate total fare
    const totalFare = adjustedBaseFare + totalSurcharge

    // Prepare response
    const fareCalculation = {
      route_id,
      route_name: route.route_name,
      station_id,
      station_name: station.station_name,
      currency,
      base_fare: baseFare,
      station_multiplier: station.fare_multiplier,
      adjusted_base_fare: adjustedBaseFare,
      total_surcharge: totalSurcharge,
      total_fare: Math.round(totalFare * 100) / 100, // Round to 2 decimal places
      applied_rules: appliedRules,
      calculation_time: new Date().toISOString(),
      journey_time: currentTime,
      journey_date: currentDate,
      day_of_week: dayOfWeek,
    }

    return NextResponse.json(fareCalculation)
  } catch (error) {
    console.error("Error calculating fare:", error)
    return NextResponse.json({ error: "Failed to calculate fare" }, { status: 500 })
  }
}

// GET endpoint for fare estimation (without creating a transaction)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const route_id = searchParams.get("route_id")
    const station_id = searchParams.get("station_id")
    const currency = searchParams.get("currency") as "USD" | "ZIG"
    const journey_time = searchParams.get("journey_time")

    if (!route_id || !station_id || !currency) {
      return NextResponse.json(
        { error: "Missing required parameters: route_id, station_id, currency" },
        { status: 400 },
      )
    }

    // Use the same calculation logic as POST
    const body = { route_id, station_id, currency, journey_time }
    const mockRequest = {
      json: async () => body,
    } as NextRequest

    return await POST(mockRequest)
  } catch (error) {
    console.error("Error estimating fare:", error)
    return NextResponse.json({ error: "Failed to estimate fare" }, { status: 500 })
  }
}

// Utility function to check if current time falls within peak hours
export async function checkPeakHours(route_id: string, time?: string, date?: string) {
  const currentTime = time || new Date().toTimeString().slice(0, 5)
  const currentDate = date || new Date().toISOString().slice(0, 10)
  const dayOfWeek = new Date(currentDate).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()

  const peakRules = await sql`
    SELECT * FROM pricing_rules
    WHERE route_id = ${route_id}
    AND status = 'ACTIVE'
    AND (day_of_week = 'ALL' OR day_of_week = ${dayOfWeek})
    AND ${currentTime} BETWEEN start_time AND end_time
  `

  return {
    is_peak: peakRules.length > 0,
    active_rules: peakRules,
    current_time: currentTime,
    day_of_week: dayOfWeek,
  }
}
