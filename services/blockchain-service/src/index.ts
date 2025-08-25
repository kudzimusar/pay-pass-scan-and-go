/**
 * Blockchain Payment Service
 * Handles cryptocurrency payments and blockchain integration
 * Supports Bitcoin, Ethereum, Litecoin, and other major cryptocurrencies
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';

import { BlockchainWalletManager } from './services/WalletManager';
import { CryptocurrencyExchange } from './services/CryptocurrencyExchange';
import { BlockchainTransactionProcessor } from './services/TransactionProcessor';
import { SmartContractManager } from './services/SmartContractManager';
import { blockchainRoutes } from './routes/blockchainRoutes';

dotenv.config();

const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/blockchain-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/blockchain-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize blockchain services
const walletManager = new BlockchainWalletManager();
const cryptoExchange = new CryptocurrencyExchange();
const transactionProcessor = new BlockchainTransactionProcessor(walletManager, cryptoExchange);
const smartContractManager = new SmartContractManager();

// Make services available to routes
app.locals.walletManager = walletManager;
app.locals.cryptoExchange = cryptoExchange;
app.locals.transactionProcessor = transactionProcessor;
app.locals.smartContractManager = smartContractManager;
app.locals.logger = logger;

// Routes
app.use('/api', blockchainRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'blockchain-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    blockchains: {
      bitcoin: 'active',
      ethereum: 'active',
      litecoin: 'active'
    },
    features: [
      'cryptocurrency-payments',
      'multi-wallet-support',
      'smart-contracts',
      'defi-integration',
      'cross-chain-swaps'
    ]
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Blockchain service error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal blockchain service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Blockchain endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/wallets/create',
      'GET /api/wallets/:address/balance',
      'POST /api/transactions/send',
      'GET /api/exchange-rates',
      'POST /api/smart-contracts/deploy'
    ]
  });
});

const PORT = process.env.BLOCKCHAIN_SERVICE_PORT || 3011;

async function startServer() {
  try {
    // Initialize blockchain connections
    await walletManager.initialize();
    await cryptoExchange.initialize();
    await smartContractManager.initialize();
    
    app.listen(PORT, () => {
      logger.info(`🔗 Blockchain Payment Service running on port ${PORT}`);
      logger.info(`⛓️  Multi-blockchain support: Bitcoin, Ethereum, Litecoin`);
      logger.info(`💰 Cryptocurrency payments: Enabled`);
      logger.info(`🤖 Smart contracts: Active`);
      logger.info(`🔄 DeFi integration: Available`);
      logger.info(`🌐 Cross-chain swaps: Supported`);
    });
  } catch (error) {
    logger.error('Failed to start blockchain service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down blockchain service gracefully');
  await walletManager.disconnect();
  await cryptoExchange.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down blockchain service gracefully');
  await walletManager.disconnect();
  await cryptoExchange.disconnect();
  process.exit(0);
});

startServer();

export default app;
