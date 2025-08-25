/**
 * International Expansion Service
 * Handles market expansion, localization, and international compliance
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import i18n from 'i18n';
import path from 'path';

import { LocalizationManager } from './services/LocalizationManager';
import { MarketAnalyzer } from './services/MarketAnalyzer';
import { ComplianceMapper } from './services/ComplianceMapper';
import { CurrencyConverter } from './services/CurrencyConverter';
import { RegionalizationService } from './services/RegionalizationService';
import { internationalRoutes } from './routes/internationalRoutes';

dotenv.config();

const app = express();

// Configure i18n
i18n.configure({
  locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi', 'ru', 'sw'],
  directory: path.join(__dirname, 'locales'),
  defaultLocale: 'en',
  cookie: 'locale',
  queryParameter: 'lang',
  directoryPermissions: '755',
  autoReload: true,
  updateFiles: false,
  api: {
    '__': 'translate',
    '__n': 'translateN'
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/international-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/international-combined.log' }),
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
app.use(i18n.init);

// Initialize international services
const localizationManager = new LocalizationManager();
const marketAnalyzer = new MarketAnalyzer();
const complianceMapper = new ComplianceMapper();
const currencyConverter = new CurrencyConverter();
const regionalizationService = new RegionalizationService();

// Make services available to routes
app.locals.localizationManager = localizationManager;
app.locals.marketAnalyzer = marketAnalyzer;
app.locals.complianceMapper = complianceMapper;
app.locals.currencyConverter = currencyConverter;
app.locals.regionalizationService = regionalizationService;
app.locals.logger = logger;

// Routes
app.use('/api', internationalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'international-expansion',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    supportedLocales: i18n.getLocales(),
    markets: {
      active: 15,
      planned: 8,
      researching: 12
    },
    features: [
      'multi-language-support',
      'currency-conversion',
      'market-analysis',
      'compliance-mapping',
      'regionalization',
      'localization-management'
    ]
  });
});

// Localization endpoint
app.get('/api/localize/:key', (req, res) => {
  const { key } = req.params;
  const { locale } = req.query;
  
  if (locale && typeof locale === 'string') {
    res.setLocale(locale);
  }
  
  const translation = res.__(key);
  
  res.json({
    success: true,
    key,
    locale: res.getLocale(),
    translation
  });
});

// Market information endpoint
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await marketAnalyzer.getAllMarkets();
    res.json({
      success: true,
      markets,
      total: markets.length
    });
  } catch (error) {
    logger.error('Failed to fetch markets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market information'
    });
  }
});

// Currency conversion endpoint
app.get('/api/convert/:from/:to/:amount', async (req, res) => {
  try {
    const { from, to, amount } = req.params;
    const result = await currencyConverter.convert(
      parseFloat(amount),
      from.toUpperCase(),
      to.toUpperCase()
    );
    
    res.json({
      success: true,
      conversion: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        originalAmount: parseFloat(amount),
        convertedAmount: result.amount,
        exchangeRate: result.rate,
        timestamp: result.timestamp
      }
    });
  } catch (error) {
    logger.error('Currency conversion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Currency conversion failed'
    });
  }
});

// Regional compliance check
app.get('/api/compliance/:country', async (req, res) => {
  try {
    const { country } = req.params;
    const compliance = await complianceMapper.getCountryCompliance(country);
    
    res.json({
      success: true,
      country: country.toUpperCase(),
      compliance
    });
  } catch (error) {
    logger.error('Compliance check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Compliance information unavailable'
    });
  }
});

// Market opportunity analysis
app.get('/api/market-analysis/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const analysis = await marketAnalyzer.analyzeMarketOpportunity(region);
    
    res.json({
      success: true,
      region,
      analysis
    });
  } catch (error) {
    logger.error('Market analysis failed:', error);
    res.status(500).json({
      success: false,
      error: 'Market analysis unavailable'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('International expansion service error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal international service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'International expansion endpoint not found',
    availableEndpoints: [
      'GET /health',
      'GET /api/localize/:key',
      'GET /api/markets',
      'GET /api/convert/:from/:to/:amount',
      'GET /api/compliance/:country',
      'GET /api/market-analysis/:region'
    ]
  });
});

const PORT = process.env.INTERNATIONAL_SERVICE_PORT || 3013;

async function startServer() {
  try {
    // Initialize international services
    await localizationManager.initialize();
    await marketAnalyzer.initialize();
    await complianceMapper.initialize();
    await currencyConverter.initialize();
    await regionalizationService.initialize();
    
    app.listen(PORT, () => {
      logger.info(`🌍 International Expansion Service running on port ${PORT}`);
      logger.info(`🗣️  Multi-language support: ${i18n.getLocales().length} languages`);
      logger.info(`💱 Currency conversion: Real-time rates`);
      logger.info(`📊 Market analysis: Active`);
      logger.info(`⚖️  Compliance mapping: Global coverage`);
      logger.info(`🌐 Regionalization: Enabled`);
    });
  } catch (error) {
    logger.error('Failed to start international expansion service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down international expansion service gracefully');
  await currencyConverter.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down international expansion service gracefully');
  await currencyConverter.disconnect();
  process.exit(0);
});

startServer();

export default app;
