/**
 * Test utilities and helpers
 * Provides common functions for setting up test data and mocking services
 */

import { randomUUID } from 'crypto';

// Mock database for testing
class TestDatabase {
  private users: Map<string, any> = new Map();
  private friendNetworks: Map<string, any> = new Map();
  private crossBorderPayments: Map<string, any> = new Map();
  private exchangeRates: Map<string, any> = new Map();
  private transactions: Map<string, any> = new Map();

  async createUser(userData: any): Promise<string> {
    const id = randomUUID();
    const user = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData,
    };
    this.users.set(id, user);
    return id;
  }

  async createFriendNetwork(friendData: any): Promise<string> {
    const id = randomUUID();
    const friend = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalSent: '0.00',
      ...friendData,
    };
    this.friendNetworks.set(id, friend);
    return id;
  }

  async createExchangeRate(from: string, to: string, rate: number): Promise<string> {
    const id = randomUUID();
    const exchangeRate = {
      id,
      fromCurrency: from,
      toCurrency: to,
      rate: rate.toString(),
      source: 'test',
      isActive: true,
      createdAt: new Date(),
    };
    this.exchangeRates.set(id, exchangeRate);
    return id;
  }

  async createTransaction(txData: any): Promise<string> {
    const id = randomUUID();
    const transaction = {
      id,
      createdAt: new Date(),
      status: 'completed',
      ...txData,
    };
    this.transactions.set(id, transaction);
    return id;
  }

  async createCrossBorderPayment(paymentData: any): Promise<string> {
    const id = randomUUID();
    const payment = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      ...paymentData,
    };
    this.crossBorderPayments.set(id, payment);
    return id;
  }

  async getUser(id: string): Promise<any | null> {
    return this.users.get(id) || null;
  }

  async getUserByPhone(phone: string): Promise<any | null> {
    for (const user of this.users.values()) {
      if (user.phone === phone) {
        return user;
      }
    }
    return null;
  }

  async getFriendNetwork(senderId: string, recipientId: string): Promise<any | null> {
    for (const friend of this.friendNetworks.values()) {
      if (friend.senderId === senderId && friend.recipientId === recipientId) {
        return friend;
      }
    }
    return null;
  }

  async getExchangeRate(from: string, to: string): Promise<any | null> {
    for (const rate of this.exchangeRates.values()) {
      if (rate.fromCurrency === from && rate.toCurrency === to && rate.isActive) {
        return rate;
      }
    }
    return null;
  }

  async cleanup(): Promise<void> {
    this.users.clear();
    this.friendNetworks.clear();
    this.crossBorderPayments.clear();
    this.exchangeRates.clear();
    this.transactions.clear();
  }

  // Helper methods for testing
  getUserCount(): number {
    return this.users.size;
  }

  getFriendNetworkCount(): number {
    return this.friendNetworks.size;
  }

  getTransactionCount(): number {
    return this.transactions.size;
  }
}

export const testDb = new TestDatabase();

// Helper functions
export async function createTestUser(userData: Partial<{
  fullName: string;
  phone: string;
  email: string;
  pin: string;
  isInternational: boolean;
  kycStatus: string;
  countryCode: string;
  mfaEnabled: boolean;
}>): Promise<string> {
  const defaultUser = {
    fullName: 'Test User',
    phone: '+1234567890',
    email: 'test@example.com',
    pin: '$2a$10$uE4c0e2CwVdO3GgciJzJ2eR8yq1m7p1G6qS0m3u2h3lJ2b0Y3QF5W', // '1234' hashed
    isInternational: false,
    kycStatus: 'pending',
    countryCode: 'ZW',
    mfaEnabled: false,
    biometricEnabled: false,
  };

  return testDb.createUser({ ...defaultUser, ...userData });
}

export async function createTestFriend(friendData: {
  senderId: string;
  recipientId: string;
  relationship: 'family' | 'friend' | 'business';
  nickname?: string;
  monthlyLimit: string;
  isVerified?: boolean;
}): Promise<string> {
  const defaultFriend = {
    isVerified: true,
    totalSent: '0.00',
  };

  return testDb.createFriendNetwork({ ...defaultFriend, ...friendData });
}

export async function createTestExchangeRate(from: string, to: string, rate: number): Promise<string> {
  return testDb.createExchangeRate(from, to, rate);
}

export async function createTestTransaction(txData: Partial<{
  userId: string;
  type: string;
  category: string;
  amount: string;
  currency: string;
  description: string;
  status: string;
  paymentMethod: string;
}>): Promise<string> {
  const defaultTx = {
    type: 'payment',
    category: 'transfer',
    amount: '100.00',
    currency: 'USD',
    description: 'Test transaction',
    status: 'completed',
    paymentMethod: 'wallet',
  };

  return testDb.createTransaction({ ...defaultTx, ...txData });
}

export async function createTestCrossBorderPayment(paymentData: Partial<{
  senderId: string;
  recipientId: string;
  senderAmount: string;
  senderCurrency: string;
  recipientAmount: string;
  recipientCurrency: string;
  exchangeRate: string;
  purpose: string;
  status: string;
}>): Promise<string> {
  const defaultPayment = {
    senderAmount: '100.00',
    senderCurrency: 'USD',
    recipientAmount: '132000.00',
    recipientCurrency: 'ZWL',
    exchangeRate: '1320.00',
    purpose: 'Test payment',
    status: 'pending',
    exchangeFee: '2.00',
    transferFee: '2.00',
    totalFees: '4.00',
  };

  return testDb.createCrossBorderPayment({ ...defaultPayment, ...paymentData });
}

// Mock API responses
export function mockSuccessResponse(data: any) {
  return {
    success: true,
    ...data,
  };
}

export function mockErrorResponse(error: string, status = 400) {
  return {
    success: false,
    error,
    status,
  };
}

// Test data generators
export function generateTestUser(overrides: any = {}) {
  return {
    id: randomUUID(),
    fullName: `Test User ${Math.random().toString(36).substr(2, 5)}`,
    phone: `+12345${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
    email: `test${Math.random().toString(36).substr(2, 5)}@example.com`,
    isInternational: Math.random() > 0.5,
    kycStatus: ['pending', 'verified', 'rejected'][Math.floor(Math.random() * 3)],
    countryCode: ['US', 'ZW', 'ZA', 'UK'][Math.floor(Math.random() * 4)],
    createdAt: new Date(),
    ...overrides,
  };
}

export function generateTestTransaction(overrides: any = {}) {
  return {
    id: randomUUID(),
    amount: (Math.random() * 1000).toFixed(2),
    currency: ['USD', 'ZWL', 'EUR', 'GBP'][Math.floor(Math.random() * 4)],
    type: ['payment', 'topup', 'send', 'receive'][Math.floor(Math.random() * 4)],
    category: ['transfer', 'friend_payment', 'mobile_money'][Math.floor(Math.random() * 3)],
    status: ['pending', 'completed', 'failed'][Math.floor(Math.random() * 3)],
    description: `Test transaction ${Math.random().toString(36).substr(2, 8)}`,
    createdAt: new Date(),
    ...overrides,
  };
}

// Performance testing utilities
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  maxDuration = 5000
): Promise<{ result: T; duration: number; success: boolean }> {
  const startTime = Date.now();
  let success = true;
  let result: T;

  try {
    result = await operation();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    
    if (duration > maxDuration) {
      console.warn(`Operation took ${duration}ms, which exceeds the ${maxDuration}ms threshold`);
    }

    return { result: result!, duration, success };
  }
}

// Load testing utilities
export async function runLoadTest(
  operation: () => Promise<any>,
  concurrency = 10,
  iterations = 100
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
}> {
  const results: { success: boolean; duration: number }[] = [];
  const batches = Math.ceil(iterations / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    const promises = Array.from({ length: batchSize }, () =>
      measurePerformance(operation).catch(error => ({ 
        result: null, 
        duration: 0, 
        success: false,
        error 
      }))
    );

    const batchResults = await Promise.all(promises);
    results.push(...batchResults.map(r => ({ success: r.success, duration: r.duration })));
  }

  const successfulResults = results.filter(r => r.success);
  const durations = successfulResults.map(r => r.duration);

  return {
    totalRequests: results.length,
    successfulRequests: successfulResults.length,
    failedRequests: results.length - successfulResults.length,
    averageResponseTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
    minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
  };
}

// Security testing utilities
export function generateSecurityTestData() {
  return {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'/*",
      "' UNION SELECT * FROM users --",
    ],
    xssPayloads: [
      "<script>alert('xss')</script>",
      "javascript:alert('xss')",
      "<img src=x onerror=alert('xss')>",
      "<svg onload=alert('xss')>",
    ],
    invalidTokens: [
      "invalid_token",
      "expired_token",
      "",
      null,
      undefined,
    ],
    invalidUserIds: [
      "not-a-uuid",
      "",
      null,
      undefined,
      "00000000-0000-0000-0000-000000000000",
    ],
  };
}

// Cleanup utilities
export async function cleanupTestData(): Promise<void> {
  await testDb.cleanup();
}

// Environment utilities
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing';
}

export function getTestConfig() {
  return {
    apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
    testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
    enableSlowTests: process.env.ENABLE_SLOW_TESTS === 'true',
    testDatabase: process.env.TEST_DATABASE_URL,
  };
}

// Export the test database instance
export { testDb };

// Default export for convenience
export default {
  testDb,
  createTestUser,
  createTestFriend,
  createTestExchangeRate,
  createTestTransaction,
  createTestCrossBorderPayment,
  mockSuccessResponse,
  mockErrorResponse,
  generateTestUser,
  generateTestTransaction,
  measurePerformance,
  runLoadTest,
  generateSecurityTestData,
  cleanupTestData,
  isTestEnvironment,
  getTestConfig,
};