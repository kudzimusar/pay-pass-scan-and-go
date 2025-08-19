import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

interface ConductorLoginRequest {
  conductor_id: string
  pin: string
  route_id?: string
  bus_id?: string
}

interface TicketVerificationRequest {
  qr_ticket_code: string
  conductor_id: string
  action: "SCAN" | "CONFIRM_BOARDING" | "CONFIRM_DROPOFF" | "CHANGE_DROPOFF"
  additional_data?: {
    new_station_id?: string
    additional_fare?: number
    notes?: string
  }
}

// POST endpoint for conductor login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "LOGIN") {
      return await handleConductorLogin(body)
    } else if (action === "VERIFY_TICKET") {
      return await handleTicketVerification(body)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in conductor verify:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function handleConductorLogin(body: ConductorLoginRequest) {
  const { conductor_id, pin, route_id, bus_id } = body

  // Validate required fields
  if (!conductor_id || !pin) {
    return NextResponse.json({ error: "Missing conductor_id or pin" }, { status: 400 })
  }

  // Demo conductor validation (in real app, this would check against conductor table)
  const demoConductors = [
    { id: "COND_001", pin: "1234", name: "John Conductor", routes: ["HAR-CBD-AVENUE"] },
    { id: "COND_002", pin: "5678", name: "Mary Conductor", routes: ["HAR-CBD-BORROWDALE"] },
  ]

  const conductor = demoConductors.find((c) => c.id === conductor_id && c.pin === pin)

  if (!conductor) {
    return NextResponse.json({ error: "Invalid conductor credentials" }, { status: 401 })
  }

  // Check if conductor is already logged in
  const existingSessions = await sql`
    SELECT * FROM conductor_sessions 
    WHERE conductor_id = ${conductor_id} AND is_active = true
  `

  // End any existing sessions
  if (existingSessions.length > 0) {
    await sql`
      UPDATE conductor_sessions 
      SET is_active = false, shift_end = CURRENT_TIMESTAMP
      WHERE conductor_id = ${conductor_id} AND is_active = true
    `
  }

  // Create new session
  const session_id = `SESS_${conductor_id}_${Date.now()}`
  const assigned_route = route_id || conductor.routes[0] // Use provided route or default

  await sql`
    INSERT INTO conductor_sessions (
      session_id, conductor_id, conductor_name, route_id, bus_id, is_active
    ) VALUES (
      ${session_id}, ${conductor_id}, ${conductor.name}, ${assigned_route}, ${bus_id || "BUS_001"}, true
    )
  `

  return NextResponse.json({
    success: true,
    message: "Login successful",
    session: {
      session_id,
      conductor_id,
      conductor_name: conductor.name,
      route_id: assigned_route,
      bus_id: bus_id || "BUS_001",
      login_time: new Date().toISOString(),
    },
  })
}

async function handleTicketVerification(body: TicketVerificationRequest) {
  const { qr_ticket_code, conductor_id, action, additional_data } = body

  // Validate required fields
  if (!qr_ticket_code || !conductor_id || !action) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Verify conductor session is active
  const sessions = await sql`
    SELECT * FROM conductor_sessions 
    WHERE conductor_id = ${conductor_id} AND is_active = true
  `

  if (sessions.length === 0) {
    return NextResponse.json({ error: "Conductor session not found or inactive" }, { status: 401 })
  }

  const session = sessions[0]

  // Get ticket details with route and station information
  const tickets = await sql`
    SELECT 
      rt.*,
      r.route_name,
      s.station_name,
      s.order_on_route
    FROM route_transactions rt
    JOIN routes r ON rt.route_id = r.route_id
    JOIN stations s ON rt.station_id = s.station_id
    WHERE rt.qr_ticket_code = ${qr_ticket_code}
  `

  if (tickets.length === 0) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const ticket = tickets[0]

  // Verify ticket is for conductor's route
  if (ticket.route_id !== session.route_id) {
    return NextResponse.json({ error: "Ticket is not valid for this route" }, { status: 400 })
  }

  // Handle different actions
  switch (action) {
    case "SCAN":
      // Just return ticket details for display
      return NextResponse.json({
        success: true,
        action: "SCAN",
        ticket: {
          ...ticket,
          user_name: "Demo User", // In real app, get from user table
          user_phone: "+263771234567",
        },
      })

    case "CONFIRM_BOARDING":
      if (ticket.boarding_confirmed) {
        return NextResponse.json({ error: "Passenger already boarded" }, { status: 400 })
      }

      // Update ticket to confirm boarding
      await sql`
        UPDATE route_transactions 
        SET boarding_confirmed = true, boarding_time = CURRENT_TIMESTAMP, conductor_id = ${conductor_id}
        WHERE qr_ticket_code = ${qr_ticket_code}
      `

      return NextResponse.json({
        success: true,
        action: "CONFIRM_BOARDING",
        message: "Boarding confirmed successfully",
        ticket: {
          ...ticket,
          boarding_confirmed: true,
          boarding_time: new Date().toISOString(),
          conductor_id,
        },
      })

    case "CONFIRM_DROPOFF":
      if (!ticket.boarding_confirmed) {
        return NextResponse.json({ error: "Passenger must board first" }, { status: 400 })
      }

      if (ticket.dropoff_confirmed) {
        return NextResponse.json({ error: "Drop-off already confirmed" }, { status: 400 })
      }

      // Update ticket to confirm drop-off
      const actualStation = additional_data?.new_station_id || ticket.station_id
      await sql`
        UPDATE route_transactions 
        SET dropoff_confirmed = true, dropoff_time = CURRENT_TIMESTAMP, actual_dropoff_station = ${actualStation}
        WHERE qr_ticket_code = ${qr_ticket_code}
      `

      return NextResponse.json({
        success: true,
        action: "CONFIRM_DROPOFF",
        message: "Drop-off confirmed successfully",
        ticket: {
          ...ticket,
          dropoff_confirmed: true,
          dropoff_time: new Date().toISOString(),
          actual_dropoff_station: actualStation,
        },
      })

    case "CHANGE_DROPOFF":
      if (ticket.dropoff_confirmed) {
        return NextResponse.json({ error: "Cannot change drop-off after confirmation" }, { status: 400 })
      }

      if (!additional_data?.new_station_id) {
        return NextResponse.json({ error: "New station ID required for drop-off change" }, { status: 400 })
      }

      // Verify new station exists on the route
      const newStations = await sql`
        SELECT * FROM stations 
        WHERE station_id = ${additional_data.new_station_id} AND route_id = ${ticket.route_id}
      `

      if (newStations.length === 0) {
        return NextResponse.json({ error: "New station not found on this route" }, { status: 400 })
      }

      // Calculate additional fare if needed (simplified logic)
      const additionalFare = additional_data?.additional_fare || 0

      // Update ticket with new drop-off station
      await sql`
        UPDATE route_transactions 
        SET station_id = ${additional_data.new_station_id}, 
            total_fare = total_fare + ${additionalFare}
        WHERE qr_ticket_code = ${qr_ticket_code}
      `

      return NextResponse.json({
        success: true,
        action: "CHANGE_DROPOFF",
        message: "Drop-off location updated successfully",
        ticket: {
          ...ticket,
          station_id: additional_data.new_station_id,
          station_name: newStations[0].station_name,
          total_fare: ticket.total_fare + additionalFare,
          additional_fare: additionalFare,
        },
      })

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }
}

// GET endpoint to retrieve conductor session info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conductor_id = searchParams.get("conductor_id")
    const action = searchParams.get("action")

    if (!conductor_id) {
      return NextResponse.json({ error: "Conductor ID is required" }, { status: 400 })
    }

    if (action === "session") {
      // Get active session
      const sessions = await sql`
        SELECT 
          cs.*,
          r.route_name
        FROM conductor_sessions cs
        JOIN routes r ON cs.route_id = r.route_id
        WHERE cs.conductor_id = ${conductor_id} AND cs.is_active = true
      `

      if (sessions.length === 0) {
        return NextResponse.json({ error: "No active session found" }, { status: 404 })
      }

      return NextResponse.json(sessions[0])
    } else if (action === "manifest") {
      // Get passenger manifest for conductor's current route
      const sessions = await sql`
        SELECT route_id FROM conductor_sessions 
        WHERE conductor_id = ${conductor_id} AND is_active = true
      `

      if (sessions.length === 0) {
        return NextResponse.json({ error: "No active session found" }, { status: 404 })
      }

      const route_id = sessions[0].route_id

      // Get all passengers currently on this route
      const manifest = await sql`
        SELECT 
          rt.transaction_id,
          rt.qr_ticket_code,
          rt.total_fare,
          rt.currency,
          rt.boarding_confirmed,
          rt.dropoff_confirmed,
          rt.boarding_time,
          rt.dropoff_time,
          s.station_name as destination,
          s.order_on_route
        FROM route_transactions rt
        JOIN stations s ON rt.station_id = s.station_id
        WHERE rt.route_id = ${route_id}
        AND rt.payment_status = 'PAID'
        AND rt.boarding_confirmed = true
        AND rt.dropoff_confirmed = false
        AND DATE(rt.created_at) = CURRENT_DATE
        ORDER BY rt.boarding_time ASC
      `

      return NextResponse.json({
        route_id,
        passenger_count: manifest.length,
        passengers: manifest,
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in conductor GET:", error)
    return NextResponse.json({ error: "Failed to retrieve conductor information" }, { status: 500 })
  }
}

// PUT endpoint to update conductor session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { conductor_id, action, location } = body

    if (!conductor_id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    switch (action) {
      case "LOGOUT":
        // End conductor session
        await sql`
          UPDATE conductor_sessions 
          SET is_active = false, shift_end = CURRENT_TIMESTAMP
          WHERE conductor_id = ${conductor_id} AND is_active = true
        `

        return NextResponse.json({
          success: true,
          message: "Logout successful",
        })

      case "UPDATE_LOCATION":
        if (!location) {
          return NextResponse.json({ error: "Location data required" }, { status: 400 })
        }

        // Update conductor location
        await sql`
          UPDATE conductor_sessions 
          SET current_location = ${location}, last_ping = CURRENT_TIMESTAMP
          WHERE conductor_id = ${conductor_id} AND is_active = true
        `

        return NextResponse.json({
          success: true,
          message: "Location updated successfully",
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error updating conductor session:", error)
    return NextResponse.json({ error: "Failed to update conductor session" }, { status: 500 })
  }
}
