import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { randomBytes } from "crypto"
import { verifyAuthHeader } from "../../_lib/auth"

const sql = neon(process.env.DATABASE_URL!)

interface CreateTicketRequest {
  user_id: string
  route_id: string
  station_id: string
  currency: "USD" | "ZIG"
  journey_time?: string
  payment_method?: string
}

export async function POST(request: NextRequest) {
  const auth = verifyAuthHeader(request.headers.get("authorization"))
  if (!auth || auth.type !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body: CreateTicketRequest = await request.json()
    const { user_id, route_id, station_id, currency, journey_time, payment_method } = body

    // Validate required fields
    if (!user_id || !route_id || !station_id || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate fare using the fare calculation API logic
    const fareResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/fare/calculate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          route_id,
          station_id,
          currency,
          journey_time,
        }),
      },
    )

    if (!fareResponse.ok) {
      return NextResponse.json({ error: "Failed to calculate fare" }, { status: 400 })
    }

    const fareCalculation = await fareResponse.json()

    // Generate unique transaction ID and QR ticket code
    const transaction_id = `TXN_${Date.now()}_${randomBytes(4).toString("hex").toUpperCase()}`
    const qr_ticket_code = `TICKET_${Date.now()}_${randomBytes(6).toString("hex").toUpperCase()}`

    // Start database transaction
    await sql`BEGIN`

    try {
      // Create the route transaction record
      await sql`
        INSERT INTO route_transactions (
          transaction_id, user_id, route_id, station_id, qr_ticket_code,
          base_fare, peak_surcharge, total_fare, currency, payment_status,
          boarding_confirmed, dropoff_confirmed, applied_rules
        ) VALUES (
          ${transaction_id}, ${user_id}, ${route_id}, ${station_id}, ${qr_ticket_code},
          ${fareCalculation.adjusted_base_fare}, ${fareCalculation.total_surcharge}, 
          ${fareCalculation.total_fare}, ${currency}, 'PAID',
          false, false, ${JSON.stringify(fareCalculation.applied_rules)}
        )
      `

      // Deduct the fare from user's wallet balance
      if (currency === "USD") {
        await sql`
          UPDATE wallets 
          SET usd_balance = usd_balance - ${fareCalculation.total_fare},
              updated_at = NOW()
          WHERE user_id = ${user_id}
        `
      } else {
        await sql`
          UPDATE wallets 
          SET zwl_balance = zwl_balance - ${fareCalculation.total_fare},
              updated_at = NOW()
          WHERE user_id = ${user_id}
        `
      }

      await sql`COMMIT`

      // Get user details for the ticket (in real app, this would come from user table)
      const userDetails = {
        name: "Demo User",
        phone: "+263771234567",
      }

      // Prepare ticket response
      const ticket = {
        transaction_id,
        qr_ticket_code,
        user_id,
        user_name: userDetails.name,
        user_phone: userDetails.phone,
        route_id: fareCalculation.route_id,
        route_name: fareCalculation.route_name,
        station_id: fareCalculation.station_id,
        station_name: fareCalculation.station_name,
        base_fare: fareCalculation.adjusted_base_fare,
        peak_surcharge: fareCalculation.total_surcharge,
        total_fare: fareCalculation.total_fare,
        currency,
        payment_status: "PAID",
        boarding_confirmed: false,
        dropoff_confirmed: false,
        applied_rules: fareCalculation.applied_rules,
        created_at: new Date().toISOString(),
        journey_time: fareCalculation.journey_time,
        journey_date: fareCalculation.journey_date,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      }

      return NextResponse.json(
        {
          success: true,
          message: "Ticket created successfully",
          ticket,
        },
        { status: 201 },
      )
    } catch (error) {
      await sql`ROLLBACK`
      throw error
    }
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

// GET endpoint to retrieve ticket by QR code or transaction ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qr_code = searchParams.get("qr_code")
    const transaction_id = searchParams.get("transaction_id")

    if (!qr_code && !transaction_id) {
      return NextResponse.json({ error: "Either qr_code or transaction_id is required" }, { status: 400 })
    }

    let whereClause = ""
    let param = ""

    if (qr_code) {
      whereClause = "rt.qr_ticket_code = $1"
      param = qr_code
    } else {
      whereClause = "rt.transaction_id = $1"
      param = transaction_id!
    }

    // Get ticket with route and station details
    const tickets = await sql`
      SELECT 
        rt.*,
        r.route_name,
        s.station_name
      FROM route_transactions rt
      JOIN routes r ON rt.route_id = r.route_id
      JOIN stations s ON rt.station_id = s.station_id
      WHERE ${sql.unsafe(whereClause, [param])}
    `

    if (tickets.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = tickets[0]

    // Add user details (in real app, this would come from user table)
    const ticketWithUserDetails = {
      ...ticket,
      user_name: "Demo User",
      user_phone: "+263771234567",
    }

    return NextResponse.json(ticketWithUserDetails)
  } catch (error) {
    console.error("Error retrieving ticket:", error)
    return NextResponse.json({ error: "Failed to retrieve ticket" }, { status: 500 })
  }
}

// PUT endpoint to update ticket status (for conductor actions)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { qr_ticket_code, action, conductor_id, additional_data } = body

    if (!qr_ticket_code || !action) {
      return NextResponse.json({ error: "Missing required fields: qr_ticket_code, action" }, { status: 400 })
    }

    const updateFields = []
    const values = []

    switch (action) {
      case "CONFIRM_BOARDING":
        updateFields.push("boarding_confirmed = true", "boarding_time = CURRENT_TIMESTAMP")
        if (conductor_id) {
          updateFields.push(`conductor_id = $${updateFields.length + 1}`)
          values.push(conductor_id)
        }
        break

      case "CONFIRM_DROPOFF":
        updateFields.push("dropoff_confirmed = true", "dropoff_time = CURRENT_TIMESTAMP")
        if (additional_data?.actual_station_id) {
          updateFields.push(`actual_dropoff_station = $${updateFields.length + 1}`)
          values.push(additional_data.actual_station_id)
        }
        break

      case "CHANGE_DROPOFF":
        if (additional_data?.new_station_id) {
          updateFields.push(`station_id = $${updateFields.length + 1}`)
          values.push(additional_data.new_station_id)
        }
        if (additional_data?.additional_fare) {
          updateFields.push(`total_fare = total_fare + $${updateFields.length + 1}`)
          values.push(additional_data.additional_fare)
        }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    values.push(qr_ticket_code) // Add QR code as last parameter

    const query = `
      UPDATE route_transactions 
      SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE qr_ticket_code = $${values.length}
      RETURNING *
    `

    const result = await sql.unsafe(query, values)

    if (result.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${action.toLowerCase().replace("_", " ")} successfully`,
      ticket: result[0],
    })
  } catch (error) {
    console.error("Error updating ticket:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
