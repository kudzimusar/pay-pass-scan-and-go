import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  pin: text("pin").notNull(),
  biometricEnabled: boolean("biometric_enabled").default(false),
  
  // International user support for "Pay for your Friend" USP
  countryCode: text("country_code").notNull().default("ZW"), // ISO country code
  isInternational: boolean("is_international").default(false), // Diaspora user flag
  nationalId: text("national_id"), // For identity verification
  passportNumber: text("passport_number"), // For international users
  
  // KYC/AML fields for cross-border compliance
  kycStatus: text("kyc_status").default("pending"), // 'pending', 'verified', 'rejected'
  kycDocuments: text("kyc_documents"), // JSON array of document URLs
  kycVerifiedAt: timestamp("kyc_verified_at"),
  
  // Enhanced security for international payments
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"), // TOTP secret
  loginAttempts: integer("login_attempts").default(0),
  accountLocked: boolean("account_locked").default(false),
  lastLoginAt: timestamp("last_login_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const operators = pgTable("operators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  pin: text("pin").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  usdBalance: decimal("usd_balance", { precision: 10, scale: 2 }).default("0.00"),
  zwlBalance: decimal("zwl_balance", { precision: 15, scale: 2 }).default("0.00"),
  
  // Multi-currency support for international users
  eurBalance: decimal("eur_balance", { precision: 10, scale: 2 }).default("0.00"),
  gbpBalance: decimal("gbp_balance", { precision: 10, scale: 2 }).default("0.00"),
  zarBalance: decimal("zar_balance", { precision: 10, scale: 2 }).default("0.00"),
  
  // Spending limits for cross-border compliance
  dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("1000.00"),
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).default("10000.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operatorId: varchar("operator_id").references(() => operators.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fareUsd: decimal("fare_usd", { precision: 10, scale: 2 }).notNull(),
  fareZwl: decimal("fare_zwl", { precision: 15, scale: 2 }).notNull(),
  qrCode: text("qr_code").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  operatorId: varchar("operator_id").references(() => operators.id),
  routeId: varchar("route_id").references(() => routes.id),
  type: text("type").notNull(), // 'payment', 'topup', 'send', 'receive', 'cross_border'
  category: text("category").notNull(), // 'bus', 'shop', 'utility', 'transfer', 'friend_payment'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // 'USD', 'ZWL', 'EUR', 'GBP', 'ZAR'
  description: text("description").notNull(),
  status: text("status").default("completed"), // 'pending', 'completed', 'failed', 'compliance_review'
  paymentMethod: text("payment_method"), // 'wallet', 'ecocash', 'telecash', etc.
  reference: text("reference"),
  
  // Cross-border payment fields
  crossBorderPaymentId: varchar("cross_border_payment_id").references(() => crossBorderPayments.id),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Friend/Family Network Management for "Pay for your Friend" USP
export const friendNetworks = pgTable("friend_networks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(), // Diaspora user
  recipientId: varchar("recipient_id").references(() => users.id).notNull(), // Local friend/family
  relationship: text("relationship").notNull(), // 'family', 'friend', 'business'
  nickname: text("nickname"), // Custom name for recipient
  isVerified: boolean("is_verified").default(false), // Verified contact
  monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).default("5000.00"),
  totalSent: decimal("total_sent", { precision: 10, scale: 2 }).default("0.00"),
  lastPaymentAt: timestamp("last_payment_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cross-Border Payment Processing
export const crossBorderPayments = pgTable("cross_border_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  friendNetworkId: varchar("friend_network_id").references(() => friendNetworks.id),
  
  // Payment details
  senderAmount: decimal("sender_amount", { precision: 15, scale: 2 }).notNull(),
  senderCurrency: text("sender_currency").notNull(),
  recipientAmount: decimal("recipient_amount", { precision: 15, scale: 2 }).notNull(),
  recipientCurrency: text("recipient_currency").notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull(),
  
  // Fees breakdown
  exchangeFee: decimal("exchange_fee", { precision: 10, scale: 2 }).default("0.00"),
  transferFee: decimal("transfer_fee", { precision: 10, scale: 2 }).default("0.00"),
  totalFees: decimal("total_fees", { precision: 10, scale: 2 }).default("0.00"),
  
  // Processing status
  status: text("status").default("pending"), // 'pending', 'processing', 'completed', 'failed', 'compliance_hold'
  paymentMethod: text("payment_method").notNull(), // Source of funds
  purpose: text("purpose").notNull(), // Purpose of payment for compliance
  
  // Compliance and tracking
  complianceStatus: text("compliance_status").default("pending"), // 'pending', 'approved', 'flagged'
  complianceNotes: text("compliance_notes"),
  transactionHash: text("transaction_hash"), // Blockchain hash if applicable
  providerReference: text("provider_reference"), // External payment provider reference
  
  // Timing
  estimatedDelivery: timestamp("estimated_delivery"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange Rates for Multi-Currency Support
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 10, scale: 6 }).notNull(),
  source: text("source").notNull(), // 'central_bank', 'xe_api', 'manual'
  isActive: boolean("is_active").default(true),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Identity Verification for International Users
export const identityVerifications = pgTable("identity_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  documentType: text("document_type").notNull(), // 'passport', 'national_id', 'drivers_license'
  documentNumber: text("document_number").notNull(),
  documentCountry: text("document_country").notNull(),
  documentExpiry: timestamp("document_expiry"),
  
  // Verification details
  status: text("status").default("pending"), // 'pending', 'verified', 'rejected', 'expired'
  verificationMethod: text("verification_method"), // 'manual', 'automated', 'third_party'
  verifiedBy: text("verified_by"), // Staff member or service name
  verificationNotes: text("verification_notes"),
  
  // Document storage
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  selfieUrl: text("selfie_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

// Fraud Detection and Risk Scoring
export const fraudScores = pgTable("fraud_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  crossBorderPaymentId: varchar("cross_border_payment_id").references(() => crossBorderPayments.id),
  
  // Risk scoring
  riskScore: integer("risk_score").notNull(), // 0-100
  riskLevel: text("risk_level").notNull(), // 'low', 'medium', 'high', 'critical'
  
  // Risk factors
  riskFactors: text("risk_factors"), // JSON array of detected risk factors
  geoLocation: text("geo_location"), // IP-based location
  deviceFingerprint: text("device_fingerprint"),
  
  // Actions taken
  actionTaken: text("action_taken"), // 'none', 'flagged', 'blocked', 'manual_review'
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets),
  transactions: many(transactions),
  sentFriendConnections: many(friendNetworks, { foreignKey: friendNetworks.senderId }),
  receivedFriendConnections: many(friendNetworks, { foreignKey: friendNetworks.recipientId }),
  sentCrossBorderPayments: many(crossBorderPayments, { foreignKey: crossBorderPayments.senderId }),
  receivedCrossBorderPayments: many(crossBorderPayments, { foreignKey: crossBorderPayments.recipientId }),
  identityVerifications: many(identityVerifications),
  fraudScores: many(fraudScores),
}));

export const operatorRelations = relations(operators, ({ many }) => ({
  routes: many(routes),
  transactions: many(transactions),
}));

export const walletRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const routeRelations = relations(routes, ({ one, many }) => ({
  operator: one(operators, {
    fields: [routes.operatorId],
    references: [operators.id],
  }),
  transactions: many(transactions),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  operator: one(operators, {
    fields: [transactions.operatorId],
    references: [operators.id],
  }),
  route: one(routes, {
    fields: [transactions.routeId],
    references: [routes.id],
  }),
  crossBorderPayment: one(crossBorderPayments, {
    fields: [transactions.crossBorderPaymentId],
    references: [crossBorderPayments.id],
  }),
}));

export const friendNetworkRelations = relations(friendNetworks, ({ one, many }) => ({
  sender: one(users, {
    fields: [friendNetworks.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [friendNetworks.recipientId],
    references: [users.id],
  }),
  crossBorderPayments: many(crossBorderPayments),
}));

export const crossBorderPaymentRelations = relations(crossBorderPayments, ({ one, many }) => ({
  sender: one(users, {
    fields: [crossBorderPayments.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [crossBorderPayments.recipientId],
    references: [users.id],
  }),
  friendNetwork: one(friendNetworks, {
    fields: [crossBorderPayments.friendNetworkId],
    references: [friendNetworks.id],
  }),
  transactions: many(transactions),
  fraudScores: many(fraudScores),
}));

export const identityVerificationRelations = relations(identityVerifications, ({ one }) => ({
  user: one(users, {
    fields: [identityVerifications.userId],
    references: [users.id],
  }),
}));

export const fraudScoreRelations = relations(fraudScores, ({ one }) => ({
  user: one(users, {
    fields: [fraudScores.userId],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [fraudScores.transactionId],
    references: [transactions.id],
  }),
  crossBorderPayment: one(crossBorderPayments, {
    fields: [fraudScores.crossBorderPaymentId],
    references: [crossBorderPayments.id],
  }),
}));

// Insert schemas with phone validation for Zimbabwe
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => typeof data.phone === "string" && data.phone.replace(/\D/g, "").length >= 9 && data.phone.replace(/\D/g, "").length <= 13, {
  message: "Invalid phone length",
})

export const insertOperatorSchema = createInsertSchema(operators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).refine((data) => typeof data.phone === "string" && data.phone.replace(/\D/g, "").length >= 9 && data.phone.replace(/\D/g, "").length <= 13, {
  message: "Invalid phone length",
})

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for new tables
export const insertFriendNetworkSchema = createInsertSchema(friendNetworks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrossBorderPaymentSchema = createInsertSchema(crossBorderPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
});

export const insertIdentityVerificationSchema = createInsertSchema(identityVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertFraudScoreSchema = createInsertSchema(fraudScores).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Operator = typeof operators.$inferSelect;
export type InsertOperator = typeof operators.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// New types for "Pay for your Friend" functionality
export type FriendNetwork = typeof friendNetworks.$inferSelect;
export type InsertFriendNetwork = typeof friendNetworks.$inferInsert;

export type CrossBorderPayment = typeof crossBorderPayments.$inferSelect;
export type InsertCrossBorderPayment = typeof crossBorderPayments.$inferInsert;

export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

export type IdentityVerification = typeof identityVerifications.$inferSelect;
export type InsertIdentityVerification = typeof identityVerifications.$inferInsert;

export type FraudScore = typeof fraudScores.$inferSelect;
export type InsertFraudScore = typeof fraudScores.$inferInsert;

// Enums for better type safety
export const UserTypeEnum = z.enum(['user', 'operator', 'merchant', 'partner', 'admin']);
export const CurrencyEnum = z.enum(['USD', 'ZWL', 'EUR', 'GBP', 'ZAR']);
export const KYCStatusEnum = z.enum(['pending', 'verified', 'rejected']);
export const PaymentStatusEnum = z.enum(['pending', 'processing', 'completed', 'failed', 'compliance_hold']);
export const RiskLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);

export type UserType = z.infer<typeof UserTypeEnum>;
export type Currency = z.infer<typeof CurrencyEnum>;
export type KYCStatus = z.infer<typeof KYCStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
export type RiskLevel = z.infer<typeof RiskLevelEnum>;
