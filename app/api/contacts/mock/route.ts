import { type NextRequest, NextResponse } from "next/server"

// In-memory mock contacts storage
const mockContacts: Array<{
  id: string
  name: string
  phone: string
  email: string
  addedAt: Date
}> = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email } = body

    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 })
    }

    if (!phone || phone.trim() === "") {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 })
    }

    // Phone validation (basic format check)
    const phoneRegex = /^\+?[\d\s\-$$$$]{10,}$/
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid phone number format. Please use format: +263771234567",
        },
        { status: 400 },
      )
    }

    // Email validation (if provided)
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email format",
          },
          { status: 400 },
        )
      }
    }

    // Check for duplicates
    const existingContact = mockContacts.find(
      (contact) => contact.phone === phone.trim() || (email && contact.email === email.trim()),
    )

    if (existingContact) {
      return NextResponse.json(
        {
          success: false,
          error: "Contact with this phone number or email already exists",
        },
        { status: 400 },
      )
    }

    // Create new contact
    const newContact = {
      id: `contact_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      addedAt: new Date(),
    }

    mockContacts.push(newContact)

    return NextResponse.json({
      success: true,
      message: "Contact added successfully",
      contact: newContact,
    })
  } catch (error) {
    console.error("Add mock contact error:", error)
    return NextResponse.json({ success: false, error: "Failed to add contact" }, { status: 500 })
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      contacts: mockContacts.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime()),
    })
  } catch (error) {
    console.error("Get mock contacts error:", error)
    return NextResponse.json({ success: false, error: "Failed to get contacts" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get("id")

    if (!contactId) {
      return NextResponse.json({ success: false, error: "Contact ID is required" }, { status: 400 })
    }

    const contactIndex = mockContacts.findIndex((contact) => contact.id === contactId)
    if (contactIndex === -1) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 })
    }

    mockContacts.splice(contactIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully",
    })
  } catch (error) {
    console.error("Delete mock contact error:", error)
    return NextResponse.json({ success: false, error: "Failed to delete contact" }, { status: 500 })
  }
}
