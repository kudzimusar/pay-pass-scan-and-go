/**
 * Advanced "Pay for your Friend" Features
 * Implements recurring payments, group payments, and request-to-pay functionality
 */

import { financialLogger } from './financial-logger';
import { complianceEngine } from './compliance';

export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export interface RecurringPayment {
  paymentId: string;
  payerId: string;
  recipientId: string;
  amount: number;
  currency: string;
  recurrence: RecurrenceType;
  purpose: string;
  startDate: string;
  endDate?: string;
  nextExecutionDate: string;
  isActive: boolean;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupPayment {
  groupPaymentId: string;
  initiatorId: string;
  participants: GroupParticipant[];
  totalAmount: number;
  currency: string;
  purpose: string;
  splitMethod: 'equal' | 'custom' | 'percentage';
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'failed';
  expiryDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface GroupParticipant {
  userId: string;
  amountOwed: number;
  amountPaid: number;
  status: 'pending' | 'paid' | 'declined';
  paymentDeadline?: string;
}

export interface PaymentRequest {
  requestId: string;
  requesterId: string;
  payerId: string;
  amount: number;
  currency: string;
  purpose: string;
  status: 'pending' | 'accepted' | 'declined' | 'paid';
  expiryDate: string;
  createdAt: string;
  respondedAt?: string;
}

/**
 * Recurring Payment Manager
 */
export class RecurringPaymentManager {
  private payments: Map<string, RecurringPayment> = new Map();

  /**
   * Create a new recurring payment
   */
  async createRecurringPayment(
    payerId: string,
    recipientId: string,
    amount: number,
    currency: string,
    recurrence: RecurrenceType,
    purpose: string,
    startDate: Date,
    endDate?: Date
  ): Promise<RecurringPayment> {
    const paymentId = `recurring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const payment: RecurringPayment = {
      paymentId,
      payerId,
      recipientId,
      amount,
      currency,
      recurrence,
      purpose,
      startDate: startDate.toISOString(),
      endDate: endDate?.toISOString(),
      nextExecutionDate: this.calculateNextExecutionDate(startDate, recurrence),
      isActive: true,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments.set(paymentId, payment);

    // Log the recurring payment creation
    financialLogger.logAudit({
      auditId: paymentId,
      userId: payerId,
      action: 'create_recurring_payment',
      resource: 'recurring_payment',
      changes: { payment },
      status: 'success',
    });

    return payment;
  }

  /**
   * Execute a recurring payment
   */
  async executeRecurringPayment(paymentId: string): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment || !payment.isActive) {
      return false;
    }

    try {
      // Check if it's time to execute
      const now = new Date();
      const nextExecution = new Date(payment.nextExecutionDate);

      if (now < nextExecution) {
        return false;
      }

      // Perform compliance check
      const complianceReport = await complianceEngine.performComplianceCheck(
        payment.payerId,
        payment.amount,
        'ZW',
        []
      );

      if (complianceReport.overallStatus === 'non_compliant') {
        payment.failedExecutions++;
        return false;
      }

      // Execute the payment (placeholder - actual implementation would use financial core)
      payment.totalExecutions++;
      payment.successfulExecutions++;
      payment.nextExecutionDate = this.calculateNextExecutionDate(
        new Date(payment.nextExecutionDate),
        payment.recurrence
      );

      // Check if payment should end
      if (payment.endDate && new Date(payment.nextExecutionDate) > new Date(payment.endDate)) {
        payment.isActive = false;
      }

      payment.updatedAt = new Date().toISOString();

      // Log the execution
      financialLogger.logTransaction({
        operationId: `${paymentId}-exec-${payment.totalExecutions}`,
        userId: payment.payerId,
        operationType: 'transfer',
        amount: payment.amount,
        currency: payment.currency,
        status: 'completed',
        description: `Recurring payment execution: ${payment.purpose}`,
        metadata: { paymentId, recurrence: payment.recurrence },
      });

      return true;
    } catch (error) {
      const payment_ = this.payments.get(paymentId);
      if (payment_) {
        payment_.failedExecutions++;
        payment_.updatedAt = new Date().toISOString();
      }
      console.error('Recurring payment execution error:', error);
      return false;
    }
  }

  /**
   * Cancel a recurring payment
   */
  async cancelRecurringPayment(paymentId: string): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return false;
    }

    payment.isActive = false;
    payment.updatedAt = new Date().toISOString();

    financialLogger.logAudit({
      auditId: `cancel-${paymentId}`,
      userId: payment.payerId,
      action: 'cancel_recurring_payment',
      resource: 'recurring_payment',
      changes: { paymentId, isActive: false },
      status: 'success',
    });

    return true;
  }

  /**
   * Get recurring payment details
   */
  getRecurringPayment(paymentId: string): RecurringPayment | undefined {
    return this.payments.get(paymentId);
  }

  /**
   * Get all recurring payments for a user
   */
  getUserRecurringPayments(userId: string): RecurringPayment[] {
    const payments: RecurringPayment[] = [];
    this.payments.forEach((payment) => {
      if (payment.payerId === userId || payment.recipientId === userId) {
        payments.push(payment);
      }
    });
    return payments;
  }

  /**
   * Calculate next execution date
   */
  private calculateNextExecutionDate(baseDate: Date, recurrence: RecurrenceType): string {
    const nextDate = new Date(baseDate);

    switch (recurrence) {
      case RecurrenceType.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurrenceType.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrenceType.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RecurrenceType.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurrenceType.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurrenceType.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate.toISOString();
  }
}

/**
 * Group Payment Manager
 */
export class GroupPaymentManager {
  private groupPayments: Map<string, GroupPayment> = new Map();

  /**
   * Create a new group payment
   */
  async createGroupPayment(
    initiatorId: string,
    totalAmount: number,
    currency: string,
    purpose: string,
    splitMethod: 'equal' | 'custom' | 'percentage',
    participants: string[],
    expiryDays: number = 7
  ): Promise<GroupPayment> {
    const groupPaymentId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const groupParticipants: GroupParticipant[] = participants.map((userId) => ({
      userId,
      amountOwed: splitMethod === 'equal' ? totalAmount / participants.length : 0,
      amountPaid: 0,
      status: 'pending',
    }));

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const groupPayment: GroupPayment = {
      groupPaymentId,
      initiatorId,
      participants: groupParticipants,
      totalAmount,
      currency,
      purpose,
      splitMethod,
      status: 'draft',
      expiryDate: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.groupPayments.set(groupPaymentId, groupPayment);

    financialLogger.logAudit({
      auditId: groupPaymentId,
      userId: initiatorId,
      action: 'create_group_payment',
      resource: 'group_payment',
      changes: { groupPayment },
      status: 'success',
    });

    return groupPayment;
  }

  /**
   * Add payment to group
   */
  async addPaymentToGroup(groupPaymentId: string, userId: string, amount: number): Promise<boolean> {
    const groupPayment = this.groupPayments.get(groupPaymentId);
    if (!groupPayment) {
      return false;
    }

    const participant = groupPayment.participants.find((p) => p.userId === userId);
    if (!participant) {
      return false;
    }

    participant.amountPaid += amount;
    if (participant.amountPaid >= participant.amountOwed) {
      participant.status = 'paid';
    }

    // Check if all participants have paid
    const allPaid = groupPayment.participants.every((p) => p.status === 'paid');
    if (allPaid) {
      groupPayment.status = 'completed';
      groupPayment.completedAt = new Date().toISOString();
    }

    return true;
  }

  /**
   * Get group payment details
   */
  getGroupPayment(groupPaymentId: string): GroupPayment | undefined {
    return this.groupPayments.get(groupPaymentId);
  }

  /**
   * Get all group payments for a user
   */
  getUserGroupPayments(userId: string): GroupPayment[] {
    const payments: GroupPayment[] = [];
    this.groupPayments.forEach((payment) => {
      if (
        payment.initiatorId === userId ||
        payment.participants.some((p) => p.userId === userId)
      ) {
        payments.push(payment);
      }
    });
    return payments;
  }
}

/**
 * Payment Request Manager
 */
export class PaymentRequestManager {
  private requests: Map<string, PaymentRequest> = new Map();

  /**
   * Create a payment request
   */
  async createPaymentRequest(
    requesterId: string,
    payerId: string,
    amount: number,
    currency: string,
    purpose: string,
    expiryDays: number = 7
  ): Promise<PaymentRequest> {
    const requestId = `preq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const request: PaymentRequest = {
      requestId,
      requesterId,
      payerId,
      amount,
      currency,
      purpose,
      status: 'pending',
      expiryDate: expiryDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.requests.set(requestId, request);

    financialLogger.logAudit({
      auditId: requestId,
      userId: requesterId,
      action: 'create_payment_request',
      resource: 'payment_request',
      changes: { request },
      status: 'success',
    });

    return request;
  }

  /**
   * Accept a payment request
   */
  async acceptPaymentRequest(requestId: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'accepted';
    request.respondedAt = new Date().toISOString();
    return true;
  }

  /**
   * Decline a payment request
   */
  async declinePaymentRequest(requestId: string): Promise<boolean> {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'declined';
    request.respondedAt = new Date().toISOString();
    return true;
  }

  /**
   * Get payment request details
   */
  getPaymentRequest(requestId: string): PaymentRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all payment requests for a user
   */
  getUserPaymentRequests(userId: string): PaymentRequest[] {
    const requests: PaymentRequest[] = [];
    this.requests.forEach((request) => {
      if (request.requesterId === userId || request.payerId === userId) {
        requests.push(request);
      }
    });
    return requests;
  }
}

// Export singleton instances
export const recurringPaymentManager = new RecurringPaymentManager();
export const groupPaymentManager = new GroupPaymentManager();
export const paymentRequestManager = new PaymentRequestManager();
