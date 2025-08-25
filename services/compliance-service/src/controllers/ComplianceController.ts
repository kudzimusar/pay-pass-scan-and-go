import { Request, Response } from 'express';
import { ComplianceService } from '../services/ComplianceService';
import { KYCService } from '../services/KYCService';
import { AMLService } from '../services/AMLService';
import { SanctionsService } from '../services/SanctionsService';
import { RiskAssessmentService } from '../services/RiskAssessmentService';
import winston from 'winston';

// amlScreening functionality enabled

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

export class ComplianceController {
  private complianceService: ComplianceService;
  private kycService: KYCService;
  private amlService: AMLService;
  private sanctionsService: SanctionsService;
  private riskAssessmentService: RiskAssessmentService;

  constructor() {
    this.complianceService = new ComplianceService();
    this.kycService = new KYCService();
    this.amlService = new AMLService();
    this.sanctionsService = new SanctionsService();
    this.riskAssessmentService = new RiskAssessmentService();
  }

  // KYC Methods
  async initiateKYC(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const kycData = req.body;
      const result = await this.kycService.initiateKYC(userId, kycData);
      
      logger.info('KYC initiated', { userId, kycId: result.id });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('KYC initiation failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'KYC initiation failed'
      });
    }
  }

  async uploadKYCDocuments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const files = req.files as Express.Multer.File[];
      const result = await this.kycService.uploadDocuments(userId, files);
      
      logger.info('KYC documents uploaded', { userId, documentsCount: files.length });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('KYC document upload failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Document upload failed'
      });
    }
  }

  async getKYCStatus(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const status = await this.kycService.getKYCStatus(userId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get KYC status failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get KYC status'
      });
    }
  }

  async verifyKYC(req: Request, res: Response) {
    try {
      const kycId = req.params.kycId;
      const verificationData = req.body;
      const result = await this.kycService.verifyKYC(kycId, verificationData);
      
      logger.info('KYC verified', { kycId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('KYC verification failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'KYC verification failed'
      });
    }
  }

  async rejectKYC(req: Request, res: Response) {
    try {
      const kycId = req.params.kycId;
      const rejectionData = req.body;
      const result = await this.kycService.rejectKYC(kycId, rejectionData);
      
      logger.info('KYC rejected', { kycId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('KYC rejection failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'KYC rejection failed'
      });
    }
  }

  // AML Methods
  async performAMLScreening(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const screeningData = req.body;
      const result = await this.amlService.performScreening(userId, screeningData);
      
      logger.info('AML screening performed', { userId, result: result.status });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('AML screening failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'AML screening failed'
      });
    }
  }

  async getAMLStatus(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const status = await this.amlService.getAMLStatus(userId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get AML status failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get AML status'
      });
    }
  }

  async checkTransactionAML(req: Request, res: Response) {
    try {
      const transactionData = req.body;
      const result = await this.amlService.checkTransaction(transactionData);
      
      logger.info('AML transaction check performed', { 
        transactionId: transactionData.id, 
        result: result.riskLevel 
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('AML transaction check failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'AML transaction check failed'
      });
    }
  }

  async performSanctionsCheck(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const result = await this.sanctionsService.performSanctionsCheck(userId);
      
      logger.info('Sanctions check performed', { userId, result: result.status });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Sanctions check failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Sanctions check failed'
      });
    }
  }

  // Risk Assessment Methods
  async assessUserRisk(req: Request, res: Response) {
    try {
      const userId = req.body.userId;
      const assessmentData = req.body;
      const result = await this.riskAssessmentService.assessUserRisk(userId, assessmentData);
      
      logger.info('User risk assessed', { userId, riskLevel: result.riskLevel });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('User risk assessment failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Risk assessment failed'
      });
    }
  }

  async assessTransactionRisk(req: Request, res: Response) {
    try {
      const transactionData = req.body;
      const result = await this.riskAssessmentService.assessTransactionRisk(transactionData);
      
      logger.info('Transaction risk assessed', { 
        transactionId: transactionData.id, 
        riskLevel: result.riskLevel 
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Transaction risk assessment failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Risk assessment failed'
      });
    }
  }

  async getUserRiskProfile(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const profile = await this.riskAssessmentService.getUserRiskProfile(userId);
      
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      logger.error('Get user risk profile failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk profile'
      });
    }
  }

  // Reporting Methods
  async reportSuspiciousActivity(req: Request, res: Response) {
    try {
      const reportData = req.body;
      const result = await this.complianceService.reportSuspiciousActivity(reportData);
      
      logger.info('Suspicious activity reported', { reportId: result.id });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Suspicious activity reporting failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Reporting failed'
      });
    }
  }

  async generateComplianceReport(req: Request, res: Response) {
    try {
      const { period, type } = req.query;
      const report = await this.complianceService.generateComplianceReport(
        period as string, 
        type as string
      );
      
      logger.info('Compliance report generated', { period, type });
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Compliance report generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate report'
      });
    }
  }

  async getTransactionReport(req: Request, res: Response) {
    try {
      const period = req.params.period;
      const report = await this.complianceService.getTransactionReport(period);
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Transaction report generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate transaction report'
      });
    }
  }

  // Document Verification Methods
  async verifyIdentityDocument(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const file = req.file;
      const result = await this.complianceService.verifyIdentityDocument(userId, file!);
      
      logger.info('Identity document verification initiated', { userId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Identity document verification failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Document verification failed'
      });
    }
  }

  async verifyAddressProof(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const file = req.file;
      const result = await this.complianceService.verifyAddressProof(userId, file!);
      
      logger.info('Address proof verification initiated', { userId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Address proof verification failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Address proof verification failed'
      });
    }
  }

  async getVerificationStatus(req: Request, res: Response) {
    try {
      const verificationId = req.params.verificationId;
      const status = await this.complianceService.getVerificationStatus(verificationId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get verification status failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get verification status'
      });
    }
  }

  // Monitoring and Dashboard Methods
  async getComplianceDashboard(req: Request, res: Response) {
    try {
      const dashboard = await this.complianceService.getComplianceDashboard();
      
      res.status(200).json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Get compliance dashboard failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance dashboard'
      });
    }
  }

  async getComplianceAlerts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, severity, status } = req.query;
      const alerts = await this.complianceService.getComplianceAlerts({
        page: Number(page),
        limit: Number(limit),
        severity: severity as string,
        status: status as string
      });
      
      res.status(200).json({
        success: true,
        data: alerts
      });
    } catch (error) {
      logger.error('Get compliance alerts failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance alerts'
      });
    }
  }

  async updateAlert(req: Request, res: Response) {
    try {
      const alertId = req.params.alertId;
      const updateData = req.body;
      const result = await this.complianceService.updateAlert(alertId, updateData);
      
      logger.info('Compliance alert updated', { alertId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Alert update failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Alert update failed'
      });
    }
  }

  // Sanctions Methods
  async screenIndividual(req: Request, res: Response) {
    try {
      const individualData = req.body;
      const result = await this.sanctionsService.screenIndividual(individualData);
      
      logger.info('Individual sanctions screening performed', { 
        name: individualData.name,
        result: result.status 
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Individual sanctions screening failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Sanctions screening failed'
      });
    }
  }

  async screenEntity(req: Request, res: Response) {
    try {
      const entityData = req.body;
      const result = await this.sanctionsService.screenEntity(entityData);
      
      logger.info('Entity sanctions screening performed', { 
        entity: entityData.name,
        result: result.status 
      });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Entity sanctions screening failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Sanctions screening failed'
      });
    }
  }

  async getWatchlists(req: Request, res: Response) {
    try {
      const watchlists = await this.sanctionsService.getWatchlists();
      
      res.status(200).json({
        success: true,
        data: watchlists
      });
    } catch (error) {
      logger.error('Get watchlists failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get watchlists'
      });
    }
  }

  // Enhanced Due Diligence Methods
  async initiateEDD(req: Request, res: Response) {
    try {
      const eddData = req.body;
      const result = await this.complianceService.initiateEDD(eddData);
      
      logger.info('EDD initiated', { eddId: result.id, userId: eddData.userId });
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('EDD initiation failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'EDD initiation failed'
      });
    }
  }

  async getEDDStatus(req: Request, res: Response) {
    try {
      const eddId = req.params.eddId;
      const status = await this.complianceService.getEDDStatus(eddId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Get EDD status failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get EDD status'
      });
    }
  }

  async completeEDD(req: Request, res: Response) {
    try {
      const eddId = req.params.eddId;
      const completionData = req.body;
      const result = await this.complianceService.completeEDD(eddId, completionData);
      
      logger.info('EDD completed', { eddId });
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('EDD completion failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'EDD completion failed'
      });
    }
  }

  // Configuration Methods
  async getComplianceRules(req: Request, res: Response) {
    try {
      const rules = await this.complianceService.getComplianceRules();
      
      res.status(200).json({
        success: true,
        data: rules
      });
    } catch (error) {
      logger.error('Get compliance rules failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get compliance rules'
      });
    }
  }

  async updateComplianceRules(req: Request, res: Response) {
    try {
      const rules = req.body;
      const result = await this.complianceService.updateComplianceRules(rules);
      
      logger.info('Compliance rules updated');
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Update compliance rules failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Rules update failed'
      });
    }
  }

  async getThresholds(req: Request, res: Response) {
    try {
      const thresholds = await this.complianceService.getThresholds();
      
      res.status(200).json({
        success: true,
        data: thresholds
      });
    } catch (error) {
      logger.error('Get thresholds failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get thresholds'
      });
    }
  }

  async updateThresholds(req: Request, res: Response) {
    try {
      const thresholds = req.body;
      const result = await this.complianceService.updateThresholds(thresholds);
      
      logger.info('Compliance thresholds updated');
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Update thresholds failed:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Thresholds update failed'
      });
    }
  }
}
