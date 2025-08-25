import express from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validatePayment } from '../middleware/validation';

const router = express.Router();
const paymentController = new PaymentController();

// Payment processing
router.post('/process', authMiddleware, validatePayment, paymentController.processPayment);
router.post('/cross-border', authMiddleware, validatePayment, paymentController.processCrossBorderPayment);
router.post('/mobile-money', authMiddleware, validatePayment, paymentController.processMobileMoneyPayment);
router.post('/bank-transfer', authMiddleware, validatePayment, paymentController.processBankTransfer);

// Payment for friend functionality
router.post('/friend-payment', authMiddleware, validatePayment, paymentController.processPaymentForFriend);
router.post('/friend-payment/authorize', authMiddleware, paymentController.authorizePaymentForFriend);

// Payment status and tracking
router.get('/:paymentId', authMiddleware, paymentController.getPaymentStatus);
router.get('/:paymentId/tracking', authMiddleware, paymentController.getPaymentTracking);
router.put('/:paymentId/cancel', authMiddleware, paymentController.cancelPayment);

// Payment history and analytics
router.get('/user/:userId/history', authMiddleware, paymentController.getPaymentHistory);
router.get('/user/:userId/analytics', authMiddleware, paymentController.getPaymentAnalytics);

// Currency conversion
router.get('/exchange-rates', paymentController.getExchangeRates);
router.post('/calculate-fee', paymentController.calculateFee);
router.post('/convert-currency', paymentController.convertCurrency);

// Payment methods
router.get('/user/:userId/methods', authMiddleware, paymentController.getPaymentMethods);
router.post('/user/:userId/methods', authMiddleware, paymentController.addPaymentMethod);
router.delete('/user/:userId/methods/:methodId', authMiddleware, paymentController.removePaymentMethod);

// Webhooks
router.post('/webhook/bank', paymentController.handleBankWebhook);
router.post('/webhook/mobile-money', paymentController.handleMobileMoneyWebhook);
router.post('/webhook/compliance', paymentController.handleComplianceWebhook);

// Admin endpoints
router.get('/admin/all', authMiddleware, paymentController.getAllPayments);
router.put('/admin/:paymentId/status', authMiddleware, paymentController.updatePaymentStatus);
router.get('/admin/statistics', authMiddleware, paymentController.getPaymentStatistics);

export default router;
