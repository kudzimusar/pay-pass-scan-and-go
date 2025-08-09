import { 
  users, 
  operators, 
  wallets, 
  routes, 
  transactions,
  type User, 
  type InsertUser,
  type Operator,
  type InsertOperator,
  type Wallet,
  type InsertWallet,
  type Route,
  type InsertRoute,
  type Transaction,
  type InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Operator operations
  getOperator(id: string): Promise<Operator | undefined>;
  getOperatorByPhone(phone: string): Promise<Operator | undefined>;
  createOperator(operator: InsertOperator): Promise<Operator>;
  
  // Wallet operations
  getWalletByUserId(userId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(userId: string, currency: 'USD' | 'ZWL', amount: string): Promise<Wallet>;
  
  // Route operations
  getRoute(id: string): Promise<Route | undefined>;
  getRouteByQrCode(qrCode: string): Promise<Route | undefined>;
  getRoutesByOperatorId(operatorId: string): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByOperatorId(operatorId: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByRouteId(routeId: string): Promise<Transaction[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    
    // Create wallet for new user
    await this.createWallet({ userId: user.id });
    
    return user;
  }

  async getOperator(id: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.id, id));
    return operator || undefined;
  }

  async getOperatorByPhone(phone: string): Promise<Operator | undefined> {
    const [operator] = await db.select().from(operators).where(eq(operators.phone, phone));
    return operator || undefined;
  }

  async createOperator(insertOperator: InsertOperator): Promise<Operator> {
    const [operator] = await db
      .insert(operators)
      .values(insertOperator)
      .returning();
    return operator;
  }

  async getWalletByUserId(userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet || undefined;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values(insertWallet)
      .returning();
    return wallet;
  }

  async updateWalletBalance(userId: string, currency: 'USD' | 'ZWL', amount: string): Promise<Wallet> {
    if (currency === 'USD') {
      const [wallet] = await db
        .update(wallets)
        .set({ 
          usdBalance: sql`usd_balance + ${amount}::decimal`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId))
        .returning();
      return wallet;
    } else {
      const [wallet] = await db
        .update(wallets)
        .set({ 
          zwlBalance: sql`zwl_balance + ${amount}::decimal`,
          updatedAt: new Date()
        })
        .where(eq(wallets.userId, userId))
        .returning();
      return wallet;
    }
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async getRouteByQrCode(qrCode: string): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.qrCode, qrCode));
    return route || undefined;
  }

  async getRoutesByOperatorId(operatorId: string): Promise<Route[]> {
    return await db.select().from(routes).where(eq(routes.operatorId, operatorId));
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getTransactionsByUserId(userId: string, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByOperatorId(operatorId: string, limit: number = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.operatorId, operatorId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByRouteId(routeId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.routeId, routeId))
      .orderBy(desc(transactions.createdAt));
  }
}

export const storage = new DatabaseStorage();
