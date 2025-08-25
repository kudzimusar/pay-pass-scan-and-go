#!/usr/bin/env node

/**
 * Phase Validation Script
 * Tests each phase completion criteria based on PLAN.md
 * Usage: node scripts/phase-validation.js [phase-number]
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PHASES = {
  1: {
    name: 'Foundation',
    priority: '95%',
    criteria: [
      'Merge conflicts resolved (16 files, 182 TypeScript errors)',
      'App is testable and runs without errors',
      'Basic authentication working for all user types',
      'Wallet funding system foundation implemented',
      '"Pay for your Friend" diaspora user registration',
      'Basic cross-border payment processing'
    ]
  },
  2: {
    name: 'Integration',
    priority: '100%',
    criteria: [
      'Remittance provider integration (Mukuru, Western Union, WorldRemit)',
      'Multi-currency support (USD, ZWL, EUR, GBP)',
      'Real-time currency conversion with FX rates',
      'Instant notification system for payments',
      'SAGA Pattern for distributed transactions',
      'Queued processing for API downtime'
    ]
  },
  3: {
    name: 'Advanced Features',
    priority: '100%',
    criteria: [
      'Advanced fraud detection for cross-border transactions',
      'Compliance engine for international regulations',
      'Analytics dashboard for diaspora transactions',
      'Mobile app for diaspora users',
      'PCI DSS compliance implementation',
      'Prometheus/Grafana monitoring'
    ]
  },
  4: {
    name: 'Production Ready',
    priority: '100%',
    criteria: [
      'Complete security hardening',
      'Full compliance implementation',
      'Performance optimization',
      'Production deployment and monitoring',
      'Market expansion to other African countries'
    ]
  }
};

class PhaseValidator {
  constructor() {
    this.results = [];
    this.currentPhase = parseInt(process.argv[2]) || 1;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '🔍';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkMergeConflicts() {
    try {
      const output = execSync('grep -r "<<<<<<< HEAD" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next || true', { encoding: 'utf8' });
      if (output.trim()) {
        this.log('Merge conflicts detected', 'error');
        return false;
      }
      this.log('No merge conflicts found', 'success');
      return true;
    } catch (error) {
      this.log('No merge conflicts found', 'success');
      return true;
    }
  }

  async checkTypeScriptErrors() {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      this.log('No TypeScript errors', 'success');
      return true;
    } catch (error) {
      this.log('TypeScript errors detected', 'error');
      return false;
    }
  }

  async checkBuildSuccess() {
    try {
      execSync('npm run build', { stdio: 'pipe' });
      this.log('Build successful', 'success');
      return true;
    } catch (error) {
      this.log('Build failed', 'error');
      return false;
    }
  }

  async checkAppTestability() {
    try {
      // Check if main entry points exist
      const requiredFiles = [
        'app/page.tsx',
        'app/api/auth/login/route.ts',
        'components/auth-provider.tsx'
      ];
      
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          this.log(`Required file missing: ${file}`, 'error');
          return false;
        }
      }
      
      this.log('App structure is testable', 'success');
      return true;
    } catch (error) {
      this.log('App testability check failed', 'error');
      return false;
    }
  }

  async checkAuthenticationSystem() {
    try {
      // Check if authentication components exist
      const authFiles = [
        'app/api/auth/login/route.ts',
        'app/api/auth/register/route.ts',
        'components/auth-provider.tsx'
      ];
      
      for (const file of authFiles) {
        if (!fs.existsSync(file)) {
          this.log(`Authentication file missing: ${file}`, 'error');
          return false;
        }
      }
      
      this.log('Authentication system exists', 'success');
      return true;
    } catch (error) {
      this.log('Authentication system check failed', 'error');
      return false;
    }
  }

  async checkWalletFundingSystem() {
    try {
      // Check if wallet-related components exist
      const walletFiles = [
        'app/top-up/page.tsx',
        'app/api/user/profile/route.ts'
      ];
      
      for (const file of walletFiles) {
        if (!fs.existsSync(file)) {
          this.log(`Wallet funding file missing: ${file}`, 'error');
          return false;
        }
      }
      
      this.log('Wallet funding system foundation exists', 'success');
      return true;
    } catch (error) {
      this.log('Wallet funding system check failed', 'error');
      return false;
    }
  }

  async checkDiasporaUserRegistration() {
    try {
      // Check if diaspora-related components exist
      const diasporaFiles = [
        'app/diaspora-login/page.tsx',
        'app/diaspora-dashboard/page.tsx'
      ];
      
      let exists = false;
      for (const file of diasporaFiles) {
        if (fs.existsSync(file)) {
          exists = true;
          break;
        }
      }
      
      if (exists) {
        this.log('Diaspora user registration exists', 'success');
        return true;
      } else {
        this.log('Diaspora user registration not implemented', 'error');
        return false;
      }
    } catch (error) {
      this.log('Diaspora user registration check failed', 'error');
      return false;
    }
  }

  async checkCrossBorderPayments() {
    try {
      // Check if cross-border payment components exist
      const crossBorderFiles = [
        'app/api/payments/cross-border/route.ts',
        'app/pay-for-friend/page.tsx'
      ];
      
      let exists = false;
      for (const file of crossBorderFiles) {
        if (fs.existsSync(file)) {
          exists = true;
          break;
        }
      }
      
      if (exists) {
        this.log('Cross-border payment processing exists', 'success');
        return true;
      } else {
        this.log('Cross-border payment processing not implemented', 'error');
        return false;
      }
    } catch (error) {
      this.log('Cross-border payment check failed', 'error');
      return false;
    }
  }

  async validatePhase(phaseNumber) {
    const phase = PHASES[phaseNumber];
    if (!phase) {
      this.log(`Invalid phase number: ${phaseNumber}`, 'error');
      return false;
    }

    this.log(`\n🔍 Validating Phase ${phaseNumber}: ${phase.name} (${phase.priority} Priority)`);
    this.log('='.repeat(60));

    const results = [];

    // Phase 1 specific tests
    if (phaseNumber === 1) {
      results.push(await this.checkMergeConflicts());
      results.push(await this.checkTypeScriptErrors());
      results.push(await this.checkBuildSuccess());
      results.push(await this.checkAppTestability());
      results.push(await this.checkAuthenticationSystem());
      results.push(await this.checkWalletFundingSystem());
      results.push(await this.checkDiasporaUserRegistration());
      results.push(await this.checkCrossBorderPayments());
    }

    // Phase 2 specific tests
    if (phaseNumber === 2) {
      this.log('Phase 2 tests not yet implemented', 'info');
      results.push(false); // Placeholder
    }

    // Phase 3 specific tests
    if (phaseNumber === 3) {
      this.log('Phase 3 tests not yet implemented', 'info');
      results.push(false); // Placeholder
    }

    // Phase 4 specific tests
    if (phaseNumber === 4) {
      this.log('Phase 4 tests not yet implemented', 'info');
      results.push(false); // Placeholder
    }

    const passed = results.filter(r => r === true).length;
    const total = results.length;
    const successRate = (passed / total) * 100;

    this.log(`\n📊 Phase ${phaseNumber} Results:`);
    this.log(`Passed: ${passed}/${total} (${successRate.toFixed(1)}%)`);

    if (successRate >= 80) {
      this.log(`✅ Phase ${phaseNumber} - ${phase.name} VALIDATION PASSED`, 'success');
      return true;
    } else {
      this.log(`❌ Phase ${phaseNumber} - ${phase.name} VALIDATION FAILED`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🚀 Starting Phase Validation');
    this.log(`Target Phase: ${this.currentPhase}`);

    const success = await this.validatePhase(this.currentPhase);

    this.log('\n📋 Phase Criteria:');
    const phase = PHASES[this.currentPhase];
    phase.criteria.forEach((criterion, index) => {
      this.log(`${index + 1}. ${criterion}`);
    });

    if (success) {
      this.log(`\n🎉 Phase ${this.currentPhase} validation completed successfully!`);
      this.log('Ready to proceed to next phase or continue development.');
    } else {
      this.log(`\n⚠️  Phase ${this.currentPhase} validation failed.`);
      this.log('Please address the issues before proceeding.');
    }

    return success;
  }
}

// Run the validator
const validator = new PhaseValidator();
validator.run().catch(console.error);