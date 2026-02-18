/**
 * Financial Logger Module
 * Provides comprehensive logging and monitoring for all financial operations
 * Ensures compliance with audit requirements and enables real-time monitoring
 */

import { createWriteStream, appendFileSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';

export interface FinancialLog {
  timestamp?: string;
  operationId: string;
  userId: string;
  operationType: 'transfer' | 'topup' | 'payment' | 'withdrawal' | 'refund';
  amount: number;
  currency: string;
  status: 'initiated' | 'processing' | 'completed' | 'failed' | 'reversed';
  fromAccount?: string;
  toAccount?: string;
  description: string;
  metadata?: Record<string, any>;
  riskScore?: number;
  fraudFlags?: string[];
  ipAddress?: string;
  userAgent?: string;
  error?: string;
  duration?: number; // in milliseconds
}

export interface AuditLog {
  timestamp: string;
  auditId: string;
  userId: string;
  action: string;
  resource: string;
  changes: Record<string, any>;
  status: 'success' | 'failure';
  reason?: string;
}

class FinancialLogger {
  private financialLogPath: string;
  private auditLogPath: string;
  private metricsBuffer: Map<string, number> = new Map();

  constructor() {
    const logsDir = join(process.cwd(), 'logs');
    this.financialLogPath = join(logsDir, `financial-${format(new Date(), 'yyyy-MM-dd')}.log`);
    this.auditLogPath = join(logsDir, `audit-${format(new Date(), 'yyyy-MM-dd')}.log`);

    // Initialize metrics
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    this.metricsBuffer.set('total_transactions', 0);
    this.metricsBuffer.set('successful_transactions', 0);
    this.metricsBuffer.set('failed_transactions', 0);
    this.metricsBuffer.set('total_amount_transferred', 0);
    this.metricsBuffer.set('fraud_alerts', 0);
    this.metricsBuffer.set('average_transaction_time', 0);
  }

  /**
   * Log a financial transaction
   * @param log Financial log entry
   */
  public logTransaction(log: FinancialLog): void {
    const logEntry = {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
    };

    // Write to file for persistence
    appendFileSync(
      this.financialLogPath,
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf-8' }
    );

    // Update metrics
    this.updateMetrics(logEntry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[FinancialLog]', logEntry);
    }

    // Alert on high-risk transactions
    if (logEntry.riskScore && logEntry.riskScore > 75) {
      this.alertHighRisk(logEntry);
    }

    // Alert on fraud flags
    if (logEntry.fraudFlags && logEntry.fraudFlags.length > 0) {
      this.alertFraud(logEntry);
    }
  }

  /**
   * Log an audit event
   * @param log Audit log entry
   */
  public logAudit(log: AuditLog): void {
    const logEntry = {
      ...log,
      timestamp: new Date().toISOString(),
    };

    // Write to file for persistence
    appendFileSync(
      this.auditLogPath,
      JSON.stringify(logEntry) + '\n',
      { encoding: 'utf-8' }
    );

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AuditLog]', logEntry);
    }
  }

  /**
   * Update real-time metrics
   * @param log Financial log entry
   */
  private updateMetrics(log: FinancialLog): void {
    // Update transaction counts
    this.metricsBuffer.set(
      'total_transactions',
      (this.metricsBuffer.get('total_transactions') || 0) + 1
    );

    if (log.status === 'completed') {
      this.metricsBuffer.set(
        'successful_transactions',
        (this.metricsBuffer.get('successful_transactions') || 0) + 1
      );
      this.metricsBuffer.set(
        'total_amount_transferred',
        (this.metricsBuffer.get('total_amount_transferred') || 0) + log.amount
      );
    } else if (log.status === 'failed') {
      this.metricsBuffer.set(
        'failed_transactions',
        (this.metricsBuffer.get('failed_transactions') || 0) + 1
      );
    }

    // Update fraud alerts
    if (log.fraudFlags && log.fraudFlags.length > 0) {
      this.metricsBuffer.set(
        'fraud_alerts',
        (this.metricsBuffer.get('fraud_alerts') || 0) + 1
      );
    }

    // Update average transaction time
    if (log.duration) {
      const currentAvg = this.metricsBuffer.get('average_transaction_time') || 0;
      const totalTx = this.metricsBuffer.get('total_transactions') || 1;
      const newAvg = (currentAvg * (totalTx - 1) + log.duration) / totalTx;
      this.metricsBuffer.set('average_transaction_time', newAvg);
    }
  }

  /**
   * Alert on high-risk transactions
   * @param log Financial log entry
   */
  private alertHighRisk(log: FinancialLog): void {
    console.warn(`[HIGH-RISK ALERT] Transaction ${log.operationId} has risk score: ${log.riskScore}`);
    // TODO: Send to monitoring system (e.g., Sentry, DataDog)
  }

  /**
   * Alert on fraud flags
   * @param log Financial log entry
   */
  private alertFraud(log: FinancialLog): void {
    console.error(`[FRAUD ALERT] Transaction ${log.operationId} flagged for: ${log.fraudFlags?.join(', ')}`);
    // TODO: Send to fraud detection system and notify compliance team
  }

  /**
   * Get current metrics
   * @returns Current metrics
   */
  public getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.metricsBuffer.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  /**
   * Get success rate
   * @returns Success rate percentage
   */
  public getSuccessRate(): number {
    const total = this.metricsBuffer.get('total_transactions') || 0;
    const successful = this.metricsBuffer.get('successful_transactions') || 0;
    return total > 0 ? (successful / total) * 100 : 0;
  }

  /**
   * Get fraud alert rate
   * @returns Fraud alert rate percentage
   */
  public getFraudAlertRate(): number {
    const total = this.metricsBuffer.get('total_transactions') || 0;
    const fraudAlerts = this.metricsBuffer.get('fraud_alerts') || 0;
    return total > 0 ? (fraudAlerts / total) * 100 : 0;
  }

  /**
   * Reset metrics (for testing or daily rollover)
   */
  public resetMetrics(): void {
    this.initializeMetrics();
  }
}

// Export singleton instance
export const financialLogger = new FinancialLogger();
