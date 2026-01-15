import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FinancialCoreEnhanced } from '../../app/api/_lib/financial-core-enhanced';
import { storage } from '../../app/api/_lib/storage';

describe('FinancialCoreEnhanced', () => {
  const mockUser = {
    id: 'user-123',
    fullName: 'John Doe',
    walletBalance: 1000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Manual mocking since jest.mock is tricky with ESM
    (storage as any).getUserById = jest.fn().mockResolvedValue(mockUser);
    (storage as any).updateUserWalletBalance = jest.fn().mockResolvedValue(true);
    (storage as any).createTransaction = jest.fn().mockResolvedValue({ id: 'tx-123' });
    (storage as any).getUserTransactions = jest.fn().mockResolvedValue([]);
    (storage as any).createNotification = jest.fn().mockResolvedValue(true);
  });

  describe('processOperation', () => {
    it('should successfully process a debit operation', async () => {
      const operation = {
        userId: 'user-123',
        amount: 100,
        type: 'debit' as const,
        category: 'qr_payment' as const,
        description: 'Test payment',
      };

      const result = await FinancialCoreEnhanced.processOperation(operation);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(900);
      expect(storage.updateUserWalletBalance).toHaveBeenCalledWith('user-123', 900);
      expect(storage.createTransaction).toHaveBeenCalled();
    });

    it('should successfully process a credit operation', async () => {
      const operation = {
        userId: 'user-123',
        amount: 100,
        type: 'credit' as const,
        category: 'top_up' as const,
        description: 'Test top up',
      };

      const result = await FinancialCoreEnhanced.processOperation(operation);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(1100);
      expect(storage.updateUserWalletBalance).toHaveBeenCalledWith('user-123', 1100);
    });

    it('should fail if user is not found', async () => {
      (storage.getUserById as any).mockResolvedValue(null);

      const result = await FinancialCoreEnhanced.processOperation({
        userId: 'non-existent',
        amount: 100,
        type: 'debit',
        category: 'qr_payment',
        description: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should fail if insufficient funds for debit', async () => {
      const result = await FinancialCoreEnhanced.processOperation({
        userId: 'user-123',
        amount: 2000, // More than balance
        type: 'debit',
        category: 'qr_payment',
        description: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient funds');
    });

    it('should fail if amount is zero or negative', async () => {
      const result = await FinancialCoreEnhanced.processOperation({
        userId: 'user-123',
        amount: 0,
        type: 'debit',
        category: 'qr_payment',
        description: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Amount must be greater than zero');
    });

    it('should handle transfers between users', async () => {
      const recipientUser = {
        id: 'user-456',
        fullName: 'Jane Doe',
        walletBalance: 500,
      };

      (storage.getUserById as any)
        .mockResolvedValueOnce(mockUser) // Sender
        .mockResolvedValueOnce(recipientUser); // Recipient

      const operation = {
        userId: 'user-123',
        recipientId: 'user-456',
        amount: 200,
        type: 'debit' as const,
        category: 'transfer' as const,
        description: 'Test transfer',
      };

      const result = await FinancialCoreEnhanced.processOperation(operation);

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(800);
      expect(result.recipientNewBalance).toBe(700);
      expect(storage.updateUserWalletBalance).toHaveBeenCalledWith('user-123', 800);
      expect(storage.updateUserWalletBalance).toHaveBeenCalledWith('user-456', 700);
    });
  });

  describe('validateSpendingLimits', () => {
    it('should fail if daily limit is exceeded', async () => {
      // Mock existing transactions for today
      (storage.getUserTransactions as any).mockResolvedValue([
        { amount: 950, type: 'payment', createdAt: new Date().toISOString() },
      ]);

      const result = await FinancialCoreEnhanced.processOperation({
        userId: 'user-123',
        amount: 100, // Total today would be 1050, exceeding 1000 limit
        type: 'debit',
        category: 'qr_payment',
        description: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Daily spending limit exceeded');
    });

    it('should fail if monthly limit is exceeded', async () => {
      const now = new Date();
      // Mock existing transactions for this month (but not today)
      const lastMonth = new Date();
      lastMonth.setDate(now.getDate() - 2); // 2 days ago
      (storage.getUserTransactions as any).mockResolvedValue([
        { amount: 9950, type: 'payment', createdAt: lastMonth.toISOString() },
      ]);

      const result = await FinancialCoreEnhanced.processOperation({
        userId: 'user-123',
        amount: 100, // Total this month would be 10050, exceeding 10000 limit
        type: 'debit',
        category: 'qr_payment',
        description: 'Test',
      } as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Monthly spending limit exceeded');
    });
  });

  describe('validateUserBalance', () => {
    it('should return isValid true if balance matches transactions', async () => {
      (storage.getUserTransactions as any).mockResolvedValue([
        { amount: 500, type: 'topup', createdAt: new Date().toISOString() },
        { amount: 200, type: 'payment', createdAt: new Date().toISOString() },
      ]);

      (storage.getUserById as any).mockResolvedValue({
        ...mockUser,
        walletBalance: 300, // 500 - 200 = 300
      });

      const result = await FinancialCoreEnhanced.validateUserBalance('user-123');

      expect(result.isValid).toBe(true);
      expect(result.discrepancy).toBeLessThan(0.01);
    });

    it('should return isValid false if balance does not match transactions', async () => {
      (storage.getUserTransactions as any).mockResolvedValue([
        { amount: 500, type: 'topup', createdAt: new Date().toISOString() },
      ]);

      (storage.getUserById as any).mockResolvedValue({
        ...mockUser,
        walletBalance: 300, // Should be 500
      });

      const result = await FinancialCoreEnhanced.validateUserBalance('user-123');

      expect(result.isValid).toBe(false);
      expect(result.discrepancy).toBe(200);
    });
  });
});
