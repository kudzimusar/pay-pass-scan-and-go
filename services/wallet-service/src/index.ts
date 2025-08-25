import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { z } from 'zod';
import winston from 'winston';
import dotenv from 'dotenv';

dotenv.config();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'wallet-service.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Validation schemas
const createWalletSchema = z.object({
  userId: z.string().uuid(),
  currency: z.string().length(3),
  initialBalance: z.number().min(0).default(0)
});

const transferSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  memo: z.string().optional()
});

const balanceUpdateSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number(),
  operation: z.enum(['credit', 'debit']),
  transactionId: z.string().uuid(),
  memo: z.string().optional()
});

// Mock wallet data (replace with actual database)
interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const wallets: Map<string, Wallet> = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'wallet-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get wallets for a user
app.get('/wallets/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userWallets = Array.from(wallets.values())
      .filter(wallet => wallet.userId === userId);
    
    logger.info('Retrieved wallets for user', { userId, count: userWallets.length });
    
    res.json({
      success: true,
      wallets: userWallets
    });
  } catch (error) {
    logger.error('Error retrieving user wallets', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallets'
    });
  }
});

// Get specific wallet
app.get('/wallets/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = wallets.get(walletId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    logger.info('Retrieved wallet', { walletId });
    
    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    logger.error('Error retrieving wallet', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallet'
    });
  }
});

// Create new wallet
app.post('/wallets', async (req, res) => {
  try {
    const validation = createWalletSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }
    
    const { userId, currency, initialBalance } = validation.data;
    
    // Check if user already has a wallet for this currency
    const existingWallet = Array.from(wallets.values())
      .find(wallet => wallet.userId === userId && wallet.currency === currency);
    
    if (existingWallet) {
      return res.status(409).json({
        success: false,
        error: 'Wallet already exists for this currency'
      });
    }
    
    const walletId = crypto.randomUUID();
    const newWallet: Wallet = {
      id: walletId,
      userId,
      currency,
      balance: initialBalance,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    wallets.set(walletId, newWallet);
    
    logger.info('Created new wallet', { walletId, userId, currency });
    
    res.status(201).json({
      success: true,
      wallet: newWallet
    });
  } catch (error) {
    logger.error('Error creating wallet', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create wallet'
    });
  }
});

// Update wallet balance
app.put('/wallets/:walletId/balance', async (req, res) => {
  try {
    const { walletId } = req.params;
    const validation = balanceUpdateSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }
    
    const { amount, operation, transactionId, memo } = validation.data;
    const wallet = wallets.get(walletId);
    
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }
    
    const previousBalance = wallet.balance;
    
    if (operation === 'credit') {
      wallet.balance += amount;
    } else {
      if (wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance'
        });
      }
      wallet.balance -= amount;
    }
    
    wallet.updatedAt = new Date();
    wallets.set(walletId, wallet);
    
    logger.info('Updated wallet balance', {
      walletId,
      operation,
      amount,
      previousBalance,
      newBalance: wallet.balance,
      transactionId
    });
    
    res.json({
      success: true,
      wallet,
      transaction: {
        id: transactionId,
        operation,
        amount,
        previousBalance,
        newBalance: wallet.balance,
        memo
      }
    });
  } catch (error) {
    logger.error('Error updating wallet balance', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to update balance'
    });
  }
});

// Transfer between wallets
app.post('/wallets/transfer', async (req, res) => {
  try {
    const validation = transferSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }
    
    const { fromWalletId, toWalletId, amount, currency, memo } = validation.data;
    
    const fromWallet = wallets.get(fromWalletId);
    const toWallet = wallets.get(toWalletId);
    
    if (!fromWallet || !toWallet) {
      return res.status(404).json({
        success: false,
        error: 'One or both wallets not found'
      });
    }
    
    if (fromWallet.currency !== currency || toWallet.currency !== currency) {
      return res.status(400).json({
        success: false,
        error: 'Currency mismatch'
      });
    }
    
    if (fromWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }
    
    // Perform transfer
    fromWallet.balance -= amount;
    toWallet.balance += amount;
    
    const timestamp = new Date();
    fromWallet.updatedAt = timestamp;
    toWallet.updatedAt = timestamp;
    
    wallets.set(fromWalletId, fromWallet);
    wallets.set(toWalletId, toWallet);
    
    const transferId = crypto.randomUUID();
    
    logger.info('Completed wallet transfer', {
      transferId,
      fromWalletId,
      toWalletId,
      amount,
      currency
    });
    
    res.json({
      success: true,
      transfer: {
        id: transferId,
        fromWalletId,
        toWalletId,
        amount,
        currency,
        memo,
        timestamp
      },
      fromWallet,
      toWallet
    });
  } catch (error) {
    logger.error('Error processing transfer', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process transfer'
    });
  }
});

// Multi-currency exchange
app.post('/wallets/exchange', async (req, res) => {
  try {
    const exchangeSchema = z.object({
      fromWalletId: z.string().uuid(),
      toWalletId: z.string().uuid(),
      fromAmount: z.number().positive(),
      exchangeRate: z.number().positive(),
      memo: z.string().optional()
    });
    
    const validation = exchangeSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: validation.error.errors
      });
    }
    
    const { fromWalletId, toWalletId, fromAmount, exchangeRate, memo } = validation.data;
    
    const fromWallet = wallets.get(fromWalletId);
    const toWallet = wallets.get(toWalletId);
    
    if (!fromWallet || !toWallet) {
      return res.status(404).json({
        success: false,
        error: 'One or both wallets not found'
      });
    }
    
    if (fromWallet.balance < fromAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }
    
    const toAmount = fromAmount * exchangeRate;
    
    // Perform exchange
    fromWallet.balance -= fromAmount;
    toWallet.balance += toAmount;
    
    const timestamp = new Date();
    fromWallet.updatedAt = timestamp;
    toWallet.updatedAt = timestamp;
    
    wallets.set(fromWalletId, fromWallet);
    wallets.set(toWalletId, toWallet);
    
    const exchangeId = crypto.randomUUID();
    
    logger.info('Completed currency exchange', {
      exchangeId,
      fromWalletId,
      toWalletId,
      fromAmount,
      toAmount,
      exchangeRate
    });
    
    res.json({
      success: true,
      exchange: {
        id: exchangeId,
        fromWalletId,
        toWalletId,
        fromAmount,
        toAmount,
        exchangeRate,
        fromCurrency: fromWallet.currency,
        toCurrency: toWallet.currency,
        memo,
        timestamp
      },
      fromWallet,
      toWallet
    });
  } catch (error) {
    logger.error('Error processing exchange', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process exchange'
    });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Wallet Service started on port ${PORT}`);
  console.log(`🚀 Wallet Service running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
