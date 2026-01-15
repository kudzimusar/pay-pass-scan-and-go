import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "../../_lib/drizzle"
import { identityVerifications, users } from "../../../../shared/schema"
import { eq } from "drizzle-orm"

const submitIdentitySchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  documentType: z.enum(["passport", "national_id", "drivers_license"]),
  documentNumber: z.string().min(5, "Document number is required"),
  documentCountry: z.string().length(2, "Country code must be 2 characters"),
  documentExpiry: z.string().datetime().optional(),
  frontImageUrl: z.string().url("Invalid front image URL"),
  backImageUrl: z.string().url("Invalid back image URL").optional(),
  selfieUrl: z.string().url("Invalid selfie URL"),
})

/**
 * Enhanced KYC submission endpoint with automated validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = submitIdentitySchema.safeParse(body)

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

    const {
      userId,
      documentType,
      documentNumber,
      documentCountry,
      documentExpiry,
      frontImageUrl,
      backImageUrl,
      selfieUrl,
    } = validation.data

    // Verify user exists
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user already has pending or verified verification
    const existingVerification = await db
      .select()
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, userId))
      .limit(1)

    if (existingVerification.length > 0) {
      const status = existingVerification[0].status

      if (status === "verified") {
        return NextResponse.json(
          { error: "Identity already verified" },
          { status: 409 },
        )
      }

      if (status === "pending") {
        return NextResponse.json(
          { error: "Verification already pending review" },
          { status: 409 },
        )
      }
    }

    // Perform automated validation checks
    const automatedChecks = performAutomatedKycChecks({
      documentType,
      documentNumber,
      documentCountry,
      documentExpiry,
    })

    if (!automatedChecks.passed) {
      return NextResponse.json(
        {
          success: false,
          error: "KYC validation failed",
          details: automatedChecks.failures,
        },
        { status: 400 },
      )
    }

    // Create identity verification record
    const verification = await db
      .insert(identityVerifications)
      .values({
        userId,
        documentType,
        documentNumber,
        documentCountry,
        documentExpiry: documentExpiry ? new Date(documentExpiry) : null,
        frontImageUrl,
        backImageUrl,
        selfieUrl,
        status: "pending",
        verificationMethod: "manual",
      })
      .returning()

    // Update user KYC status to pending if not already set
    if (user[0].kycStatus !== "verified") {
      await db
        .update(users)
        .set({ kycStatus: "pending" })
        .where(eq(users.id, userId))
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: verification[0].id,
        status: verification[0].status,
        documentType: verification[0].documentType,
        createdAt: verification[0].createdAt,
        automatedChecks: {
          passed: automatedChecks.passed,
          checks: automatedChecks.checks,
        },
      },
      message:
        "Identity verification submitted successfully. Review typically takes 1-3 business days.",
    })
  } catch (error) {
    console.error("Submit identity verification error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "Failed to submit identity verification" },
      { status: 500 },
    )
  }
}

/**
 * Perform automated KYC checks
 */
function performAutomatedKycChecks(data: {
  documentType: string
  documentNumber: string
  documentCountry: string
  documentExpiry?: string
}): {
  passed: boolean
  failures: string[]
  checks: Record<string, boolean>
} {
  const failures: string[] = []
  const checks: Record<string, boolean> = {}

  // Check 1: Document number format
  checks.documentNumberFormat = validateDocumentNumberFormat(data.documentType, data.documentNumber)
  if (!checks.documentNumberFormat) {
    failures.push(`Invalid ${data.documentType} number format`)
  }

  // Check 2: Document expiry
  if (data.documentExpiry) {
    checks.documentNotExpired = validateDocumentExpiry(data.documentExpiry)
    if (!checks.documentNotExpired) {
      failures.push("Document has expired")
    }
  } else {
    checks.documentNotExpired = true
  }

  // Check 3: Country code validity
  checks.validCountryCode = validateCountryCode(data.documentCountry)
  if (!checks.validCountryCode) {
    failures.push("Invalid country code")
  }

  // Check 4: Supported document type
  checks.supportedDocumentType = ["passport", "national_id", "drivers_license"].includes(data.documentType)
  if (!checks.supportedDocumentType) {
    failures.push("Unsupported document type")
  }

  return {
    passed: failures.length === 0,
    failures,
    checks,
  }
}

/**
 * Validate document number format based on document type
 */
function validateDocumentNumberFormat(documentType: string, documentNumber: string): boolean {
  switch (documentType) {
    case "passport":
      // Passport numbers are typically 6-9 alphanumeric characters
      return /^[A-Z0-9]{6,9}$/.test(documentNumber)

    case "national_id":
      // National IDs vary by country, but typically 8-12 digits
      return /^[A-Z0-9]{8,12}$/.test(documentNumber)

    case "drivers_license":
      // Driver's license numbers vary, typically 6-10 alphanumeric
      return /^[A-Z0-9]{6,10}$/.test(documentNumber)

    default:
      return false
  }
}

/**
 * Validate document expiry date
 */
function validateDocumentExpiry(expiryDateStr: string): boolean {
  try {
    const expiryDate = new Date(expiryDateStr)
    const today = new Date()

    // Document is valid if expiry date is in the future
    return expiryDate > today
  } catch {
    return false
  }
}

/**
 * Validate country code (ISO 3166-1 alpha-2)
 */
function validateCountryCode(countryCode: string): boolean {
  // Common ISO country codes
  const validCountryCodes = [
    "US",
    "GB",
    "CA",
    "AU",
    "ZA",
    "ZW",
    "KE",
    "NG",
    "GH",
    "UG",
    "TZ",
    "ET",
    "RW",
    "MW",
    "ZM",
    "BW",
    "NA",
    "MZ",
    "AO",
    "CD",
    "CG",
    "CM",
    "CI",
    "GA",
    "SN",
    "BJ",
    "BF",
    "ML",
    "NE",
    "TD",
    "SO",
    "DJ",
    "ER",
    "SD",
    "SS",
    "EG",
    "LY",
    "TN",
    "DZ",
    "MA",
    "MU",
    "SC",
    "KM",
    "MG",
    "IN",
    "PK",
    "BD",
    "LK",
    "NP",
    "BT",
    "AF",
    "IR",
    "IQ",
    "SA",
    "AE",
    "QA",
    "KW",
    "BH",
    "OM",
    "YE",
    "JO",
    "IL",
    "PS",
    "LB",
    "SY",
    "TR",
    "CN",
    "JP",
    "KR",
    "TH",
    "VN",
    "MY",
    "SG",
    "ID",
    "PH",
    "BR",
    "MX",
    "AR",
    "CL",
    "CO",
    "PE",
    "VE",
    "EC",
    "BO",
    "PY",
    "UY",
    "FR",
    "DE",
    "IT",
    "ES",
    "PT",
    "NL",
    "BE",
    "CH",
    "AT",
    "SE",
    "NO",
    "DK",
    "FI",
    "PL",
    "CZ",
    "SK",
    "HU",
    "RO",
    "BG",
    "HR",
    "SI",
    "GR",
    "RU",
    "UA",
    "BY",
    "KZ",
    "UZ",
    "TM",
    "KG",
    "TJ",
  ]

  return validCountryCodes.includes(countryCode.toUpperCase())
}

/**
 * GET endpoint to check KYC status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      )
    }

    // Get user's KYC status
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

    if (!user.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get identity verification records
    const verifications = await db
      .select()
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, userId))

    return NextResponse.json({
      success: true,
      kycStatus: user[0].kycStatus,
      verifications: verifications.map((v) => ({
        id: v.id,
        documentType: v.documentType,
        status: v.status,
        createdAt: v.createdAt,
        verifiedAt: v.verifiedAt,
      })),
    })
  } catch (error) {
    console.error("Get KYC status error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve KYC status" },
      { status: 500 },
    )
  }
}
