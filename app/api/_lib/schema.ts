import { z } from "zod"

// Existing schemas...
export const loginSchema = z.object({
  phone: z.string().min(9, "Phone number must be at least 9 digits").max(13, "Phone number is too long"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(6, "PIN must be at most 6 digits"),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().min(9, "Phone number must be at least 9 digits").max(13, "Phone number is too long"),
  email: z.string().email("Invalid email address"),
  pin: z.string().min(4, "PIN must be at least 4 digits").max(6, "PIN must be at most 6 digits"),
})

export const paymentSchema = z.object({
  routeId: z.string(),
  amount: z.string(),
  currency: z.enum(["USD", "ZWL"]),
  paymentMethod: z.string().optional(),
})

export const topupSchema = z.object({
  amount: z.string(),
  currency: z.enum(["USD", "ZWL"]),
  method: z.enum(["ecocash", "telecash", "bank_transfer"]),
})

export const operatorRouteSchema = z.object({
  name: z.string().min(2),
  fareUSD: z.number().min(0),
  fareZWL: z.number().min(0),
})

// New schemas for Request-to-Pay feature
export const sendPaymentRequestSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0").max(1000, "Amount cannot exceed $1000"),
  currency: z.enum(["USD", "ZWL"]).default("USD"),
  billType: z.enum(["Bus Ticket", "Groceries", "Utility Bill", "Shared Ride", "Other"]),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
})

export const respondToRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  action: z.enum(["accept", "decline"]),
  pin: z.string().min(4, "PIN is required").optional(), // Required for accept
})

export const userSearchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
})
