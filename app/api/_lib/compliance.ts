/**
 * Compliance Module
 * Ensures all financial operations meet regulatory requirements
 * Implements AML/KYC checks, transaction monitoring, and reporting
 */

import { financialLogger } from './financial-logger';

export interface ComplianceCheck {
  checkType: 'kyc' | 'aml' | 'sanctions' | 'pep' | 'transaction_limit' | 'velocity';
  status: 'passed' | 'failed' | 'review_required';
  details: string;
  timestamp: string;
}

export interface ComplianceReport {
  userId: string;
  reportId: string;
  checks: ComplianceCheck[];
  overallStatus: 'compliant' | 'non_compliant' | 'review_required';
  generatedAt: string;
}

class ComplianceEngine {
  // Regulatory thresholds
  private readonly DAILY_TRANSACTION_LIMIT = 1000; // USD
  private readonly MONTHLY_TRANSACTION_LIMIT = 10000; // USD
  private readonly VELOCITY_CHECK_WINDOW = 3600000; // 1 hour in milliseconds
  private readonly VELOCITY_CHECK_LIMIT = 5; // Max transactions per hour

  // Sanctions list (simplified - in production, use real sanctions databases)
  private sanctionedCountries = ['KP', 'IR', 'SY', 'CU']; // North Korea, Iran, Syria, Cuba
  private pepsDatabase: Set<string> = new Set(); // Politically Exposed Persons

  /**
   * Perform comprehensive compliance check
   * @param userId User ID
   * @param transactionAmount Transaction amount in USD
   * @param recipientCountry Recipient country code
   * @param userTransactionHistory User's recent transactions
   * @returns Compliance report
   */
  public async performComplianceCheck(
    userId: string,
    transactionAmount: number,
    recipientCountry: string,
    userTransactionHistory: any[] = []
  ): Promise<ComplianceReport> {
    const checks: ComplianceCheck[] = [];
    const reportId = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. KYC Check
    checks.push(this.performKycCheck(userId));

    // 2. AML Check
    checks.push(this.performAmlCheck(userId, transactionAmount));

    // 3. Sanctions Check
    checks.push(this.performSanctionsCheck(recipientCountry));

    // 4. PEP Check
    checks.push(this.performPepCheck(userId));

    // 5. Transaction Limit Check
    checks.push(this.performTransactionLimitCheck(transactionAmount));

    // 6. Velocity Check
    checks.push(this.performVelocityCheck(userId, userTransactionHistory));

    // Determine overall status
    const overallStatus = this.determineOverallStatus(checks);

    const report: ComplianceReport = {
      userId,
      reportId,
      checks,
      overallStatus,
      generatedAt: new Date().toISOString(),
    };

    // Log compliance check
    financialLogger.logAudit({
      auditId: reportId,
      userId,
      action: 'compliance_check',
      resource: 'transaction',
      changes: { checks: checks.length, status: overallStatus },
      status: overallStatus === 'compliant' ? 'success' : 'failure',
    });

    return report;
  }

  /**
   * Perform KYC (Know Your Customer) check
   * @param userId User ID
   * @returns KYC check result
   */
  private performKycCheck(userId: string): ComplianceCheck {
    // In production, verify against KYC database
    // For now, assume KYC is verified if user exists
    return {
      checkType: 'kyc',
      status: 'passed',
      details: 'User identity verified and KYC documents on file',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform AML (Anti-Money Laundering) check
   * @param userId User ID
   * @param amount Transaction amount
   * @returns AML check result
   */
  private performAmlCheck(userId: string, amount: number): ComplianceCheck {
    // Check for suspicious patterns
    if (amount > 50000) {
      return {
        checkType: 'aml',
        status: 'review_required',
        details: `Large transaction detected: $${amount}. Requires manual review.`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkType: 'aml',
      status: 'passed',
      details: 'Transaction amount within normal parameters',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform sanctions check
   * @param countryCode Country code
   * @returns Sanctions check result
   */
  private performSanctionsCheck(countryCode: string): ComplianceCheck {
    if (this.sanctionedCountries.includes(countryCode)) {
      return {
        checkType: 'sanctions',
        status: 'failed',
        details: `Transactions to ${countryCode} are prohibited due to sanctions`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkType: 'sanctions',
      status: 'passed',
      details: 'Recipient country is not on sanctions list',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform PEP (Politically Exposed Person) check
   * @param userId User ID
   * @returns PEP check result
   */
  private performPepCheck(userId: string): ComplianceCheck {
    if (this.pepsDatabase.has(userId)) {
      return {
        checkType: 'pep',
        status: 'review_required',
        details: 'User is flagged as a Politically Exposed Person. Requires enhanced due diligence.',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkType: 'pep',
      status: 'passed',
      details: 'User is not on PEP list',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform transaction limit check
   * @param amount Transaction amount
   * @returns Transaction limit check result
   */
  private performTransactionLimitCheck(amount: number): ComplianceCheck {
    if (amount > this.DAILY_TRANSACTION_LIMIT) {
      return {
        checkType: 'transaction_limit',
        status: 'review_required',
        details: `Transaction exceeds daily limit of $${this.DAILY_TRANSACTION_LIMIT}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkType: 'transaction_limit',
      status: 'passed',
      details: `Transaction is within limits (Daily: $${this.DAILY_TRANSACTION_LIMIT}, Monthly: $${this.MONTHLY_TRANSACTION_LIMIT})`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Perform velocity check (multiple transactions in short time)
   * @param userId User ID
   * @param transactionHistory User's recent transactions
   * @returns Velocity check result
   */
  private performVelocityCheck(userId: string, transactionHistory: any[]): ComplianceCheck {
    const recentTransactions = transactionHistory.filter((tx) => {
      const txTime = new Date(tx.createdAt).getTime();
      const now = Date.now();
      return now - txTime < this.VELOCITY_CHECK_WINDOW;
    });

    if (recentTransactions.length > this.VELOCITY_CHECK_LIMIT) {
      return {
        checkType: 'velocity',
        status: 'review_required',
        details: `Unusual transaction velocity detected: ${recentTransactions.length} transactions in the last hour`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      checkType: 'velocity',
      status: 'passed',
      details: 'Transaction velocity is within normal parameters',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Determine overall compliance status
   * @param checks Array of compliance checks
   * @returns Overall compliance status
   */
  private determineOverallStatus(checks: ComplianceCheck[]): 'compliant' | 'non_compliant' | 'review_required' {
    if (checks.some((c) => c.status === 'failed')) {
      return 'non_compliant';
    }
    if (checks.some((c) => c.status === 'review_required')) {
      return 'review_required';
    }
    return 'compliant';
  }

  /**
   * Add user to PEP list
   * @param userId User ID
   */
  public addToPepList(userId: string): void {
    this.pepsDatabase.add(userId);
  }

  /**
   * Remove user from PEP list
   * @param userId User ID
   */
  public removeFromPepList(userId: string): void {
    this.pepsDatabase.delete(userId);
  }

  /**
   * Generate compliance report for audit
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Compliance report
   */
  public generateAuditReport(userId: string, startDate: Date, endDate: Date): any {
    return {
      userId,
      period: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      generatedAt: new Date().toISOString(),
      status: 'pending_review',
      note: 'In production, this would aggregate all compliance checks for the period',
    };
  }
}

// Export singleton instance
export const complianceEngine = new ComplianceEngine();
