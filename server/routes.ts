import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertOperatorSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "paypass-secret-key";

// Helper function to normalize Zimbabwe phone numbers
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let cleanPhone = phone.replace(/\D/g, '');
  
  // Handle different input formats
  if (cleanPhone.startsWith('263')) {
    // Already has country code
    return '+' + cleanPhone;
  } else if (cleanPhone.startsWith('0')) {
    // Local format starting with 0 (e.g., 0772160634)
    return '+263' + cleanPhone.substring(1);
  } else if (cleanPhone.length === 9) {
    // Local format without leading 0 (e.g., 772160634)
    return '+263' + cleanPhone;
  } else {
    // Default: assume it needs country code
    return '+263' + cleanPhone;
  }
}

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(userData.phone);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(normalizedPhone);
      if (existingUser) {
        return res.status(400).json({ error: "User with this phone number already exists" });
      }

      // Hash PIN
      const hashedPin = await bcrypt.hash(userData.pin, 10);
      
      const user = await storage.createUser({
        ...userData,
        phone: normalizedPhone,
        pin: hashedPin,
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, phone: user.phone, type: 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({ 
        user: { ...user, pin: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, pin } = req.body;
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phone);
      
      const user = await storage.getUserByPhone(normalizedPhone);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPin = await bcrypt.compare(pin, user.pin);
      if (!isValidPin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, phone: user.phone, type: 'user' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({ 
        user: { ...user, pin: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Operator authentication
  app.post("/api/auth/operator/register", async (req, res) => {
    try {
      const operatorData = insertOperatorSchema.parse(req.body);
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(operatorData.phone);
      
      const existingOperator = await storage.getOperatorByPhone(normalizedPhone);
      if (existingOperator) {
        return res.status(400).json({ error: "Operator with this phone number already exists" });
      }

      const hashedPin = await bcrypt.hash(operatorData.pin, 10);
      
      const operator = await storage.createOperator({
        ...operatorData,
        phone: normalizedPhone,
        pin: hashedPin,
      });

      const token = jwt.sign(
        { operatorId: operator.id, phone: operator.phone, type: 'operator' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({ 
        operator: { ...operator, pin: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Operator registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/operator/login", async (req, res) => {
    try {
      const { phone, pin } = req.body;
      
      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phone);
      
      const operator = await storage.getOperatorByPhone(normalizedPhone);
      if (!operator) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPin = await bcrypt.compare(pin, operator.pin);
      if (!isValidPin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { operatorId: operator.id, phone: operator.phone, type: 'operator' },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      res.json({ 
        operator: { ...operator, pin: undefined }, 
        token 
      });
    } catch (error) {
      console.error("Operator login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // User routes
  app.get("/api/user/profile", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ ...user, pin: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.get("/api/user/wallet", authenticateToken, async (req, res) => {
    try {
      const wallet = await storage.getWalletByUserId(req.user.userId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  app.get("/api/user/transactions", authenticateToken, async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.user.userId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // QR Code scanning and payment
  app.post("/api/qr/scan", authenticateToken, async (req, res) => {
    try {
      const { qrCode } = req.body;
      
      const route = await storage.getRouteByQrCode(qrCode);
      if (!route) {
        return res.status(404).json({ error: "Invalid QR code" });
      }

      const operator = await storage.getOperator(route.operatorId);
      
      res.json({
        route,
        operator: operator ? { ...operator, pin: undefined } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to process QR code" });
    }
  });

  app.post("/api/payment/process", authenticateToken, async (req, res) => {
    try {
      const { routeId, currency, amount, paymentMethod } = req.body;
      
      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }

      const wallet = await storage.getWalletByUserId(req.user.userId);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }

      // Check balance
      const balance = currency === 'USD' ? parseFloat(wallet.usdBalance) : parseFloat(wallet.zwlBalance);
      const paymentAmount = parseFloat(amount);
      
      if (balance < paymentAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        userId: req.user.userId,
        operatorId: route.operatorId,
        routeId: route.id,
        type: 'payment',
        category: 'bus',
        amount: amount,
        currency: currency,
        description: `Bus fare - ${route.name}`,
        status: 'completed',
        paymentMethod: paymentMethod || 'wallet',
      });

      // Update wallet balance (deduct payment)
      await storage.updateWalletBalance(req.user.userId, currency, `-${amount}`);

      res.json({ 
        success: true, 
        transaction,
        message: "Payment successful" 
      });
    } catch (error) {
      console.error("Payment error:", error);
      res.status(500).json({ error: "Payment failed" });
    }
  });

  // Top-up simulation
  app.post("/api/wallet/topup", authenticateToken, async (req, res) => {
    try {
      const { amount, currency, method } = req.body;
      
      // Create top-up transaction
      const transaction = await storage.createTransaction({
        userId: req.user.userId,
        type: 'topup',
        category: 'transfer',
        amount: amount,
        currency: currency,
        description: `Top-up via ${method}`,
        status: 'completed',
        paymentMethod: method,
      });

      // Update wallet balance
      await storage.updateWalletBalance(req.user.userId, currency, amount);

      res.json({ 
        success: true, 
        transaction,
        message: "Top-up successful" 
      });
    } catch (error) {
      console.error("Top-up error:", error);
      res.status(500).json({ error: "Top-up failed" });
    }
  });

  // Operator routes
  app.get("/api/operator/routes", authenticateToken, async (req, res) => {
    try {
      if (req.user.type !== 'operator') {
        return res.status(403).json({ error: "Access denied" });
      }

      const routes = await storage.getRoutesByOperatorId(req.user.operatorId);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.post("/api/operator/routes", authenticateToken, async (req, res) => {
    try {
      if (req.user.type !== 'operator') {
        return res.status(403).json({ error: "Access denied" });
      }

      const routeData = req.body;
      const qrCode = `PP_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const route = await storage.createRoute({
        ...routeData,
        operatorId: req.user.operatorId,
        qrCode,
      });

      res.json(route);
    } catch (error) {
      console.error("Route creation error:", error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.get("/api/operator/transactions", authenticateToken, async (req, res) => {
    try {
      if (req.user.type !== 'operator') {
        return res.status(403).json({ error: "Access denied" });
      }

      const transactions = await storage.getTransactionsByOperatorId(req.user.operatorId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
