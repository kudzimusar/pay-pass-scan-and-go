#!/usr/bin/env node

/**
 * PayPass Phase 1 Validation Script
 * Validates completion of Phase 1 requirements according to PLAN.md
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

class Phase1Validator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
    this.report = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const color = type === 'pass' ? colors.green : 
                  type === 'fail' ? colors.red : 
                  type === 'warn' ? colors.yellow : colors.blue;
    
    console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
    this.report.push({ timestamp, type, message });
  }

  checkFile(filePath, description) {
    const fullPath = path.join(rootDir, filePath);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      this.log(`✓ ${description}: ${filePath}`, 'pass');
      this.results.passed++;
    } else {
      this.log(`✗ ${description}: ${filePath} (missing)`, 'fail');
      this.results.failed++;
    }
    
    this.results.total++;
    return exists;
  }

  checkDirectory(dirPath, description) {
    const fullPath = path.join(rootDir, dirPath);
    const exists = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
    
    if (exists) {
      this.log(`✓ ${description}: ${dirPath}`, 'pass');
      this.results.passed++;
    } else {
      this.log(`✗ ${description}: ${dirPath} (missing)`, 'fail');
      this.results.failed++;
    }
    
    this.results.total++;
    return exists;
  }

  checkFileContent(filePath, searchPattern, description) {
    const fullPath = path.join(rootDir, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`✗ ${description}: ${filePath} (file missing)`, 'fail');
      this.results.failed++;
      this.results.total++;
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
      } else {
        this.log(`✗ ${description} (pattern not found)`, 'fail');
        this.results.failed++;
      }
      
      this.results.total++;
      return hasPattern;
    } catch (error) {
      this.log(`✗ ${description}: Error reading file - ${error.message}`, 'fail');
      this.results.failed++;
      this.results.total++;
      return false;
    }
  }

  validatePhase1Core() {
    this.log(`${colors.bold}=== Phase 1 Core Infrastructure Validation ===${colors.reset}`);
    
    // 1. Authentication System
    this.log(`${colors.blue}1. Authentication & Authorization System${colors.reset}`);
    this.checkDirectory('app/api/auth', 'Authentication API directory');
    this.checkFile('app/api/auth/mfa/setup/route.ts', 'MFA setup endpoint');
    this.checkFile('app/api/auth/mfa/verify/route.ts', 'MFA verification endpoint');
    this.checkFileContent('shared/schema.ts', 'mfaEnabled', 'MFA support in user schema');
    this.checkFileContent('shared/schema.ts', 'kycStatus', 'KYC status in user schema');
    
    // 2. Multi-User Dashboard Framework
    this.log(`${colors.blue}2. Multi-User Dashboard Framework${colors.reset}`);
    this.checkFile('app/dashboard/page.tsx', 'Dashboard page');
    this.checkFile('components/auth-provider.tsx', 'Authentication provider');
    this.checkFile('app/operator/page.tsx', 'Operator dashboard');
    
    // 3. QR Payment Infrastructure
    this.log(`${colors.blue}3. QR Payment Infrastructure${colors.reset}`);
    this.checkDirectory('app/api/qr', 'QR API directory');
    this.checkDirectory('app/qr-scanner', 'QR scanner page');
    this.checkFileContent('shared/schema.ts', 'qrCode', 'QR code support in routes schema');
    
    // 4. Pay for your Friend USP Implementation
    this.log(`${colors.blue}4. "Pay for your Friend" USP Implementation${colors.reset}`);
    this.checkFile('app/pay-for-friend/page.tsx', 'Pay for Friend main page');
    this.checkFile('components/friend-network-card.tsx', 'Friend network card component');
    this.checkFile('components/cross-border-payment-form.tsx', 'Cross-border payment form');
    this.checkDirectory('app/api/friend-network', 'Friend network API');
    this.checkDirectory('app/api/cross-border', 'Cross-border payment API');
    this.checkFileContent('shared/schema.ts', 'friendNetworks', 'Friend networks table');
    this.checkFileContent('shared/schema.ts', 'crossBorderPayments', 'Cross-border payments table');
    
    // 5. Database Schema & API Foundation
    this.log(`${colors.blue}5. Database Schema & API Foundation${colors.reset}`);
    this.checkFile('shared/schema.ts', 'Main database schema');
    this.checkFile('drizzle.config.ts', 'Drizzle configuration');
    this.checkFile('app/api/_lib/drizzle.ts', 'Database connection utility');
    this.checkFileContent('shared/schema.ts', 'isInternational', 'International user support');
    this.checkFileContent('shared/schema.ts', 'identityVerifications', 'Identity verification table');
    this.checkFileContent('shared/schema.ts', 'fraudScores', 'Fraud detection table');
    
    // 6. Enhanced Security Implementation
    this.log(`${colors.blue}6. Enhanced Security Implementation${colors.reset}`);
    this.checkFile('app/api/identity/submit/route.ts', 'Identity verification submission');
    this.checkFile('app/api/identity/status/route.ts', 'Identity verification status');
    this.checkFile('app/api/compliance/review/route.ts', 'Compliance review system');
    this.checkFileContent('app/api/cross-border/initiate/route.ts', 'calculateRiskScore', 'Fraud detection implementation');
    
    // 7. Multi-Currency Support
    this.log(`${colors.blue}7. Multi-Currency Support${colors.reset}`);
    this.checkDirectory('app/api/exchange-rates', 'Exchange rates API');
    this.checkFile('app/api/exchange-rates/current/route.ts', 'Current exchange rates endpoint');
    this.checkFile('app/api/exchange-rates/update/route.ts', 'Exchange rates update endpoint');
    this.checkFileContent('shared/schema.ts', 'exchangeRates', 'Exchange rates table');
    this.checkFileContent('shared/schema.ts', 'eurBalance', 'Multi-currency wallet support');
  }

  validateRequiredFiles() {
    this.log(`${colors.bold}=== Required Files Validation ===${colors.reset}`);
    
    const requiredFiles = [
      'PLAN.md',
      'AGENTS.md',
      'docs/guides/ARCHITECTURE.md',
      'docs/standards/CODE_STANDARDS.md',
      'docs/PROJECT_RULES_OVERVIEW.md',
      'package.json',
      'tsconfig.json',
      'next.config.js',
      '.eslintrc.js',
    ];

    requiredFiles.forEach(file => {
      this.checkFile(file, `Required project file`);
    });
  }

  validateCodeStandards() {
    this.log(`${colors.bold}=== Code Standards Validation ===${colors.reset}`);
    
    // Check TypeScript configuration
    this.checkFileContent('tsconfig.json', '"strict": true', 'TypeScript strict mode enabled');
    
    // Check ESLint configuration
    this.checkFile('.eslintrc.js', 'ESLint configuration file');
    
    // Check component structure
    this.checkFileContent('components/friend-network-card.tsx', '"use client"', 'Client components properly marked');
    this.checkFileContent('components/cross-border-payment-form.tsx', 'zodResolver', 'Form validation with Zod');
    
    // Check API route structure
    this.checkFileContent('app/api/cross-border/initiate/route.ts', 'NextRequest', 'Proper API route structure');
    this.checkFileContent('app/api/cross-border/initiate/route.ts', 'z.object', 'Schema validation in API routes');
  }

  validateArchitecture() {
    this.log(`${colors.bold}=== Architecture Compliance Validation ===${colors.reset}`);
    
    // Check microservices-ready structure
    this.checkDirectory('app/api', 'API routes organized by domain');
    this.checkDirectory('components', 'Reusable components directory');
    this.checkDirectory('lib', 'Utility functions directory');
    
    // Check database organization
    this.checkFileContent('shared/schema.ts', 'relations', 'Database relations defined');
    this.checkFileContent('shared/schema.ts', 'createInsertSchema', 'Validation schemas for database operations');
    
    // Check proper separation of concerns
    this.checkFile('app/api/_lib/drizzle.ts', 'Database connection separated');
    this.checkFile('lib/api.ts', 'API utilities separated');
  }

  calculateScore() {
    const { passed, total } = this.results;
    return total > 0 ? Math.round((passed / total) * 100) : 0;
  }

  generateReport() {
    const score = this.calculateScore();
    const passThreshold = 80; // 80% as per PLAN.md requirements
    
    this.log(`${colors.bold}=== PHASE 1 VALIDATION SUMMARY ===${colors.reset}`);
    this.log(`Total Checks: ${this.results.total}`);
    this.log(`Passed: ${this.results.passed}`, 'pass');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'fail' : 'info');
    this.log(`Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'warn' : 'info');
    this.log(`Overall Score: ${score}%`, score >= passThreshold ? 'pass' : 'fail');
    
    if (score >= passThreshold) {
      this.log(`${colors.green}${colors.bold}✓ PHASE 1 VALIDATION PASSED!${colors.reset}`);
      this.log(`PayPass Phase 1 implementation meets the required standards.`);
      this.log(`Ready to proceed with Phase 2 development.`);
    } else {
      this.log(`${colors.red}${colors.bold}✗ PHASE 1 VALIDATION FAILED${colors.reset}`);
      this.log(`Score ${score}% is below the required ${passThreshold}% threshold.`);
      this.log(`Please address the failed checks before proceeding to Phase 2.`);
    }
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      phase: 1,
      score,
      passThreshold,
      passed: score >= passThreshold,
      results: this.results,
      details: this.report
    };
    
    const reportPath = path.join(rootDir, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    this.log(`Detailed report saved to: validation-report.json`);
    
    return score >= passThreshold;
  }

  run() {
    this.log(`${colors.bold}PayPass Phase 1 Validation Started${colors.reset}`);
    this.log(`Validating against PLAN.md Phase 1 requirements...`);
    
    this.validateRequiredFiles();
    this.validatePhase1Core();
    this.validateCodeStandards();
    this.validateArchitecture();
    
    return this.generateReport();
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new Phase1Validator();
  const passed = validator.run();
  process.exit(passed ? 0 : 1);
}

export { Phase1Validator };