import { z } from "zod"

export const insertUserSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  pin: z.string().min(4),
  email: z.string().email().optional(),
  biometricEnabled: z.boolean().optional(),
})

export const insertOperatorSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  pin: z.string().min(4),
  email: z.string().email().optional(),
})

export const topupSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "ZWL"]),
  method: z.string().min(2),
})

export const paymentSchema = z.object({
  routeId: z.string().uuid(),
  currency: z.enum(["USD", "ZWL"]),
  amount: z.number().positive(),
  paymentMethod: z.string().optional(),
})

export const operatorRouteSchema = z.object({
  name: z.string().min(2),
  fareUSD: z.number().positive(),
  fareZWL: z.number().positive(),
})
