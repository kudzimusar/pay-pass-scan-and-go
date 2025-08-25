import express from 'express';
import multer from 'multer';
import { ComplianceController } from '../controllers/ComplianceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateKYC, validateAML } from '../middleware/validation';

const router = express.Router();
const complianceController = new ComplianceController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// KYC (Know Your Customer) endpoints
router.post('/kyc/initiate', authMiddleware, validateKYC, complianceController.initiateKYC);
router.post('/kyc/documents', authMiddleware, upload.array('documents', 5), complianceController.uploadKYCDocuments);
router.get('/kyc/status/:userId', authMiddleware, complianceController.getKYCStatus);
router.put('/kyc/verify/:kycId', authMiddleware, complianceController.verifyKYC);
router.put('/kyc/reject/:kycId', authMiddleware, complianceController.rejectKYC);

// AML (Anti-Money Laundering) endpoints
router.post('/aml/screen', authMiddleware, validateAML, complianceController.performAMLScreening);
router.get('/aml/status/:userId', authMiddleware, complianceController.getAMLStatus);
router.post('/aml/transaction-check', authMiddleware, complianceController.checkTransactionAML);
router.get('/aml/sanctions-check/:userId', authMiddleware, complianceController.performSanctionsCheck);

// Regulatory reporting
router.post('/reporting/suspicious-activity', authMiddleware, complianceController.reportSuspiciousActivity);
router.get('/reporting/compliance-report', authMiddleware, complianceController.generateComplianceReport);
router.get('/reporting/transactions/:period', authMiddleware, complianceController.getTransactionReport);

// Document verification
router.post('/verify/identity-document', authMiddleware, upload.single('document'), complianceController.verifyIdentityDocument);
router.post('/verify/address-proof', authMiddleware, upload.single('document'), complianceController.verifyAddressProof);
router.get('/verify/status/:verificationId', authMiddleware, complianceController.getVerificationStatus);

// Risk assessment
router.post('/risk/assess-user', authMiddleware, complianceController.assessUserRisk);
router.post('/risk/assess-transaction', authMiddleware, complianceController.assessTransactionRisk);
router.get('/risk/profile/:userId', authMiddleware, complianceController.getUserRiskProfile);

// Compliance monitoring
router.get('/monitoring/dashboard', authMiddleware, complianceController.getComplianceDashboard);
router.get('/monitoring/alerts', authMiddleware, complianceController.getComplianceAlerts);
router.put('/monitoring/alerts/:alertId', authMiddleware, complianceController.updateAlert);

// Sanctions screening
router.post('/sanctions/screen-individual', authMiddleware, complianceController.screenIndividual);
router.post('/sanctions/screen-entity', authMiddleware, complianceController.screenEntity);
router.get('/sanctions/watchlists', authMiddleware, complianceController.getWatchlists);

// Enhanced Due Diligence (EDD)
router.post('/edd/initiate', authMiddleware, complianceController.initiateEDD);
router.get('/edd/status/:eddId', authMiddleware, complianceController.getEDDStatus);
router.put('/edd/complete/:eddId', authMiddleware, complianceController.completeEDD);

// Compliance configuration
router.get('/config/rules', authMiddleware, complianceController.getComplianceRules);
router.put('/config/rules', authMiddleware, complianceController.updateComplianceRules);
router.get('/config/thresholds', authMiddleware, complianceController.getThresholds);
router.put('/config/thresholds', authMiddleware, complianceController.updateThresholds);

export default router;
