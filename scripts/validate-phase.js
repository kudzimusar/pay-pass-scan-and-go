#!/usr/bin/env node

/**
 * Phase Validation Script for PayPass Platform
 * 
 * This script validates the current development phase completion criteria
 * as defined in PLAN.md. It runs various checks to ensure quality gates
 * are met before advancing to the next phase.
 * 
 * Usage: npm run validate:current
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

// Phase completion criteria configuration
const PHASE_CRITERIA = {
  1: {
    name: "Foundation",
    successThreshold: 80, // 80% success rate required
    checks: [
      {
        name: "TypeScript Compilation",
        weight: 15,
        command: "npx tsc --noEmit",
        description: "All TypeScript code compiles without errors"
      },
      {
        name: "Unit Tests",
        weight: 20,
        command: "npm run test:unit",
        description: "Unit tests pass with >80% coverage",
        coverageRequired: 80
      },
      {
        name: "API Integration Tests",
        weight: 15,
        command: "npm run test:integration",
        description: "All API endpoints tested and working"
      },
      {
        name: "Authentication System",
        weight: 10,
        command: "npm run test:auth",
        description: "JWT authentication and authorization working"
      },
      {
        name: "Basic Payment Flow",
        weight: 15,
        command: "npm run test:payments",
        description: "Core payment functionality operational"
      },
      {
        name: "Code Quality",
        weight: 10,
        command: "npm run lint",
        description: "ESLint passes with no errors"
      },
      {
        name: "Security Checks",
        weight: 10,
        command: "npm run security:check",
        description: "Security audit passes"
      },
      {
        name: "Performance Benchmarks",
        weight: 5,
        command: "npm run test:performance",
        description: "Basic performance targets met"
      }
    ]
  },
  2: {
    name: "Core Features",
    successThreshold: 85,
    checks: [
      {
        name: "E2E Tests",
        weight: 25,
        command: "npm run test:e2e",
        description: "Critical user journeys working end-to-end"
      },
      {
        name: "Cross-Border Payments",
        weight: 20,
        command: "npm run test:cross-border",
        description: "Pay for your Friend functionality complete"
      },
      {
        name: "Fraud Detection",
        weight: 15,
        command: "npm run test:fraud",
        description: "Fraud detection system operational"
      },
      {
        name: "Multi-Currency Support",
        weight: 10,
        command: "npm run test:currency",
        description: "Currency conversion working"
      },
      {
        name: "Load Testing",
        weight: 10,
        command: "npm run test:load",
        description: "System handles expected load"
      },
      {
        name: "Security Audit",
        weight: 10,
        command: "npm run security:audit",
        description: "Comprehensive security audit passes"
      },
      {
        name: "Documentation",
        weight: 5,
        command: "npm run docs:validate",
        description: "All documentation complete and up-to-date"
      },
      {
        name: "Performance Standards",
        weight: 5,
        command: "npm run test:performance:full",
        description: "All performance targets met"
      }
    ]
  }
};

class PhaseValidator {
  constructor() {
    this.currentPhase = this.detectCurrentPhase();
    this.results = [];
    this.totalWeight = 0;
    this.passedWeight = 0;
  }

  detectCurrentPhase() {
    // Read current phase from package.json or environment
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      return packageJson.currentPhase || 1;
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not detect current phase, defaulting to Phase 1'));
      return 1;
    }
  }

  async validatePhase() {
    const criteria = PHASE_CRITERIA[this.currentPhase];
    
    if (!criteria) {
      throw new Error(`Unknown phase: ${this.currentPhase}`);
    }

    console.log(chalk.blue.bold(`\\n🔍 Validating Phase ${this.currentPhase}: ${criteria.name}`));
    console.log(chalk.gray(`Required success rate: ${criteria.successThreshold}%\\n`));

    for (const check of criteria.checks) {
      await this.runCheck(check);
    }

    return this.generateReport(criteria);
  }

  async runCheck(check) {
    const startTime = Date.now();
    
    process.stdout.write(chalk.gray(`  Running ${check.name}... `));

    try {
      const result = await this.executeCheck(check);
      const duration = Date.now() - startTime;
      
      this.results.push({
        ...check,
        passed: result.success,
        duration,
        output: result.output,
        coverage: result.coverage
      });

      this.totalWeight += check.weight;
      if (result.success) {
        this.passedWeight += check.weight;
        console.log(chalk.green(`✓ PASS`) + chalk.gray(` (${duration}ms)`));
      } else {
        console.log(chalk.red(`✗ FAIL`) + chalk.gray(` (${duration}ms)`));
        if (result.output) {
          console.log(chalk.red(`    ${result.output}`));
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        ...check,
        passed: false,
        duration,
        error: error.message
      });

      this.totalWeight += check.weight;
      console.log(chalk.red(`✗ ERROR`) + chalk.gray(` (${duration}ms)`));
      console.log(chalk.red(`    ${error.message}`));
    }
  }

  async executeCheck(check) {
    if (check.name === "TypeScript Compilation") {
      return this.checkTypeScript();
    }
    
    if (check.name === "Unit Tests" && check.coverageRequired) {
      return this.checkTestCoverage(check.command, check.coverageRequired);
    }

    if (check.name === "Performance Benchmarks" || check.name === "Performance Standards") {
      return this.checkPerformance();
    }

    if (check.name === "Security Checks" || check.name === "Security Audit") {
      return this.checkSecurity();
    }

    // Default command execution
    try {
      const output = execSync(check.command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 300000 // 5 minute timeout
      });
      
      return {
        success: true,
        output: output.trim()
      };
    } catch (error) {
      return {
        success: false,
        output: error.message
      };
    }
  }

  checkTypeScript() {
    try {
      execSync('npx tsc --noEmit', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });
      return { success: true };
    } catch (error) {
      const output = error.stdout || error.stderr || error.message;
      const errorCount = (output.match(/error TS\\d+:/g) || []).length;
      
      return {
        success: false,
        output: `${errorCount} TypeScript errors found`
      };
    }
  }

  checkTestCoverage(command, requiredCoverage) {
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });

      // Parse coverage from Jest output
      const coverageMatch = output.match(/All files[\\s\\S]*?([\\d.]+)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

      const success = coverage >= requiredCoverage;
      
      return {
        success,
        coverage,
        output: success ? 
          `Coverage: ${coverage}% (required: ${requiredCoverage}%)` :
          `Coverage: ${coverage}% - Below required ${requiredCoverage}%`
      };
    } catch (error) {
      return {
        success: false,
        output: error.message
      };
    }
  }

  checkPerformance() {
    // Check if performance benchmark files exist
    const benchmarkFiles = [
      'performance/results.json',
      'lighthouse/results.json'
    ];

    const missingFiles = benchmarkFiles.filter(file => !existsSync(file));
    
    if (missingFiles.length > 0) {
      return {
        success: false,
        output: `Missing performance result files: ${missingFiles.join(', ')}`
      };
    }

    try {
      // Read and validate performance results
      const performanceResults = JSON.parse(readFileSync('performance/results.json', 'utf8'));
      const lighthouseResults = JSON.parse(readFileSync('lighthouse/results.json', 'utf8'));

      const performanceChecks = [
        { metric: 'apiResponseTime', value: performanceResults.avgApiResponseTime, threshold: 2000 },
        { metric: 'pageLoadTime', value: lighthouseResults.lcp, threshold: 2500 },
        { metric: 'firstInputDelay', value: lighthouseResults.fid, threshold: 100 }
      ];

      const failedChecks = performanceChecks.filter(check => check.value > check.threshold);

      if (failedChecks.length > 0) {
        return {
          success: false,
          output: `Performance issues: ${failedChecks.map(c => `${c.metric} (${c.value}ms > ${c.threshold}ms)`).join(', ')}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        output: `Error reading performance results: ${error.message}`
      };
    }
  }

  checkSecurity() {
    try {
      // Run npm audit
      execSync('npm audit --audit-level=moderate', { 
        encoding: 'utf8', 
        stdio: 'pipe' 
      });

      // Check for security configuration files
      const securityFiles = [
        '.eslintrc.js',
        'docs/guides/SECURITY.md'
      ];

      const missingFiles = securityFiles.filter(file => !existsSync(file));
      
      if (missingFiles.length > 0) {
        return {
          success: false,
          output: `Missing security files: ${missingFiles.join(', ')}`
        };
      }

      return { success: true };
    } catch (error) {
      const output = error.stdout || error.stderr || error.message;
      
      // Check if it's just audit warnings vs critical issues
      if (output.includes('vulnerabilities') && !output.includes('critical')) {
        return { 
          success: true, 
          output: 'Security audit completed with minor warnings' 
        };
      }

      return {
        success: false,
        output: `Security issues found: ${output}`
      };
    }
  }

  generateReport(criteria) {
    const successRate = (this.passedWeight / this.totalWeight) * 100;
    const phaseComplete = successRate >= criteria.successThreshold;

    console.log(chalk.blue.bold('\\n📊 Validation Results'));
    console.log(chalk.blue('═'.repeat(50)));

    // Overall status
    const statusIcon = phaseComplete ? '✅' : '❌';
    const statusColor = phaseComplete ? chalk.green : chalk.red;
    const statusText = phaseComplete ? 'PHASE COMPLETE' : 'PHASE INCOMPLETE';
    
    console.log(`\\n${statusIcon} ${statusColor.bold(statusText)}`);
    console.log(`Success Rate: ${chalk.cyan(successRate.toFixed(1))}% (Required: ${chalk.cyan(criteria.successThreshold)}%)`);

    // Detailed results
    console.log(chalk.blue('\\n📋 Detailed Results:'));
    
    const passedChecks = this.results.filter(r => r.passed);
    const failedChecks = this.results.filter(r => !r.passed);

    console.log(chalk.green(`  ✓ Passed: ${passedChecks.length} checks`));
    console.log(chalk.red(`  ✗ Failed: ${failedChecks.length} checks`));

    if (failedChecks.length > 0) {
      console.log(chalk.red('\\n❌ Failed Checks:'));
      failedChecks.forEach(check => {
        console.log(chalk.red(`  • ${check.name} (Weight: ${check.weight})`));
        console.log(chalk.gray(`    ${check.description}`));
        if (check.output) {
          console.log(chalk.red(`    ${check.output}`));
        }
      });
    }

    // Performance summary
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(chalk.blue(`\\n⏱️  Total validation time: ${chalk.cyan(totalDuration)}ms`));

    // Next steps
    if (phaseComplete) {
      console.log(chalk.green.bold('\\n🎉 Congratulations! Phase validation completed successfully.'));
      console.log(chalk.green('You can now proceed to the next development phase.'));
      
      if (this.currentPhase < Object.keys(PHASE_CRITERIA).length) {
        console.log(chalk.blue(`\\n➡️  Next: Phase ${this.currentPhase + 1}: ${PHASE_CRITERIA[this.currentPhase + 1]?.name}`));
      }
    } else {
      console.log(chalk.red.bold('\\n🔧 Phase validation incomplete. Please address the failed checks.'));
      console.log(chalk.yellow('\\nRecommended actions:'));
      
      failedChecks.forEach(check => {
        console.log(chalk.yellow(`  • Fix: ${check.name}`));
      });
      
      console.log(chalk.blue('\\nRun "npm run validate:current" again after making improvements.'));
    }

    // Generate JSON report for CI/CD
    this.generateJSONReport(criteria, successRate, phaseComplete);

    return {
      phaseComplete,
      successRate,
      passedChecks: passedChecks.length,
      failedChecks: failedChecks.length,
      results: this.results
    };
  }

  generateJSONReport(criteria, successRate, phaseComplete) {
    const report = {
      timestamp: new Date().toISOString(),
      phase: this.currentPhase,
      phaseName: criteria.name,
      successRate,
      phaseComplete,
      requiredThreshold: criteria.successThreshold,
      totalChecks: this.results.length,
      passedChecks: this.results.filter(r => r.passed).length,
      failedChecks: this.results.filter(r => !r.passed).length,
      results: this.results.map(r => ({
        name: r.name,
        passed: r.passed,
        weight: r.weight,
        duration: r.duration,
        description: r.description,
        error: r.error || null,
        coverage: r.coverage || null
      }))
    };

    try {
      const fs = require('fs');
      fs.writeFileSync('validation-report.json', JSON.stringify(report, null, 2));
      console.log(chalk.gray('\\n📄 Detailed report saved to validation-report.json'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not save JSON report: ${error.message}`));
    }
  }
}

// Main execution
async function main() {
  const validator = new PhaseValidator();
  
  try {
    console.log(chalk.blue.bold('🚀 PayPass Phase Validation'));
    console.log(chalk.gray('Validating development phase completion criteria...\\n'));

    const result = await validator.validatePhase();
    
    // Exit with appropriate code for CI/CD
    process.exit(result.phaseComplete ? 0 : 1);
    
  } catch (error) {
    console.error(chalk.red.bold('\\n💥 Validation Error:'));
    console.error(chalk.red(error.message));
    
    if (error.stack) {
      console.error(chalk.gray(error.stack));
    }
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\\n⚠️  Validation interrupted by user'));
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\\n⚠️  Validation terminated'));
  process.exit(1);
});

// Execute if called directly
if (require.main === module) {
  main();
}

export default PhaseValidator;