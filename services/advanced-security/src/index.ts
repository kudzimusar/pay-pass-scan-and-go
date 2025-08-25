/**
 * Advanced Security Service
 * Provides comprehensive security features including biometric authentication,
 * device fingerprinting, fraud detection, and multi-factor authentication
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import winston from 'winston';
import dotenv from 'dotenv';
import { RateLimiterRedis } from 'rate-limiter-flexible';

import { BiometricAuthManager } from './services/BiometricAuthManager';
import { DeviceFingerprintService } from './services/DeviceFingerprintService';
import { TwoFactorAuthService } from './services/TwoFactorAuthService';
import { SecurityAnalyzer } from './services/SecurityAnalyzer';
import { FraudDetectionService } from './services/FraudDetectionService';
import { securityRoutes } from './routes/securityRoutes';

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
    new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate limiting for security endpoints
const securityLimiter = new RateLimiterRedis({
  storeClient: process.env.REDIS_URL ? require('redis').createClient({ url: process.env.REDIS_URL }) : undefined,
  keyGenerator: (req) => `security:${req.ip}:${req.headers['user-agent']}`,
  points: 10, // Number of attempts
  duration: 900, // Per 15 minutes
  blockDuration: 3600, // Block for 1 hour
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Request-ID']
}));

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(async (req, res, next) => {
  try {
    // Apply rate limiting
    await securityLimiter.consume(req.ip);
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add request ID for tracking
    req.requestId = req.headers['x-request-id'] as string || require('uuid').v4();
    res.setHeader('X-Request-ID', req.requestId);
    
    next();
  } catch (rejRes) {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext) || 3600000
    });
  }
});

// Initialize security services
const biometricAuthManager = new BiometricAuthManager();
const deviceFingerprintService = new DeviceFingerprintService();
const twoFactorAuthService = new TwoFactorAuthService();
const securityAnalyzer = new SecurityAnalyzer();
const fraudDetectionService = new FraudDetectionService();

// Make services available to routes
app.locals.biometricAuthManager = biometricAuthManager;
app.locals.deviceFingerprintService = deviceFingerprintService;
app.locals.twoFactorAuthService = twoFactorAuthService;
app.locals.securityAnalyzer = securityAnalyzer;
app.locals.fraudDetectionService = fraudDetectionService;
app.locals.logger = logger;

// Routes
app.use('/api', securityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'advanced-security',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: {
      biometric_auth: 'active',
      device_fingerprinting: 'active',
      two_factor_auth: 'active',
      fraud_detection: 'active',
      rate_limiting: 'active'
    },
    features: [
      'biometric-authentication',
      'facial-recognition',
      'fingerprint-scanning',
      'voice-recognition',
      'device-fingerprinting',
      'two-factor-authentication',
      'fraud-detection',
      'security-analytics',
      'risk-assessment'
    ]
  });
});

// Biometric enrollment endpoint
app.post('/api/biometric/enroll', async (req, res) => {
  try {
    const { userId, biometricType, biometricData, deviceInfo } = req.body;
    
    if (!userId || !biometricType || !biometricData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'biometricType', 'biometricData']
      });
    }

    // Device fingerprint analysis
    const deviceFingerprint = await deviceFingerprintService.generateFingerprint(req);
    
    // Enroll biometric data
    const enrollment = await biometricAuthManager.enrollBiometric({
      userId,
      biometricType,
      biometricData,
      deviceFingerprint,
      deviceInfo: deviceInfo || req.headers['user-agent'],
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // Log security event
    await securityAnalyzer.logSecurityEvent({
      userId,
      eventType: 'biometric_enrollment',
      deviceFingerprint,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { biometricType },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Biometric enrollment successful',
      enrollmentId: enrollment.id,
      biometricType,
      accuracy: enrollment.accuracy,
      securityLevel: enrollment.securityLevel
    });
  } catch (error) {
    logger.error('Biometric enrollment failed:', error);
    res.status(500).json({
      error: 'Enrollment failed',
      message: 'Biometric enrollment could not be completed'
    });
  }
});

// Biometric authentication endpoint
app.post('/api/biometric/authenticate', async (req, res) => {
  try {
    const { userId, biometricType, biometricData, challengeId } = req.body;
    
    if (!userId || !biometricType || !biometricData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'biometricType', 'biometricData']
      });
    }

    // Device fingerprint verification
    const deviceFingerprint = await deviceFingerprintService.generateFingerprint(req);
    const deviceTrust = await securityAnalyzer.assessDeviceTrust(userId, deviceFingerprint);
    
    // Perform biometric authentication
    const authResult = await biometricAuthManager.authenticateBiometric({
      userId,
      biometricType,
      biometricData,
      deviceFingerprint,
      challengeId,
      ipAddress: req.ip,
      timestamp: new Date()
    });

    // Fraud detection check
    const fraudAnalysis = await fraudDetectionService.analyzeAuthentication({
      userId,
      authMethod: 'biometric',
      deviceFingerprint,
      ipAddress: req.ip,
      location: await securityAnalyzer.getLocationFromIP(req.ip),
      timestamp: new Date()
    });

    // Log authentication attempt
    await securityAnalyzer.logSecurityEvent({
      userId,
      eventType: 'biometric_authentication',
      success: authResult.success,
      confidence: authResult.confidence,
      deviceFingerprint,
      deviceTrust: deviceTrust.level,
      fraudScore: fraudAnalysis.riskScore,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    });

    if (authResult.success && fraudAnalysis.riskScore < 70) {
      res.json({
        success: true,
        message: 'Biometric authentication successful',
        authenticationId: authResult.id,
        confidence: authResult.confidence,
        biometricType,
        deviceTrust: deviceTrust.level,
        securityToken: authResult.securityToken
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: authResult.success ? 'Fraud detected' : 'Biometric verification failed',
        confidence: authResult.confidence,
        fraudScore: fraudAnalysis.riskScore,
        recommendedAction: fraudAnalysis.recommendation
      });
    }
  } catch (error) {
    logger.error('Biometric authentication failed:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'Biometric authentication could not be completed'
    });
  }
});

// Device trust assessment endpoint
app.get('/api/security/device-trust/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const deviceFingerprint = await deviceFingerprintService.generateFingerprint(req);
    
    const trustAssessment = await securityAnalyzer.assessDeviceTrust(userId, deviceFingerprint);
    const deviceHistory = await securityAnalyzer.getDeviceHistory(deviceFingerprint);
    
    res.json({
      success: true,
      deviceId: deviceFingerprint,
      trustLevel: trustAssessment.level,
      trustScore: trustAssessment.score,
      riskFactors: trustAssessment.riskFactors,
      deviceHistory: {
        firstSeen: deviceHistory.firstSeen,
        lastSeen: deviceHistory.lastSeen,
        loginCount: deviceHistory.loginCount,
        countries: deviceHistory.countries
      },
      recommendations: trustAssessment.recommendations
    });
  } catch (error) {
    logger.error('Device trust assessment failed:', error);
    res.status(500).json({
      error: 'Assessment failed',
      message: 'Device trust assessment could not be completed'
    });
  }
});

// Security analytics endpoint
app.get('/api/security/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;
    
    const analytics = await securityAnalyzer.getSecurityAnalytics(userId, timeframe as string);
    
    res.json({
      success: true,
      timeframe,
      analytics: {
        totalEvents: analytics.totalEvents,
        authenticationAttempts: analytics.authenticationAttempts,
        successfulLogins: analytics.successfulLogins,
        failedLogins: analytics.failedLogins,
        suspiciousActivity: analytics.suspiciousActivity,
        deviceCount: analytics.uniqueDevices,
        locationCount: analytics.uniqueLocations,
        riskEvents: analytics.riskEvents,
        securityScore: analytics.overallSecurityScore
      },
      trends: analytics.trends,
      recommendations: analytics.recommendations
    });
  } catch (error) {
    logger.error('Security analytics failed:', error);
    res.status(500).json({
      error: 'Analytics failed',
      message: 'Security analytics could not be retrieved'
    });
  }
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Advanced security service error:', error);
  
  // Security event logging for errors
  if (req.body?.userId) {
    securityAnalyzer.logSecurityEvent({
      userId: req.body.userId,
      eventType: 'security_error',
      error: error.message,
      endpoint: req.path,
      method: req.method,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date()
    }).catch(logError => logger.error('Failed to log security error:', logError));
  }
  
  res.status(500).json({
    error: 'Internal security service error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Security service temporarily unavailable',
    requestId: req.requestId
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Security endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/biometric/enroll',
      'POST /api/biometric/authenticate',
      'GET /api/security/device-trust/:userId',
      'GET /api/security/analytics/:userId',
      'POST /api/2fa/setup',
      'POST /api/2fa/verify'
    ]
  });
});

const PORT = process.env.SECURITY_SERVICE_PORT || 3015;

async function startServer() {
  try {
    // Initialize security services
    await biometricAuthManager.initialize();
    await deviceFingerprintService.initialize();
    await twoFactorAuthService.initialize();
    await securityAnalyzer.initialize();
    await fraudDetectionService.initialize();
    
    app.listen(PORT, () => {
      logger.info(`🔒 Advanced Security Service running on port ${PORT}`);
      logger.info(`🔐 Biometric authentication: Multi-modal support`);
      logger.info(`📱 Device fingerprinting: Advanced tracking`);
      logger.info(`🛡️  Two-factor authentication: TOTP and SMS`);
      logger.info(`🕵️  Fraud detection: Real-time analysis`);
      logger.info(`📊 Security analytics: Comprehensive monitoring`);
      logger.info(`⚡ Rate limiting: Intelligent protection`);
    });
  } catch (error) {
    logger.error('Failed to start advanced security service:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down advanced security service gracefully');
  await biometricAuthManager.shutdown();
  await securityAnalyzer.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down advanced security service gracefully');
  await biometricAuthManager.shutdown();
  await securityAnalyzer.shutdown();
  process.exit(0);
});

startServer();

export default app;
