import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for boarding request
const boardingValidationSchema = z.object({
  ticketNumber: z.string().min(1),
  qrData: z.string().min(1),
  timestamp: z.string().optional(),
  deviceId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = boardingValidationSchema.parse(body)
    
    // Extract ticket data from QR code
    const qrData = validatedData.qrData
    const ticketNumber = validatedData.ticketNumber
    
    // Parse QR data (format: "PAYPASS_TICKET:{ticketNumber}:{timestamp}:{validUntil}")
    const qrParts = qrData.split(':')
    
    if (qrParts.length < 4 || qrParts[0] !== 'PAYPASS_TICKET') {
      return NextResponse.json({
        success: false,
        error: 'Invalid QR code format'
      }, { status: 400 })
    }
    
    const [, qrTicketNumber, timestamp, validUntil] = qrParts
    
    // Validate ticket number matches
    if (qrTicketNumber !== ticketNumber) {
      return NextResponse.json({
        success: false,
        error: 'Ticket number mismatch'
      }, { status: 400 })
    }
    
    // Check if ticket is still valid
    const now = new Date()
    const validUntilDate = new Date(validUntil)
    
    if (now > validUntilDate) {
      return NextResponse.json({
        success: false,
        error: 'Ticket has expired'
      }, { status: 400 })
    }
    
    // Check if ticket has already been used (in a real system, this would check a database)
    // For demo purposes, we'll simulate a random validation
    const isAlreadyUsed = Math.random() < 0.1 // 10% chance of being already used
    
    if (isAlreadyUsed) {
      return NextResponse.json({
        success: false,
        error: 'Ticket has already been used'
      }, { status: 400 })
    }
    
    // Return successful boarding validation
    return NextResponse.json({
      success: true,
      message: 'Boarding validated successfully',
      data: {
        ticketNumber,
        boardingTime: now.toISOString(),
        deviceId: validatedData.deviceId || 'unknown',
        status: 'BOARDED'
      }
    })
    
  } catch (error) {
    console.error('Boarding validation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
