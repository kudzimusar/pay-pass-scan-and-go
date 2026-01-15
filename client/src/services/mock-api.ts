/**
 * Mock API Service
 * Provides mock responses for testing and demo purposes
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  currency: string;
  mfaEnabled: boolean;
}

export interface MockTransaction {
  id: string;
  type: 'topup' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description: string;
}

// Mock user data
const mockUser: MockUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+263771234567',
  balance: 5000,
  currency: 'USD',
  mfaEnabled: true,
};

// Mock transactions
const mockTransactions: MockTransaction[] = [
  {
    id: 'txn-001',
    type: 'topup',
    amount: 1000,
    currency: 'USD',
    status: 'completed',
    date: new Date(Date.now() - 86400000).toISOString(),
    description: 'Wallet top-up via Paynow',
  },
  {
    id: 'txn-002',
    type: 'transfer',
    amount: 500,
    currency: 'USD',
    status: 'completed',
    date: new Date(Date.now() - 172800000).toISOString(),
    description: 'Transfer to Jane Smith',
  },
  {
    id: 'txn-003',
    type: 'payment',
    amount: 250,
    currency: 'USD',
    status: 'completed',
    date: new Date(Date.now() - 259200000).toISOString(),
    description: 'Bill payment',
  },
];

/**
 * Mock API Service
 */
export class MockAPIService {
  private delay = 500; // Simulate network delay

  /**
   * Simulate network delay
   */
  private async simulateDelay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  /**
   * Mock login
   */
  async login(phone: string, pin: string): Promise<{ token: string; user: MockUser }> {
    await this.simulateDelay();
    
    if (!phone || !pin) {
      throw new Error('Phone and PIN are required');
    }

    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: mockUser,
    };
  }

  /**
   * Mock get user profile
   */
  async getUserProfile(): Promise<MockUser> {
    await this.simulateDelay();
    return mockUser;
  }

  /**
   * Mock get transactions
   */
  async getTransactions(limit: number = 10): Promise<MockTransaction[]> {
    await this.simulateDelay();
    return mockTransactions.slice(0, limit);
  }

  /**
   * Mock create payment link
   */
  async createPaymentLink(amount: number, currency: string): Promise<{ link: string; pollUrl: string }> {
    await this.simulateDelay();
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    return {
      link: `https://paynow.co.zw/payment/${Math.random().toString(36).substr(2, 9)}`,
      pollUrl: `https://paynow.co.zw/poll/${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Mock poll payment status
   */
  async pollPaymentStatus(pollUrl: string): Promise<{ status: string; isPaid: boolean }> {
    await this.simulateDelay();
    
    // Simulate random payment status
    const statuses = ['Pending', 'Paid', 'Failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    return {
      status: randomStatus,
      isPaid: randomStatus === 'Paid',
    };
  }

  /**
   * Mock top-up
   */
  async topup(amount: number, currency: string): Promise<{ success: boolean; transactionId: string }> {
    await this.simulateDelay();
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Update mock balance
    mockUser.balance += amount;

    // Add transaction to mock history
    mockTransactions.unshift({
      id: `txn-${Date.now()}`,
      type: 'topup',
      amount,
      currency,
      status: 'completed',
      date: new Date().toISOString(),
      description: 'Wallet top-up',
    });

    return {
      success: true,
      transactionId: `txn-${Date.now()}`,
    };
  }

  /**
   * Mock transfer
   */
  async transfer(recipientId: string, amount: number, currency: string): Promise<{ success: boolean; transactionId: string }> {
    await this.simulateDelay();
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (amount > mockUser.balance) {
      throw new Error('Insufficient balance');
    }

    // Update mock balance
    mockUser.balance -= amount;

    // Add transaction to mock history
    mockTransactions.unshift({
      id: `txn-${Date.now()}`,
      type: 'transfer',
      amount,
      currency,
      status: 'completed',
      date: new Date().toISOString(),
      description: `Transfer to ${recipientId}`,
    });

    return {
      success: true,
      transactionId: `txn-${Date.now()}`,
    };
  }

  /**
   * Mock verify MFA
   */
  async verifyMFA(code: string): Promise<{ success: boolean; token: string }> {
    await this.simulateDelay();
    
    if (!code || code.length !== 6) {
      throw new Error('Invalid MFA code');
    }

    return {
      success: true,
      token: 'mock-jwt-token-' + Date.now(),
    };
  }

  /**
   * Mock register biometric
   */
  async registerBiometric(type: string, data: string): Promise<{ success: boolean; biometricId: string }> {
    await this.simulateDelay();
    
    if (!type || !data) {
      throw new Error('Biometric type and data are required');
    }

    return {
      success: true,
      biometricId: `bio-${Date.now()}`,
    };
  }

  /**
   * Mock verify biometric
   */
  async verifyBiometric(type: string, data: string): Promise<{ success: boolean; matchScore: number }> {
    await this.simulateDelay();
    
    if (!type || !data) {
      throw new Error('Biometric type and data are required');
    }

    // Simulate high match score (95-99%)
    const matchScore = 95 + Math.random() * 4;

    return {
      success: matchScore >= 95,
      matchScore,
    };
  }
}

// Export singleton instance
export const mockAPIService = new MockAPIService();
