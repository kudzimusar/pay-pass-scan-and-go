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
  type: text("type").notNull(), // 'payment', 'topup', 'send', 'receive'
  category: text("category").notNull(), // 'bus', 'shop', 'utility', 'transfer'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull(), // 'USD' or 'ZWL'
  description: text("description").notNull(),
  status: text("status").default("completed"), // 'pending', 'completed', 'failed'
  paymentMethod: text("payment_method"), // 'wallet', 'ecocash', 'telecash', etc.
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets),
  transactions: many(transactions),
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
