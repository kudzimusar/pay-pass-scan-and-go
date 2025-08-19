import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("route_id")
    const includeStations = searchParams.get("include_stations") === "true"
    const includePricing = searchParams.get("include_pricing") === "true"

    if (routeId) {
      // Get specific route with optional related data
      const route = await sql`
        SELECT * FROM routes 
        WHERE route_id = ${routeId} AND is_active = true
      `

      if (route.length === 0) {
        return NextResponse.json({ error: "Route not found" }, { status: 404 })
      }

      const result: any = route[0]

      if (includeStations) {
        const stations = await sql`
          SELECT * FROM stations 
          WHERE route_id = ${routeId}
          ORDER BY order_on_route ASC
        `
        result.stations = stations
      }

      if (includePricing) {
        const pricingRules = await sql`
          SELECT * FROM pricing_rules 
          WHERE route_id = ${routeId} AND status = 'ACTIVE'
          ORDER BY start_time ASC
        `
        result.pricing_rules = pricingRules
      }

      return NextResponse.json(result)
    } else {
      // Get all active routes with station counts
      const routes = await sql`
        SELECT 
          r.*,
          COUNT(s.station_id) as station_count
        FROM routes r
        LEFT JOIN stations s ON r.route_id = s.route_id
        WHERE r.is_active = true
        GROUP BY r.route_id, r.route_name, r.base_fare_usd, r.base_fare_zig, r.is_active, r.created_at, r.updated_at
        ORDER BY r.route_name ASC
      `

      return NextResponse.json(routes)
    }
  } catch (error) {
    console.error("Error fetching routes:", error)
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      route_id,
      route_name,
      base_fare_usd,
      base_fare_zig,
      start_location_geo,
      end_location_geo,
      stations = [],
      pricing_rules = [],
    } = body

    // Validate required fields
    if (!route_id || !route_name || !base_fare_usd || !base_fare_zig) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Start transaction
    await sql`BEGIN`

    try {
      // Insert route
      await sql`
        INSERT INTO routes (
          route_id, route_name, base_fare_usd, base_fare_zig,
          start_location_geo, end_location_geo, is_active
        ) VALUES (
          ${route_id}, ${route_name}, ${base_fare_usd}, ${base_fare_zig},
          ${start_location_geo}, ${end_location_geo}, true
        )
      `

      // Insert stations if provided
      if (stations.length > 0) {
        for (const station of stations) {
          await sql`
            INSERT INTO stations (
              station_id, route_id, station_name, order_on_route,
              station_geo, fare_multiplier, geofence_radius
            ) VALUES (
              ${station.station_id}, ${route_id}, ${station.station_name},
              ${station.order_on_route}, ${station.station_geo || null},
              ${station.fare_multiplier || 1.0}, ${station.geofence_radius || 100}
            )
          `
        }
      }

      // Insert pricing rules if provided
      if (pricing_rules.length > 0) {
        for (const rule of pricing_rules) {
          await sql`
            INSERT INTO pricing_rules (
              rule_id, route_id, rule_name, day_of_week, start_time, end_time,
              fare_adjustment_type, fare_adjustment_value_usd, fare_adjustment_value_zig,
              status
            ) VALUES (
              ${rule.rule_id}, ${route_id}, ${rule.rule_name}, ${rule.day_of_week || "ALL"},
              ${rule.start_time}, ${rule.end_time}, ${rule.fare_adjustment_type || "FLAT_ADDITION"},
              ${rule.fare_adjustment_value_usd || 0}, ${rule.fare_adjustment_value_zig || 0},
              ${rule.status || "ACTIVE"}
            )
          `
        }
      }

      await sql`COMMIT`

      return NextResponse.json(
        {
          message: "Route created successfully",
          route_id,
        },
        { status: 201 },
      )
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error creating route:", error)
    return NextResponse.json({ error: "Failed to create route" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { route_id, ...updates } = body

    if (!route_id) {
      return NextResponse.json({ error: "Route ID is required" }, { status: 400 })
    }

    // Build dynamic update query
    const updateFields = []
    const values = []

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== "route_id") {
        updateFields.push(`${key} = $${updateFields.length + 1}`)
        values.push(value)
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    values.push(route_id) // Add route_id as last parameter

    const query = `
      UPDATE routes 
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE route_id = $${values.length}
    `

    const result = await sql.unsafe(query, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Route updated successfully",
      route_id,
    })
  } catch (error) {
    console.error("Error updating route:", error)
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get("route_id")

    if (!routeId) {
      return NextResponse.json({ error: "Route ID is required" }, { status: 400 })
    }

    // Soft delete by setting is_active to false
    const result = await sql`
      UPDATE routes 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE route_id = ${routeId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "Route deleted successfully",
      route_id: routeId,
    })
  } catch (error) {
    console.error("Error deleting route:", error)
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 })
  }
}
