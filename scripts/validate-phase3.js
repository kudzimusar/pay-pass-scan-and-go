#!/usr/bin/env node

/**
 * PayPass Phase 3 Validation Script
<<<<<<< HEAD
 * Validates completion of Phase 3 requirements according to PLAN.md
 * Focus: Microservices migration, advanced features, business expansion
=======
 * 
 * Validates the implementation of Phase 3 requirements:
 * - Microservices Architecture Migration
 * - Advanced Analytics & Reporting
 * - AI-Powered Fraud Detection
 * - International Compliance
 * - Mobile App Development
 * - Enterprise Features
 * - Advanced API Management
 * - Performance Optimization
 * - Scalability Improvements
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
<<<<<<< HEAD

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
=======
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
};

class Phase3Validator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
<<<<<<< HEAD
      total: 0
    };
    this.report = [];
    this.categories = {
      microservices: { passed: 0, total: 0 },
      analytics: { passed: 0, total: 0 },
      fraudDetection: { passed: 0, total: 0 },
      compliance: { passed: 0, total: 0 },
      mobileApp: { passed: 0, total: 0 },
      enterprise: { passed: 0, total: 0 },
      apiManagement: { passed: 0, total: 0 },
      performance: { passed: 0, total: 0 },
      scalability: { passed: 0, total: 0 }
    };
=======
      total: 0,
      details: [],
      featureBreakdown: {},
    };
    this.startTime = new Date();
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = type === 'pass' ? colors.green : 
                  type === 'fail' ? colors.red : 
<<<<<<< HEAD
                  type === 'warn' ? colors.yellow : colors.blue;
    
    console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
    this.report.push({ timestamp, type, message });
  }

  checkFile(filePath, description, category = null) {
    const fullPath = path.join(rootDir, filePath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      this.log(`✓ ${description}: ${filePath}`, 'pass');
      this.results.passed++;
      if (category) this.categories[category].passed++;
    } else {
      this.log(`✗ ${description}: ${filePath} (missing)`, 'fail');
      this.results.failed++;
    }
    
    this.results.total++;
    if (category) this.categories[category].total++;
    return exists;
  }

  checkDirectory(dirPath, description, category = null) {
    const fullPath = path.join(rootDir, dirPath);
    const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    
    if (exists) {
      this.log(`✓ ${description}: ${dirPath}`, 'pass');
      this.results.passed++;
      if (category) this.categories[category].passed++;
    } else {
      this.log(`✗ ${description}: ${dirPath} (missing)`, 'fail');
      this.results.failed++;
    }
    
    this.results.total++;
    if (category) this.categories[category].total++;
    return exists;
  }

  checkFileContent(filePath, searchPattern, description, category = null) {
    const fullPath = path.join(rootDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`✗ ${description}: ${filePath} (file missing)`, 'fail');
      this.results.failed++;
      this.results.total++;
      if (category) this.categories[category].total++;
      return false;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasPattern = typeof searchPattern === 'string' 
        ? content.includes(searchPattern)
        : searchPattern.test(content);
      
      if (hasPattern) {
        this.log(`✓ ${description}`, 'pass');
        this.results.passed++;
        if (category) this.categories[category].passed++;
      } else {
        this.log(`✗ ${description} (pattern not found)`, 'fail');
        this.results.failed++;
      }
      
      this.results.total++;
      if (category) this.categories[category].total++;
      return hasPattern;
    } catch (error) {
      this.log(`✗ ${description}: Error reading file - ${error.message}`, 'fail');
      this.results.failed++;
      this.results.total++;
      if (category) this.categories[category].total++;
      return false;
    }
  }

  validateMicroservicesArchitecture() {
    this.log(`${colors.bold}=== 1. Microservices Architecture Migration ===${colors.reset}`);
    
    // Core microservices
    this.checkDirectory('services', 'Services directory', 'microservices');
    this.checkDirectory('services/user-service', 'User Service', 'microservices');
    this.checkDirectory('services/payment-service', 'Payment Service', 'microservices');
    this.checkDirectory('services/wallet-service', 'Wallet Service', 'microservices');
    this.checkDirectory('services/api-gateway', 'API Gateway Service', 'microservices');
    
    // Service configurations
    this.checkFile('services/user-service/package.json', 'User Service Config', 'microservices');
    this.checkFile('services/payment-service/package.json', 'Payment Service Config', 'microservices');
    this.checkFile('services/wallet-service/package.json', 'Wallet Service Config', 'microservices');
    this.checkFile('services/api-gateway/package.json', 'API Gateway Config', 'microservices');
    
    // Service implementations
    this.checkFile('services/user-service/src/index.ts', 'User Service Implementation', 'microservices');
    this.checkFile('services/payment-service/src/index.ts', 'Payment Service Implementation', 'microservices');
    this.checkFile('services/wallet-service/src/index.ts', 'Wallet Service Implementation', 'microservices');
    this.checkFile('services/api-gateway/src/index.ts', 'API Gateway Implementation', 'microservices');
    
    // Service communication patterns
    this.checkFileContent('services/api-gateway/src/index.ts', 'express', 'Event Bus Pattern', 'microservices');
    this.checkFileContent('services/user-service/src/index.ts', 'express', 'Service Discovery', 'microservices');
    
    // Container orchestration
    this.checkFile('docker-compose.yml', 'Docker Compose Configuration', 'microservices');
    this.checkFile('services/user-service/Dockerfile', 'User Service Docker', 'microservices');
    this.checkFile('services/payment-service/Dockerfile', 'Payment Service Docker', 'microservices');
  }

  validateAdvancedAnalytics() {
    this.log(`${colors.bold}=== 2. Advanced Analytics & Reporting ===${colors.reset}`);
    
    // Analytics components
    this.checkDirectory('components/analytics', 'Analytics Components', 'analytics');
    this.checkFile('components/analytics/dashboard.tsx', 'Analytics Dashboard', 'analytics');
    this.checkFile('components/analytics/real-time-metrics.tsx', 'Real-time Metrics', 'analytics');
    this.checkFile('components/analytics/business-intelligence.tsx', 'Business Intelligence', 'analytics');
    
    // Analytics APIs
    this.checkDirectory('app/api/analytics', 'Analytics API', 'analytics');
    this.checkFile('app/api/analytics/transactions/route.ts', 'Transaction Analytics', 'analytics');
    this.checkFile('app/api/analytics/users/route.ts', 'User Analytics', 'analytics');
    this.checkFile('app/api/analytics/revenue/route.ts', 'Revenue Analytics', 'analytics');
    this.checkFile('app/api/analytics/fraud/route.ts', 'Fraud Analytics', 'analytics');
    this.checkFile('app/api/analytics/performance/route.ts', 'Performance Analytics', 'analytics');
    
    // Analytics service
    this.checkDirectory('services/analytics-service', 'Analytics Service', 'analytics');
    this.checkFile('services/analytics-service/src/index.ts', 'Analytics Service Implementation', 'analytics');
  }

  validateAIFraudDetection() {
    this.log(`${colors.bold}=== 3. AI-Powered Fraud Detection ===${colors.reset}`);
    
    // AI Fraud Detection Service
    this.checkDirectory('services/ai-fraud-detection', 'AI Fraud Detection Service', 'fraudDetection');
    this.checkFile('services/ai-fraud-detection/package.json', 'AI Service Config', 'fraudDetection');
    this.checkFile('services/ai-fraud-detection/src/index.ts', 'AI Service Implementation', 'fraudDetection');
    
    // ML Models and algorithms
    this.checkFile('services/ai-fraud-detection/src/ml/ModelManager.ts', 'ML Model Manager', 'fraudDetection');
    this.checkFileContent('services/ai-fraud-detection/package.json', 'tensorflow', 'TensorFlow.js Integration', 'fraudDetection');
    
    // Fraud Detection APIs
    this.checkFile('services/ai-fraud-detection/src/routes/fraudRoutes.ts', 'Fraud Detection API', 'fraudDetection');
    this.checkFileContent('services/ai-fraud-detection/src/ml/ModelManager.ts', 'anomalyDetection', 'Anomaly Detection', 'fraudDetection');
    this.checkFileContent('services/ai-fraud-detection/src/ml/ModelManager.ts', 'riskScoring', 'Risk Assessment', 'fraudDetection');
    
    // Real-time processing
    this.checkFileContent('services/ai-fraud-detection/src/index.ts', 'real.*time', 'Real-time Processing', 'fraudDetection');
    this.checkFile('app/api/fraud-detection/route.ts', 'Fraud Detection Endpoint', 'fraudDetection');
    
    // ML dependencies
    this.checkFileContent('services/ai-fraud-detection/package.json', 'scikit-learn', 'ML Dependencies', 'fraudDetection');
  }

  validateInternationalCompliance() {
    this.log(`${colors.bold}=== 4. International Compliance ===${colors.reset}`);
    
    // Compliance service
    this.checkDirectory('services/compliance-service', 'Compliance Service', 'compliance');
    this.checkFile('services/compliance-service/package.json', 'Compliance Service Config', 'compliance');
    this.checkFile('services/compliance-service/src/index.ts', 'Compliance Service Implementation', 'compliance');
    
    // KYC/AML System
    this.checkFile('components/compliance/kyc-form.tsx', 'KYC Form Component', 'compliance');
    this.checkFile('components/compliance/aml-check.tsx', 'AML Check Component', 'compliance');
    this.checkFile('components/compliance/compliance-status.tsx', 'Compliance Status', 'compliance');
    this.checkFile('components/compliance/regulatory-report.tsx', 'Regulatory Reports', 'compliance');
    
    // Compliance APIs
    this.checkFile('services/compliance-service/src/routes/complianceRoutes.ts', 'Compliance API Routes', 'compliance');
    this.checkFile('services/compliance-service/src/controllers/ComplianceController.ts', 'Compliance Controller', 'compliance');
    
    // AML Screening
    this.checkFileContent('services/compliance-service/src/controllers/ComplianceController.ts', 'amlScreening', 'AML Screening', 'compliance');
    this.checkFileContent('components/compliance/aml-check.tsx', 'sanctions', 'Sanctions Screening', 'compliance');
    
    // Regulatory compliance
    this.checkFileContent('services/compliance-service/src/index.ts', 'regulatory', 'Regulatory Reporting', 'compliance');
    this.checkFileContent('components/compliance/regulatory-report.tsx', 'compliance.*report', 'Compliance Dashboard', 'compliance');
    
    // Document verification
    this.checkFileContent('components/compliance/kyc-form.tsx', 'document.*upload', 'Document Verification', 'compliance');
  }

  validateMobileAppDevelopment() {
    this.log(`${colors.bold}=== 5. Mobile App Development ===${colors.reset}`);
    
    // Note: Mobile app development is typically in a separate repo
    // We'll check for mobile-related API endpoints and components
    this.log(`⚠ Mobile app development typically requires separate React Native project`, 'warn');
    
    // Mobile API endpoints
    this.checkDirectory('app/api/mobile', 'Mobile API Directory', 'mobileApp');
    this.checkFile('app/api/mobile/auth/route.ts', 'Mobile Auth API', 'mobileApp');
    this.checkFile('app/api/mobile/payments/route.ts', 'Mobile Payment API', 'mobileApp');
    this.checkFile('app/api/mobile/notifications/route.ts', 'Mobile Push Notifications', 'mobileApp');
    this.checkFile('app/api/mobile/qr-scanner/route.ts', 'Mobile QR Scanner API', 'mobileApp');
    
    // Mobile-optimized components (if any)
    this.checkDirectory('components/mobile', 'Mobile Components', 'mobileApp');
    this.checkFile('components/mobile/mobile-scanner.tsx', 'Mobile Scanner Component', 'mobileApp');
    
    // React Native project structure (if exists)
    this.checkFile('mobile/package.json', 'React Native App Config', 'mobileApp');
    this.checkFile('mobile/App.tsx', 'React Native App Entry', 'mobileApp');
  }

  validateEnterpriseFeatures() {
    this.log(`${colors.bold}=== 6. Enterprise Features ===${colors.reset}`);
    
    // Enterprise components
    this.checkDirectory('components/enterprise', 'Enterprise Components', 'enterprise');
    this.checkFile('components/enterprise/account-management.tsx', 'Enterprise Account Management', 'enterprise');
    this.checkFile('components/enterprise/billing-dashboard.tsx', 'Enterprise Billing Dashboard', 'enterprise');
    this.checkFile('components/enterprise/bulk-payments.tsx', 'Bulk Payment Processing', 'enterprise');
    
    // Enterprise APIs
    this.checkDirectory('app/api/enterprise', 'Enterprise API', 'enterprise');
    this.checkFile('app/api/enterprise/accounts/route.ts', 'Corporate Account Management', 'enterprise');
    this.checkFile('app/api/enterprise/billing/route.ts', 'Enterprise Billing', 'enterprise');
    this.checkFile('app/api/enterprise/bulk-payments/route.ts', 'Bulk Payment API', 'enterprise');
    
    // Multi-tenant support
    this.checkFileContent('shared/schema.ts', 'tenant', 'Multi-tenant Support', 'enterprise');
    this.checkFileContent('components/enterprise/account-management.tsx', 'corporate', 'Corporate Account Features', 'enterprise');
    
    // Enterprise dashboard
    this.checkFile('app/enterprise/page.tsx', 'Enterprise Dashboard Page', 'enterprise');
    this.checkFileContent('components/enterprise/billing-dashboard.tsx', 'enterprise.*billing', 'Enterprise Billing System', 'enterprise');
  }

  validateAdvancedAPIManagement() {
    this.log(`${colors.bold}=== 7. Advanced API Management ===${colors.reset}`);
    
    // API Gateway Service
    this.checkDirectory('services/api-gateway', 'API Gateway Service', 'apiManagement');
    this.checkFile('services/api-gateway/src/index.ts', 'API Gateway Implementation', 'apiManagement');
    
    // API Management components
    this.checkDirectory('components/api-management', 'API Management Components', 'apiManagement');
    this.checkFile('components/api-management/api-dashboard.tsx', 'API Dashboard', 'apiManagement');
    this.checkFile('components/api-management/rate-limiting.tsx', 'Rate Limiting UI', 'apiManagement');
    
    // API documentation
    this.checkFile('docs/api/openapi.yaml', 'OpenAPI Documentation', 'apiManagement');
    this.checkFile('app/api/docs/route.ts', 'API Documentation Endpoint', 'apiManagement');
    
    // Rate limiting and monitoring
    this.checkFileContent('services/api-gateway/src/index.ts', 'rate.*limit', 'Rate Limiting', 'apiManagement');
    this.checkFileContent('services/api-gateway/src/index.ts', 'monitoring', 'API Monitoring', 'apiManagement');
    
    // API versioning
    this.checkFileContent('services/api-gateway/src/index.ts', 'version', 'API Versioning', 'apiManagement');
    this.checkFile('app/api/v1/route.ts', 'API Versioning Implementation', 'apiManagement');
    
    // Service discovery
    this.checkFileContent('services/api-gateway/src/index.ts', 'discovery', 'Service Discovery', 'apiManagement');
    this.checkFile('app/api/health/route.ts', 'Health Check Endpoint', 'apiManagement');
  }

  validatePerformanceOptimization() {
    this.log(`${colors.bold}=== 8. Performance Optimization ===${colors.reset}`);
    
    // Caching strategy
    this.checkFileContent('app/api/_lib/redis.ts', 'redis', 'Redis Caching', 'performance');
    this.checkFileContent('next.config.mjs', 'compress', 'Compression Configuration', 'performance');
    
    // Database optimization
    this.checkFileContent('shared/schema.ts', 'index', 'Database Indexing', 'performance');
    this.checkFile('app/api/_lib/performance-monitor.ts', 'Performance Monitoring', 'performance');
    
    // CDN configuration
    this.checkFileContent('next.config.mjs', 'cdn', 'CDN Configuration', 'performance');
    this.checkFile('public/.well-known/assetlinks.json', 'Asset Links', 'performance');
    
    // Image optimization
    this.checkFileContent('next.config.mjs', 'image', 'Image Optimization', 'performance');
    
    // Bundle optimization
    this.checkFileContent('next.config.mjs', 'webpack', 'Bundle Optimization', 'performance');
    this.checkFileContent('package.json', 'analyze', 'Bundle Analysis', 'performance');
    
    // Performance monitoring
    this.checkFile('app/api/performance/metrics/route.ts', 'Performance Metrics API', 'performance');
    this.checkFileContent('app/api/_lib/performance-monitor.ts', 'monitor', 'Performance Monitoring', 'performance');
  }

  validateScalabilityImprovements() {
    this.log(`${colors.bold}=== 9. Scalability Improvements ===${colors.reset}`);
    
    // Horizontal scaling
    this.checkFile('docker-compose.yml', 'Docker Compose for Scaling', 'scalability');
    this.checkFile('kubernetes/deployment.yaml', 'Kubernetes Deployment', 'scalability');
    
    // Load balancing
    this.checkFileContent('services/api-gateway/src/index.ts', 'load.*balanc', 'Load Balancing', 'scalability');
    this.checkFile('nginx.conf', 'Load Balancer Configuration', 'scalability');
    
    // Auto-scaling configuration
    this.checkFile('kubernetes/hpa.yaml', 'Horizontal Pod Autoscaler', 'scalability');
    this.checkFileContent('docker-compose.yml', 'replicas', 'Service Replication', 'scalability');
    
    // Database sharding
    this.checkFileContent('app/api/_lib/drizzle.ts', 'shard', 'Database Sharding', 'scalability');
    this.checkFile('services/database-router/src/index.ts', 'Database Router Service', 'scalability');
    
    // Microservices communication
    this.checkFileContent('services/api-gateway/src/index.ts', 'circuit.*breaker', 'Circuit Breaker Pattern', 'scalability');
    this.checkFileContent('services/user-service/src/index.ts', 'saga', 'SAGA Pattern', 'scalability');
    
    // Distributed caching
    this.checkFileContent('app/api/_lib/redis.ts', 'cluster', 'Redis Clustering', 'scalability');
    this.checkFile('services/cache-service/src/index.ts', 'Distributed Cache Service', 'scalability');
  }

  calculateCategoryScore(category) {
    const { passed, total } = this.categories[category];
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  calculateOverallScore() {
    const { passed, total } = this.results;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  generateReport() {
    const score = this.calculateOverallScore();
    const passThreshold = 85; // 85% as per Phase 3 advanced requirements
    
    this.log(`${colors.bold}=== PHASE 3 VALIDATION SUMMARY ===${colors.reset}`);
    
    // Category scores
    Object.entries(this.categories).forEach(([category, data]) => {
      const categoryScore = this.calculateCategoryScore(category);
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
      this.log(`${categoryName}: ${categoryScore}% (${data.passed}/${data.total})`, 
        categoryScore >= 85 ? 'pass' : categoryScore >= 50 ? 'warn' : 'fail');
    });
    
    this.log(`\nTotal Checks: ${this.results.total}`);
    this.log(`Passed: ${this.results.passed}`, 'pass');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'fail' : 'info');
    this.log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'warn' : 'info');
    this.log(`Overall Score: ${score}%`, score >= passThreshold ? 'pass' : 'fail');
    
    if (score >= passThreshold) {
      this.log(`${colors.green}${colors.bold}✓ PHASE 3 VALIDATION PASSED!${colors.reset}`);
      this.log(`PayPass Phase 3 implementation meets the required standards.`);
      this.log(`Ready for production deployment and Phase 4 planning.`);
    } else {
      this.log(`${colors.red}${colors.bold}✗ PHASE 3 VALIDATION FAILED${colors.reset}`);
      this.log(`Score ${score}% is below the required ${passThreshold}% threshold.`);
      this.log(`Please address the failed checks before proceeding to Phase 4.`);
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      phase: 3,
      score,
      passThreshold,
      passed: score >= passThreshold,
      results: this.results,
      categoryScores: Object.fromEntries(
        Object.entries(this.categories).map(([key, data]) => [
          key, { ...data, score: this.calculateCategoryScore(key) }
        ])
      ),
      details: this.report
    };
    
    const reportPath = path.join(rootDir, 'phase3-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    this.log(`Detailed report saved to: phase3-validation-report.json`);
    
    return score >= passThreshold;
  }

  run() {
    this.log(`${colors.bold}PayPass Phase 3 Validation Started${colors.reset}`);
    this.log(`Validating against PLAN.md Phase 3 requirements...`);
    this.log(`Focus: Microservices migration, advanced features, business expansion\n`);
    
    this.validateMicroservicesArchitecture();
    this.validateAdvancedAnalytics();
    this.validateAIFraudDetection();
    this.validateInternationalCompliance();
    this.validateMobileAppDevelopment();
    this.validateEnterpriseFeatures();
    this.validateAdvancedAPIManagement();
    this.validatePerformanceOptimization();
    this.validateScalabilityImprovements();
    
    return this.generateReport();
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new Phase3Validator();
  const passed = validator.run();
  process.exit(passed ? 0 : 1);
}

export { Phase3Validator };
=======
                  type === 'warning' ? colors.yellow : colors.reset;
    
    this.results.details.push({
      timestamp,
      type,
      message: `${color}${message}${colors.reset}`,
    });
    
    console.log(`${color}${message}${colors.reset}`);
  }

  async validatePhase3() {
    this.log(`${colors.bright}${colors.magenta}PayPass Phase 3 Validation Started${colors.reset}`);
    this.log('Validating against PLAN.md Phase 3 requirements...');
    this.log(`${colors.cyan}Phase 3 Focus: Microservices migration, advanced features, business expansion${colors.reset}`);
    
    // Phase 3 Core Requirements Validation
    await this.validateMicroservicesArchitecture();
    await this.validateAdvancedAnalytics();
    await this.validateAIFraudDetection();
    await this.validateInternationalCompliance();
    await this.validateMobileAppDevelopment();
    await this.validateEnterpriseFeatures();
    await this.validateAdvancedAPIManagement();
    await this.validatePerformanceOptimization();
    await this.validateScalabilityImprovements();
    
    // Calculate final score
    const score = this.calculateScore();
    const passed = score >= 85; // Phase 3 requires 85%+ success rate
    
    this.log('\n' + '='.repeat(60));
    this.log(`${colors.bright}Phase 3 Validation Results${colors.reset}`);
    this.log(`${colors.cyan}Score: ${score}%${colors.reset}`);
    this.log(`${colors.cyan}Pass Threshold: 85%${colors.reset}`);
    this.log(`${colors.cyan}Status: ${passed ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
    this.log(`${colors.cyan}Passed: ${this.results.passed}${colors.reset}`);
    this.log(`${colors.cyan}Failed: ${this.results.failed}${colors.reset}`);
    this.log(`${colors.cyan}Warnings: ${this.results.warnings}${colors.reset}`);
    this.log(`${colors.cyan}Total: ${this.results.total}${colors.reset}`);
    
    // Feature breakdown
    this.log('\n' + colors.bright + 'Feature Breakdown:' + colors.reset);
    Object.entries(this.results.featureBreakdown).forEach(([feature, score]) => {
      const color = score >= 85 ? colors.green : score >= 70 ? colors.yellow : colors.red;
      this.log(`${color}${feature}: ${score}%${colors.reset}`);
    });
    
    // Recommendations
    this.log('\n' + colors.bright + 'Recommendations:' + colors.reset);
    if (passed) {
      this.log(`${colors.green}✓ Phase 3 requirements met! Ready for production deployment.${colors.reset}`);
      this.log(`${colors.cyan}Next steps:${colors.reset}`);
      this.log('  - Deploy microservices to production');
      this.log('  - Monitor performance and scalability');
      this.log('  - Begin Phase 4 planning (Innovation & Growth)');
    } else {
      this.log(`${colors.red}✗ Phase 3 requirements not fully met.${colors.reset}`);
      this.log(`${colors.yellow}Priority fixes needed:${colors.reset}`);
      this.getRecommendations();
    }
    
    // Save validation report
    this.saveValidationReport(score, passed);
    
    return { score, passed, results: this.results };
  }

  async validateMicroservicesArchitecture() {
    this.log('\n' + colors.bright + '=== Microservices Architecture Validation ===' + colors.reset);
    
    const microservicesChecks = [
      // Service extraction validation
      { name: 'Notification Service', path: 'services/notification-service', required: true },
      { name: 'Analytics Service', path: 'services/analytics-service', required: true },
      { name: 'User Service', path: 'services/user-service', required: true },
      { name: 'Wallet Service', path: 'services/wallet-service', required: true },
      { name: 'Payment Service', path: 'services/payment-service', required: true },
      { name: 'Cross-Border Service', path: 'services/cross-border-service', required: true },
      { name: 'Mobile Money Service', path: 'services/mobile-money-service', required: true },
      { name: 'Bank Service', path: 'services/bank-service', required: false },
      { name: 'Fraud Service', path: 'services/fraud-service', required: false },
      
      // Infrastructure validation
      { name: 'API Gateway', path: 'services/api-gateway', required: true },
      { name: 'Service Registry', path: 'services/service-registry', required: true },
      { name: 'Message Queue', path: 'services/message-queue', required: true },
      { name: 'Configuration Service', path: 'services/config-service', required: true },
    ];
    
    let passed = 0;
    let total = 0;
    
    for (const check of microservicesChecks) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}: ${check.path}${colors.reset}`);
        passed++;
      } else if (check.required) {
        this.log(`${colors.red}✗ ${check.name}: ${check.path} (Required)${colors.reset}`);
        this.results.failed++;
      } else {
        this.log(`${colors.yellow}⚠ ${check.name}: ${check.path} (Optional)${colors.reset}`);
        this.results.warnings++;
      }
    }
    
    // Check for Docker/Kubernetes configuration
    const dockerChecks = [
      { name: 'Docker Compose', path: 'docker-compose.yml' },
      { name: 'Kubernetes Configs', path: 'k8s/' },
      { name: 'Service Dockerfiles', path: 'services/*/Dockerfile' },
    ];
    
    for (const check of dockerChecks) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.yellow}⚠ ${check.name} (Recommended)${colors.reset}`);
        this.results.warnings++;
      }
    }
    
    // Check for service communication patterns
    const communicationChecks = [
      { name: 'Event Bus Implementation', path: 'lib/event-bus.ts' },
      { name: 'SAGA Pattern', path: 'lib/saga-pattern.ts' },
      { name: 'Circuit Breaker', path: 'lib/circuit-breaker.ts' },
      { name: 'Service Discovery', path: 'lib/service-discovery.ts' },
    ];
    
    for (const check of communicationChecks) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name} (Required)${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Microservices Architecture'] = Math.round((passed / total) * 100);
  }

  async validateAdvancedAnalytics() {
    this.log('\n' + colors.bright + '=== Advanced Analytics & Reporting Validation ===' + colors.reset);
    
    const analyticsChecks = [
      { name: 'Analytics Dashboard', path: 'app/analytics/page.tsx' },
      { name: 'Real-time Metrics', path: 'app/analytics/real-time/page.tsx' },
      { name: 'Business Intelligence', path: 'app/analytics/business-intelligence/page.tsx' },
      { name: 'Transaction Analytics', path: 'app/analytics/transactions/page.tsx' },
      { name: 'User Analytics', path: 'app/analytics/users/page.tsx' },
      { name: 'Revenue Analytics', path: 'app/analytics/revenue/page.tsx' },
      { name: 'Fraud Analytics', path: 'app/analytics/fraud/page.tsx' },
      { name: 'Performance Analytics', path: 'app/analytics/performance/page.tsx' },
    ];
    
    let passed = 0;
    let total = analyticsChecks.length;
    
    for (const check of analyticsChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for analytics API endpoints
    const analyticsAPIs = [
      'app/api/analytics/transactions/route.ts',
      'app/api/analytics/users/route.ts',
      'app/api/analytics/revenue/route.ts',
      'app/api/analytics/fraud/route.ts',
      'app/api/analytics/performance/route.ts',
    ];
    
    for (const api of analyticsAPIs) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, api));
      if (exists) {
        this.log(`${colors.green}✓ Analytics API: ${api}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Analytics API: ${api}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for data visualization components
    const vizComponents = [
      'components/analytics/charts/transaction-chart.tsx',
      'components/analytics/charts/revenue-chart.tsx',
      'components/analytics/charts/user-growth-chart.tsx',
      'components/analytics/charts/fraud-detection-chart.tsx',
      'components/analytics/dashboard/analytics-dashboard.tsx',
    ];
    
    for (const component of vizComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Analytics Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Analytics Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Advanced Analytics'] = Math.round((passed / total) * 100);
  }

  async validateAIFraudDetection() {
    this.log('\n' + colors.bright + '=== AI-Powered Fraud Detection Validation ===' + colors.reset);
    
    const aiChecks = [
      { name: 'AI Fraud Detection Service', path: 'services/fraud-service' },
      { name: 'Machine Learning Models', path: 'ml/models/' },
      { name: 'Fraud Detection API', path: 'app/api/fraud-detection/route.ts' },
      { name: 'Real-time Risk Assessment', path: 'app/api/fraud-detection/risk-assessment/route.ts' },
      { name: 'Fraud Pattern Analysis', path: 'app/api/fraud-detection/pattern-analysis/route.ts' },
      { name: 'Anomaly Detection', path: 'app/api/fraud-detection/anomaly/route.ts' },
    ];
    
    let passed = 0;
    let total = aiChecks.length;
    
    for (const check of aiChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for AI/ML dependencies
    const mlDependencies = [
      'package.json',
      'ml/requirements.txt',
      'ml/Dockerfile',
    ];
    
    for (const dep of mlDependencies) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, dep));
      if (exists) {
        // Check if ML dependencies are included
        if (dep === 'package.json') {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, dep), 'utf8'));
            const mlDeps = ['tensorflow', 'scikit-learn', 'pandas', 'numpy'];
            const hasMLDeps = mlDeps.some(d => packageJson.dependencies?.[d] || packageJson.devDependencies?.[d]);
            
            if (hasMLDeps) {
              this.log(`${colors.green}✓ ML Dependencies in package.json${colors.reset}`);
              passed++;
            } else {
              this.log(`${colors.yellow}⚠ ML Dependencies not found in package.json${colors.reset}`);
              this.results.warnings++;
            }
          } catch (error) {
            this.log(`${colors.red}✗ Error reading package.json${colors.reset}`);
            this.results.failed++;
          }
        } else {
          this.log(`${colors.green}✓ ${dep}${colors.reset}`);
          passed++;
        }
      } else {
        this.log(`${colors.yellow}⚠ ${dep} (Optional)${colors.reset}`);
        this.results.warnings++;
      }
    }
    
    // Check for fraud detection components
    const fraudComponents = [
      'components/fraud-detection/risk-indicator.tsx',
      'components/fraud-detection/fraud-alert.tsx',
      'components/fraud-detection/transaction-risk.tsx',
      'components/fraud-detection/fraud-dashboard.tsx',
    ];
    
    for (const component of fraudComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Fraud Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Fraud Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['AI Fraud Detection'] = Math.round((passed / total) * 100);
  }

  async validateInternationalCompliance() {
    this.log('\n' + colors.bright + '=== International Compliance Validation ===' + colors.reset);
    
    const complianceChecks = [
      { name: 'KYC/AML Compliance', path: 'app/api/compliance/kyc/route.ts' },
      { name: 'AML Screening', path: 'app/api/compliance/aml/route.ts' },
      { name: 'Regulatory Reporting', path: 'app/api/compliance/reporting/route.ts' },
      { name: 'Sanctions Screening', path: 'app/api/compliance/sanctions/route.ts' },
      { name: 'Compliance Dashboard', path: 'app/compliance/page.tsx' },
      { name: 'Regulatory Documentation', path: 'docs/compliance/' },
    ];
    
    let passed = 0;
    let total = complianceChecks.length;
    
    for (const check of complianceChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for compliance components
    const complianceComponents = [
      'components/compliance/kyc-form.tsx',
      'components/compliance/aml-check.tsx',
      'components/compliance/compliance-status.tsx',
      'components/compliance/regulatory-report.tsx',
    ];
    
    for (const component of complianceComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Compliance Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Compliance Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['International Compliance'] = Math.round((passed / total) * 100);
  }

  async validateMobileAppDevelopment() {
    this.log('\n' + colors.bright + '=== Mobile App Development Validation ===' + colors.reset);
    
    const mobileChecks = [
      { name: 'React Native App', path: 'mobile/' },
      { name: 'Mobile API Endpoints', path: 'app/api/mobile/' },
      { name: 'Mobile Authentication', path: 'app/api/mobile/auth/route.ts' },
      { name: 'Mobile Payment API', path: 'app/api/mobile/payments/route.ts' },
      { name: 'Mobile Push Notifications', path: 'app/api/mobile/notifications/route.ts' },
      { name: 'Mobile QR Scanner', path: 'mobile/components/qr-scanner.tsx' },
    ];
    
    let passed = 0;
    let total = mobileChecks.length;
    
    for (const check of mobileChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.yellow}⚠ ${check.name} (Optional for Phase 3)${colors.reset}`);
        this.results.warnings++;
      }
    }
    
    // Check for mobile-specific configurations
    const mobileConfigs = [
      'mobile/package.json',
      'mobile/app.json',
      'mobile/metro.config.js',
    ];
    
    for (const config of mobileConfigs) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, config));
      if (exists) {
        this.log(`${colors.green}✓ Mobile Config: ${config}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.yellow}⚠ Mobile Config: ${config} (Optional)${colors.reset}`);
        this.results.warnings++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Mobile App Development'] = Math.round((passed / total) * 100);
  }

  async validateEnterpriseFeatures() {
    this.log('\n' + colors.bright + '=== Enterprise Features Validation ===' + colors.reset);
    
    const enterpriseChecks = [
      { name: 'Enterprise Dashboard', path: 'app/enterprise/page.tsx' },
      { name: 'Bulk Payment Processing', path: 'app/enterprise/bulk-payments/page.tsx' },
      { name: 'Corporate Account Management', path: 'app/enterprise/accounts/page.tsx' },
      { name: 'Enterprise API Management', path: 'app/api/enterprise/' },
      { name: 'Multi-tenant Support', path: 'lib/multi-tenant.ts' },
      { name: 'Enterprise Billing', path: 'app/enterprise/billing/page.tsx' },
    ];
    
    let passed = 0;
    let total = enterpriseChecks.length;
    
    for (const check of enterpriseChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for enterprise components
    const enterpriseComponents = [
      'components/enterprise/bulk-payment-form.tsx',
      'components/enterprise/corporate-dashboard.tsx',
      'components/enterprise/account-management.tsx',
      'components/enterprise/billing-dashboard.tsx',
    ];
    
    for (const component of enterpriseComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Enterprise Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Enterprise Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Enterprise Features'] = Math.round((passed / total) * 100);
  }

  async validateAdvancedAPIManagement() {
    this.log('\n' + colors.bright + '=== Advanced API Management Validation ===' + colors.reset);
    
    const apiChecks = [
      { name: 'API Gateway Service', path: 'services/api-gateway' },
      { name: 'API Documentation', path: 'docs/api/' },
      { name: 'API Versioning', path: 'lib/api-versioning.ts' },
      { name: 'Rate Limiting', path: 'lib/rate-limiting.ts' },
      { name: 'API Monitoring', path: 'app/api/monitoring/route.ts' },
      { name: 'API Analytics', path: 'app/api/analytics/api-usage/route.ts' },
    ];
    
    let passed = 0;
    let total = apiChecks.length;
    
    for (const check of apiChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for API management components
    const apiComponents = [
      'components/api-management/api-dashboard.tsx',
      'components/api-management/rate-limit-monitor.tsx',
      'components/api-management/api-analytics.tsx',
    ];
    
    for (const component of apiComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ API Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ API Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Advanced API Management'] = Math.round((passed / total) * 100);
  }

  async validatePerformanceOptimization() {
    this.log('\n' + colors.bright + '=== Performance Optimization Validation ===' + colors.reset);
    
    const performanceChecks = [
      { name: 'Caching Strategy', path: 'lib/caching.ts' },
      { name: 'Database Optimization', path: 'lib/database-optimization.ts' },
      { name: 'CDN Configuration', path: 'next.config.js' },
      { name: 'Image Optimization', path: 'lib/image-optimization.ts' },
      { name: 'Bundle Optimization', path: 'vite.config.ts' },
      { name: 'Performance Monitoring', path: 'lib/performance-monitoring.ts' },
    ];
    
    let passed = 0;
    let total = performanceChecks.length;
    
    for (const check of performanceChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for performance components
    const performanceComponents = [
      'components/performance/performance-dashboard.tsx',
      'components/performance/load-time-monitor.tsx',
      'components/performance/optimization-suggestions.tsx',
    ];
    
    for (const component of performanceComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Performance Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Performance Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Performance Optimization'] = Math.round((passed / total) * 100);
  }

  async validateScalabilityImprovements() {
    this.log('\n' + colors.bright + '=== Scalability Improvements Validation ===' + colors.reset);
    
    const scalabilityChecks = [
      { name: 'Horizontal Scaling', path: 'lib/horizontal-scaling.ts' },
      { name: 'Load Balancing', path: 'lib/load-balancing.ts' },
      { name: 'Auto-scaling Configuration', path: 'k8s/autoscaling.yaml' },
      { name: 'Database Sharding', path: 'lib/database-sharding.ts' },
      { name: 'Microservices Communication', path: 'lib/service-communication.ts' },
      { name: 'Distributed Caching', path: 'lib/distributed-cache.ts' },
    ];
    
    let passed = 0;
    let total = scalabilityChecks.length;
    
    for (const check of scalabilityChecks) {
      const exists = fs.existsSync(path.join(projectRoot, check.path));
      if (exists) {
        this.log(`${colors.green}✓ ${check.name}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ ${check.name}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    // Check for scalability components
    const scalabilityComponents = [
      'components/scalability/scaling-dashboard.tsx',
      'components/scalability/load-monitor.tsx',
      'components/scalability/capacity-planning.tsx',
    ];
    
    for (const component of scalabilityComponents) {
      total++;
      const exists = fs.existsSync(path.join(projectRoot, component));
      if (exists) {
        this.log(`${colors.green}✓ Scalability Component: ${component}${colors.reset}`);
        passed++;
      } else {
        this.log(`${colors.red}✗ Scalability Component: ${component}${colors.reset}`);
        this.results.failed++;
      }
    }
    
    this.results.passed += passed;
    this.results.total += total;
    this.results.featureBreakdown['Scalability Improvements'] = Math.round((passed / total) * 100);
  }

  calculateScore() {
    if (this.results.total === 0) return 0;
    return Math.round((this.results.passed / this.results.total) * 100);
  }

  getRecommendations() {
    const recommendations = [];
    
    if (this.results.featureBreakdown['Microservices Architecture'] < 85) {
      recommendations.push('Complete microservices architecture migration');
      recommendations.push('Implement service communication patterns');
      recommendations.push('Set up container orchestration');
    }
    
    if (this.results.featureBreakdown['Advanced Analytics'] < 85) {
      recommendations.push('Implement comprehensive analytics dashboard');
      recommendations.push('Add real-time metrics and reporting');
      recommendations.push('Create business intelligence features');
    }
    
    if (this.results.featureBreakdown['AI Fraud Detection'] < 85) {
      recommendations.push('Deploy AI-powered fraud detection service');
      recommendations.push('Implement machine learning models');
      recommendations.push('Add real-time risk assessment');
    }
    
    if (this.results.featureBreakdown['International Compliance'] < 85) {
      recommendations.push('Complete KYC/AML compliance implementation');
      recommendations.push('Add regulatory reporting features');
      recommendations.push('Implement sanctions screening');
    }
    
    if (this.results.featureBreakdown['Enterprise Features'] < 85) {
      recommendations.push('Implement enterprise dashboard');
      recommendations.push('Add bulk payment processing');
      recommendations.push('Create corporate account management');
    }
    
    if (this.results.featureBreakdown['Advanced API Management'] < 85) {
      recommendations.push('Deploy API gateway service');
      recommendations.push('Implement comprehensive API documentation');
      recommendations.push('Add API monitoring and analytics');
    }
    
    if (this.results.featureBreakdown['Performance Optimization'] < 85) {
      recommendations.push('Implement caching strategies');
      recommendations.push('Optimize database queries');
      recommendations.push('Add performance monitoring');
    }
    
    if (this.results.featureBreakdown['Scalability Improvements'] < 85) {
      recommendations.push('Implement horizontal scaling');
      recommendations.push('Add load balancing');
      recommendations.push('Set up auto-scaling configuration');
    }
    
    recommendations.forEach(rec => this.log(`  - ${rec}`));
  }

  saveValidationReport(score, passed) {
    const report = {
      timestamp: new Date().toISOString(),
      phase: 3,
      score,
      passThreshold: 85,
      passed,
      results: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        total: this.results.total,
      },
      featureBreakdown: this.results.featureBreakdown,
      details: this.results.details,
    };
    
    const reportPath = path.join(projectRoot, 'phase3-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n${colors.cyan}Validation report saved to: phase3-validation-report.json${colors.reset}`);
  }
}

// Run validation
const validator = new Phase3Validator();
validator.validatePhase3().catch(console.error);
>>>>>>> 5369374451513e9b5f7afd9dc5a8e42ac51c60c6
