#!/usr/bin/env node

/**
 * PayPass Phase 3 Validation Script
 * Validates completion of Phase 3 requirements according to PLAN.md
 * Focus: Microservices migration, advanced features, business expansion
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
};

class Phase3Validator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
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
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = type === 'pass' ? colors.green : 
                  type === 'fail' ? colors.red : 
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
