# Testing Requirements & Standards 🧪

## Table of Contents
- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Test Data Management](#test-data-management)
- [Continuous Testing](#continuous-testing)

## Testing Philosophy

### Core Principles
1. **Test Early, Test Often** - Shift-left testing approach
2. **Quality Gates** - No code progresses without passing tests
3. **Risk-Based Testing** - Focus on high-risk areas (payments, security)
4. **Automation First** - Automate repetitive tests, manual for exploratory
5. **Test in Production** - Monitor and validate in live environment

### Coverage Requirements
- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user journeys covered
- **Security Tests**: All security controls tested
- **Performance Tests**: All critical paths benchmarked

### Testing Standards
```typescript
// Test file naming convention
// {component-name}.test.ts    - Unit tests
// {component-name}.spec.ts    - Integration tests
// {feature-name}.e2e.ts       - End-to-end tests

// Test structure (AAA Pattern)
describe('Component/Feature Name', () => {
  beforeEach(() => {
    // Arrange - Setup test environment
  });

  it('should perform expected behavior when given specific input', async () => {
    // Arrange - Setup test data
    const input = setupTestData();
    
    // Act - Execute the functionality
    const result = await systemUnderTest.execute(input);
    
    // Assert - Verify the outcome
    expect(result).toEqual(expectedOutput);
  });

  afterEach(() => {
    // Cleanup - Reset test environment
  });
});
```

## Testing Pyramid

### Layer 1: Unit Tests (70% of tests)
**Purpose**: Test individual components in isolation
**Scope**: Functions, classes, components
**Speed**: Very fast (<10ms per test)
**Confidence**: Low-medium

### Layer 2: Integration Tests (20% of tests)
**Purpose**: Test component interactions
**Scope**: API endpoints, database operations, service integrations
**Speed**: Fast (<100ms per test)
**Confidence**: Medium-high

### Layer 3: End-to-End Tests (10% of tests)
**Purpose**: Test complete user workflows
**Scope**: Critical user journeys, cross-browser testing
**Speed**: Slow (>1s per test)
**Confidence**: High

## Unit Testing

### Jest Configuration
```typescript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/test/**/*',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/lib/payments/': {
      // Higher coverage for critical payment functionality
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Unit Testing Examples

#### Payment Service Tests
```typescript
// src/lib/services/payment.test.ts
import { PaymentService } from './payment';
import { PaymentRepository } from '../repositories/payment';
import { UserService } from './user';
import { FraudDetectionService } from './fraud-detection';

// Mock dependencies
jest.mock('../repositories/payment');
jest.mock('./user');
jest.mock('./fraud-detection');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockUserService: jest.Mocked<UserService>;
  let mockFraudDetection: jest.Mocked<FraudDetectionService>;

  beforeEach(() => {
    mockPaymentRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    mockUserService = new UserService() as jest.Mocked<UserService>;
    mockFraudDetection = new FraudDetectionService() as jest.Mocked<FraudDetectionService>;
    
    paymentService = new PaymentService(
      mockPaymentRepository,
      mockUserService,
      mockFraudDetection
    );
  });

  describe('processPayment', () => {
    it('should successfully process a valid payment', async () => {
      // Arrange
      const paymentRequest = {
        senderId: 'user_123',
        recipientId: 'user_456',
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      };

      const mockSender = { id: 'user_123', balance: 500 };
      const mockRecipient = { id: 'user_456', balance: 200 };
      const mockFraudAnalysis = { riskScore: 10, recommendedAction: 'allow' };
      const mockPayment = { id: 'payment_789', ...paymentRequest, status: 'completed' };

      mockUserService.getUser.mockResolvedValueOnce(mockSender);
      mockUserService.getUser.mockResolvedValueOnce(mockRecipient);
      mockFraudDetection.analyzeTransaction.mockResolvedValue(mockFraudAnalysis);
      mockPaymentRepository.create.mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.processPayment(paymentRequest);

      // Assert
      expect(result).toEqual(mockPayment);
      expect(mockUserService.getUser).toHaveBeenCalledWith('user_123');
      expect(mockUserService.getUser).toHaveBeenCalledWith('user_456');
      expect(mockFraudDetection.analyzeTransaction).toHaveBeenCalled();
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining(paymentRequest)
      );
    });

    it('should reject payment when sender has insufficient funds', async () => {
      // Arrange
      const paymentRequest = {
        senderId: 'user_123',
        recipientId: 'user_456',
        amount: 600, // More than available balance
        currency: 'USD',
      };

      const mockSender = { id: 'user_123', balance: 500 };
      mockUserService.getUser.mockResolvedValueOnce(mockSender);

      // Act & Assert
      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('Insufficient funds');
      
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('should block payment when fraud score is high', async () => {
      // Arrange
      const paymentRequest = {
        senderId: 'user_123',
        recipientId: 'user_456',
        amount: 100,
        currency: 'USD',
      };

      const mockSender = { id: 'user_123', balance: 500 };
      const mockRecipient = { id: 'user_456', balance: 200 };
      const mockFraudAnalysis = { riskScore: 95, recommendedAction: 'block' };

      mockUserService.getUser.mockResolvedValueOnce(mockSender);
      mockUserService.getUser.mockResolvedValueOnce(mockRecipient);
      mockFraudDetection.analyzeTransaction.mockResolvedValue(mockFraudAnalysis);

      // Act & Assert
      await expect(paymentService.processPayment(paymentRequest))
        .rejects.toThrow('Payment blocked due to fraud risk');
      
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getCrossBorderExchangeRate', () => {
    it('should return valid exchange rate for supported currencies', async () => {
      // Arrange
      const fromCurrency = 'USD';
      const toCurrency = 'EUR';
      const mockRate = { rate: 0.85, timestamp: new Date() };

      mockPaymentRepository.getExchangeRate.mockResolvedValue(mockRate);

      // Act
      const result = await paymentService.getCrossBorderExchangeRate(
        fromCurrency,
        toCurrency
      );

      // Assert
      expect(result).toEqual(mockRate);
      expect(mockPaymentRepository.getExchangeRate).toHaveBeenCalledWith(
        fromCurrency,
        toCurrency
      );
    });

    it('should throw error for unsupported currency pair', async () => {
      // Arrange
      const fromCurrency = 'USD';
      const toCurrency = 'INVALID';

      mockPaymentRepository.getExchangeRate.mockRejectedValue(
        new Error('Unsupported currency pair')
      );

      // Act & Assert
      await expect(
        paymentService.getCrossBorderExchangeRate(fromCurrency, toCurrency)
      ).rejects.toThrow('Unsupported currency pair');
    });
  });
});
```

#### React Component Tests
```typescript
// src/components/forms/payment-form.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from './payment-form';

describe('PaymentForm', () => {
  const mockOnSubmit = jest.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    disabled: false,
  };

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all form fields', () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send payment/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      expect(screen.getByText(/recipient is required/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate amount format', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    const amountInput = screen.getByLabelText(/amount/i);
    await user.type(amountInput, '-50'); // Invalid negative amount

    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<PaymentForm {...defaultProps} />);

    // Fill form
    await user.type(screen.getByLabelText(/amount/i), '100');
    await user.type(screen.getByLabelText(/recipient/i), 'user_456');
    await user.type(screen.getByLabelText(/description/i), 'Test payment');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /send payment/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 100,
        recipientId: 'user_456',
        description: 'Test payment',
      });
    });
  });

  it('should disable form when disabled prop is true', () => {
    render(<PaymentForm {...defaultProps} disabled={true} />);

    expect(screen.getByLabelText(/amount/i)).toBeDisabled();
    expect(screen.getByLabelText(/recipient/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /send payment/i })).toBeDisabled();
  });
});
```

### Test Utilities
```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/auth-context';

// Mock user for testing
export const mockUser = {
  id: 'user_123',
  phoneNumber: '+1234567890',
  displayName: 'Test User',
  userType: 'user' as const,
  isActive: true,
};

// Custom render with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock API responses
export const mockApiResponse = <T>(data: T) => ({
  success: true,
  data,
  metadata: {
    timestamp: new Date().toISOString(),
    requestId: 'test_request_123',
    version: '1.0.0',
  },
});

// Generate test data
export const generateTestPayment = (overrides = {}) => ({
  id: 'payment_123',
  senderId: 'user_123',
  recipientId: 'user_456',
  amount: 100,
  currency: 'USD',
  status: 'completed',
  description: 'Test payment',
  createdAt: new Date(),
  ...overrides,
});

// Database test helpers
export const createTestUser = async (overrides = {}) => {
  return await db.insert(users).values({
    phoneNumber: '+1234567890',
    passwordHash: 'hashed_password',
    userType: 'user',
    ...overrides,
  }).returning();
};

export const cleanupTestData = async () => {
  await db.delete(payments);
  await db.delete(users);
};
```

## Integration Testing

### API Integration Tests
```typescript
// src/app/api/payments/route.test.ts
import { NextRequest } from 'next/server';
import { POST } from './route';
import { generateTestToken } from '@/test/auth-utils';
import { cleanupTestData, createTestUser } from '@/test/db-utils';

describe('/api/payments POST', () => {
  let testUser: User;
  let authToken: string;

  beforeEach(async () => {
    await cleanupTestData();
    [testUser] = await createTestUser({
      phoneNumber: '+1234567890',
      balance: 1000,
    });
    authToken = generateTestToken(testUser.id);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('should create payment with valid request', async () => {
    // Arrange
    const recipient = await createTestUser({
      phoneNumber: '+0987654321',
    });

    const paymentData = {
      amount: 100,
      currency: 'USD',
      recipientId: recipient[0].id,
      description: 'Test payment',
    };

    const request = new NextRequest('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toMatchObject({
      amount: 100,
      currency: 'USD',
      senderId: testUser.id,
      recipientId: recipient[0].id,
      status: 'completed',
    });
  });

  it('should return 401 without authentication', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 with invalid input', async () => {
    // Arrange
    const invalidData = {
      amount: -100, // Invalid negative amount
      currency: 'INVALID',
      recipientId: 'not_a_uuid',
    };

    const request = new NextRequest('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(invalidData),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid input');
    expect(data.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['amount'] }),
        expect.objectContaining({ path: ['currency'] }),
        expect.objectContaining({ path: ['recipientId'] }),
      ])
    );
  });

  it('should handle insufficient funds', async () => {
    // Arrange - User with low balance
    const lowBalanceUser = await createTestUser({
      phoneNumber: '+1111111111',
      balance: 50,
    });
    const lowBalanceToken = generateTestToken(lowBalanceUser[0].id);

    const recipient = await createTestUser({
      phoneNumber: '+2222222222',
    });

    const paymentData = {
      amount: 100, // More than balance
      currency: 'USD',
      recipientId: recipient[0].id,
    };

    const request = new NextRequest('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lowBalanceToken}`,
      },
      body: JSON.stringify(paymentData),
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Insufficient funds');
  });
});
```

### Database Integration Tests
```typescript
// src/lib/repositories/payment.test.ts
import { PaymentRepository } from './payment';
import { db } from '@/lib/db';
import { users, payments } from '@/lib/db/schema';
import { cleanupTestData, createTestUser } from '@/test/db-utils';

describe('PaymentRepository', () => {
  let paymentRepository: PaymentRepository;
  let sender: User;
  let recipient: User;

  beforeEach(async () => {
    await cleanupTestData();
    paymentRepository = new PaymentRepository(db);
    
    [sender] = await createTestUser({
      phoneNumber: '+1111111111',
      balance: 1000,
    });
    
    [recipient] = await createTestUser({
      phoneNumber: '+2222222222',
      balance: 500,
    });
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('create', () => {
    it('should create payment and update balances in transaction', async () => {
      // Arrange
      const paymentData = {
        senderId: sender.id,
        recipientId: recipient.id,
        amount: 100,
        currency: 'USD',
        description: 'Test payment',
      };

      // Act
      const payment = await paymentRepository.create(paymentData);

      // Assert
      expect(payment).toMatchObject(paymentData);
      expect(payment.id).toBeDefined();
      expect(payment.status).toBe('completed');

      // Verify balances were updated
      const updatedSender = await db.select().from(users).where(eq(users.id, sender.id));
      const updatedRecipient = await db.select().from(users).where(eq(users.id, recipient.id));

      expect(updatedSender[0].balance).toBe(900); // 1000 - 100
      expect(updatedRecipient[0].balance).toBe(600); // 500 + 100
    });

    it('should rollback transaction if balance update fails', async () => {
      // Arrange - Invalid recipient ID
      const paymentData = {
        senderId: sender.id,
        recipientId: 'invalid_recipient_id',
        amount: 100,
        currency: 'USD',
      };

      // Act & Assert
      await expect(paymentRepository.create(paymentData)).rejects.toThrow();

      // Verify no payment was created
      const paymentsCount = await db.select().from(payments);
      expect(paymentsCount).toHaveLength(0);

      // Verify sender balance unchanged
      const senderBalance = await db.select().from(users).where(eq(users.id, sender.id));
      expect(senderBalance[0].balance).toBe(1000);
    });
  });

  describe('findByUserId', () => {
    it('should return user payments with pagination', async () => {
      // Arrange - Create multiple payments
      const paymentPromises = Array.from({ length: 15 }, (_, i) =>
        paymentRepository.create({
          senderId: sender.id,
          recipientId: recipient.id,
          amount: (i + 1) * 10,
          currency: 'USD',
          description: `Payment ${i + 1}`,
        })
      );
      await Promise.all(paymentPromises);

      // Act
      const result = await paymentRepository.findByUserId(sender.id, {
        page: 1,
        pageSize: 10,
      });

      // Assert
      expect(result.payments).toHaveLength(10);
      expect(result.totalCount).toBe(15);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrevious).toBe(false);
    });

    it('should filter payments by status', async () => {
      // Arrange
      await paymentRepository.create({
        senderId: sender.id,
        recipientId: recipient.id,
        amount: 100,
        currency: 'USD',
        status: 'completed',
      });

      await paymentRepository.create({
        senderId: sender.id,
        recipientId: recipient.id,
        amount: 200,
        currency: 'USD',
        status: 'pending',
      });

      // Act
      const completedPayments = await paymentRepository.findByUserId(sender.id, {
        page: 1,
        pageSize: 10,
        status: 'completed',
      });

      // Assert
      expect(completedPayments.payments).toHaveLength(1);
      expect(completedPayments.payments[0].status).toBe('completed');
      expect(completedPayments.payments[0].amount).toBe(100);
    });
  });
});
```

## End-to-End Testing

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples
```typescript
// e2e/payment-flow.e2e.ts
import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from './utils/test-helpers';

test.describe('Payment Flow', () => {
  let sender: TestUser;
  let recipient: TestUser;

  test.beforeEach(async () => {
    // Setup test users
    sender = await setupTestUser({
      phoneNumber: '+1234567890',
      balance: 1000,
    });
    
    recipient = await setupTestUser({
      phoneNumber: '+0987654321',
      balance: 500,
    });
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('should complete payment flow successfully', async ({ page }) => {
    // Login as sender
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', sender.phoneNumber);
    await page.fill('[data-testid="password-input"]', sender.password);
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // Navigate to send money
    await page.click('[data-testid="send-money-button"]');
    await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

    // Fill payment form
    await page.fill('[data-testid="amount-input"]', '100');
    await page.fill('[data-testid="recipient-input"]', recipient.phoneNumber);
    await page.fill('[data-testid="description-input"]', 'E2E test payment');

    // Submit payment
    await page.click('[data-testid="send-payment-button"]');

    // Verify payment confirmation
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-amount"]')).toContainText('$100');
    await expect(page.locator('[data-testid="recipient-info"]')).toContainText(recipient.phoneNumber);

    // Verify balance update
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="balance"]')).toContainText('$900');
  });

  test('should handle insufficient funds error', async ({ page }) => {
    // Login as sender
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', sender.phoneNumber);
    await page.fill('[data-testid="password-input"]', sender.password);
    await page.click('[data-testid="login-button"]');

    // Navigate to send money
    await page.click('[data-testid="send-money-button"]');

    // Try to send more than balance
    await page.fill('[data-testid="amount-input"]', '2000'); // More than $1000 balance
    await page.fill('[data-testid="recipient-input"]', recipient.phoneNumber);
    await page.click('[data-testid="send-payment-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient funds');

    // Verify balance unchanged
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="balance"]')).toContainText('$1000');
  });

  test('should require MFA for high-value transactions', async ({ page }) => {
    // Setup user with MFA enabled
    const mfaUser = await setupTestUser({
      phoneNumber: '+1111111111',
      balance: 10000,
      mfaEnabled: true,
    });

    // Login
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', mfaUser.phoneNumber);
    await page.fill('[data-testid="password-input"]', mfaUser.password);
    await page.click('[data-testid="login-button"]');

    // Enter MFA code
    await expect(page.locator('[data-testid="mfa-form"]')).toBeVisible();
    await page.fill('[data-testid="mfa-input"]', '123456'); // Mock MFA code
    await page.click('[data-testid="verify-mfa-button"]');

    // Navigate to send money
    await page.click('[data-testid="send-money-button"]');

    // Send high-value payment
    await page.fill('[data-testid="amount-input"]', '5000');
    await page.fill('[data-testid="recipient-input"]', recipient.phoneNumber);
    await page.click('[data-testid="send-payment-button"]');

    // Should require additional MFA verification
    await expect(page.locator('[data-testid="transaction-mfa"]')).toBeVisible();
    await page.fill('[data-testid="transaction-mfa-input"]', '654321');
    await page.click('[data-testid="confirm-transaction-button"]');

    // Verify success
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
  });
});

// e2e/cross-border-payment.e2e.ts
test.describe('Cross-Border Payment Flow', () => {
  test('should handle currency conversion in cross-border payment', async ({ page }) => {
    // Setup international sender
    const sender = await setupTestUser({
      phoneNumber: '+12345678901',
      balance: 1000,
      country: 'US',
      currency: 'USD',
    });

    // Setup international recipient
    const recipient = await setupTestUser({
      phoneNumber: '+441234567890',
      country: 'GB',
      currency: 'GBP',
    });

    // Login and navigate to cross-border payment
    await page.goto('/login');
    await page.fill('[data-testid="phone-input"]', sender.phoneNumber);
    await page.fill('[data-testid="password-input"]', sender.password);
    await page.click('[data-testid="login-button"]');

    await page.click('[data-testid="cross-border-payment-button"]');

    // Fill cross-border payment form
    await page.fill('[data-testid="amount-input"]', '100');
    await page.selectOption('[data-testid="from-currency"]', 'USD');
    await page.selectOption('[data-testid="to-currency"]', 'GBP');
    await page.fill('[data-testid="recipient-input"]', recipient.phoneNumber);

    // Verify exchange rate is displayed
    await expect(page.locator('[data-testid="exchange-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="converted-amount"]')).toBeVisible();

    // Complete KYC verification for cross-border
    await page.click('[data-testid="verify-identity-button"]');
    await page.setInputFiles('[data-testid="identity-document"]', 'test-files/passport.jpg');
    await page.setInputFiles('[data-testid="address-proof"]', 'test-files/utility-bill.pdf');
    await page.click('[data-testid="submit-documents-button"]');

    // Wait for verification (mocked to be instant in test)
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();

    // Submit payment
    await page.click('[data-testid="send-payment-button"]');

    // Verify payment success with conversion details
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="original-amount"]')).toContainText('$100 USD');
    await expect(page.locator('[data-testid="converted-amount"]')).toContainText('£');
    await expect(page.locator('[data-testid="exchange-rate-used"]')).toBeVisible();
  });
});
```

### Test Utilities for E2E
```typescript
// e2e/utils/test-helpers.ts
import { Page } from '@playwright/test';

interface TestUser {
  id: string;
  phoneNumber: string;
  password: string;
  balance: number;
  country?: string;
  currency?: string;
  mfaEnabled?: boolean;
}

export async function setupTestUser(userData: Partial<TestUser>): Promise<TestUser> {
  const defaultUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    phoneNumber: '+1234567890',
    password: 'TestPassword123!',
    balance: 1000,
    country: 'US',
    currency: 'USD',
    mfaEnabled: false,
    ...userData,
  };

  // Create user via API
  await fetch('/api/test/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(defaultUser),
  });

  return defaultUser;
}

export async function cleanupTestData(): Promise<void> {
  await fetch('/api/test/cleanup', { method: 'DELETE' });
}

export async function loginUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.fill('[data-testid="phone-input"]', user.phoneNumber);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="login-button"]');
  
  if (user.mfaEnabled) {
    await page.fill('[data-testid="mfa-input"]', '123456');
    await page.click('[data-testid="verify-mfa-button"]');
  }
  
  await page.waitForSelector('[data-testid="dashboard"]');
}

export async function mockExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): Promise<void> {
  await fetch('/api/test/mock-exchange-rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromCurrency, toCurrency, rate }),
  });
}
```

## Performance Testing

### Load Testing with Artillery
```yaml
# performance/load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 1
      name: "Warm up"
    
    # Ramp up
    - duration: 120
      arrivalRate: 1
      rampTo: 10
      name: "Ramp up load"
    
    # Sustained load
    - duration: 300
      arrivalRate: 10
      name: "Sustained load"
    
    # Peak load
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Peak load"

scenarios:
  - name: "Payment API Load Test"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            phoneNumber: "+{{ $randomPhoneNumber() }}"
            password: "TestPassword123!"
          capture:
            - json: "$.data.accessToken"
              as: "authToken"
      
      - post:
          url: "/api/payments"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            amount: "{{ $randomInt(10, 500) }}"
            currency: "USD"
            recipientId: "{{ $randomUUID() }}"
            description: "Load test payment"
          expect:
            - statusCode: 200
  
  - name: "Dashboard Load Test"
    weight: 30
    flow:
      - get:
          url: "/api/dashboard"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
            - contentType: "application/json"

```

### Performance Monitoring
```typescript
// src/lib/performance/monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();

  startTimer(operation: string): PerformanceTimer {
    const startTime = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(operation, duration);
        return duration;
      },
    };
  }

  async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const timer = this.startTimer(operation);
    try {
      const result = await fn();
      timer.end();
      return result;
    } catch (error) {
      timer.end();
      throw error;
    }
  }

  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push({
      timestamp: Date.now(),
      duration,
      operation,
    });

    // Keep only recent metrics (last 1000)
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  getMetrics(operation: string): PerformanceStats {
    const metrics = this.metrics.get(operation) || [];
    const durations = metrics.map(m => m.duration);
    
    return {
      count: durations.length,
      average: durations.reduce((sum, d) => sum + d, 0) / durations.length || 0,
      min: Math.min(...durations) || 0,
      max: Math.max(...durations) || 0,
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    };
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// Usage in API routes
export async function POST(request: NextRequest) {
  const timer = performanceMonitor.startTimer('payment_creation');
  
  try {
    const result = await processPayment(request);
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
}
```

## Security Testing

### Security Test Suite
```typescript
// src/test/security/auth.security.test.ts
describe('Authentication Security', () => {
  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
      ];

      for (const password of weakPasswords) {
        await expect(
          authService.register({
            phoneNumber: '+1234567890',
            password,
          })
        ).rejects.toThrow('Password does not meet security requirements');
      }
    });

    it('should require password complexity', async () => {
      const invalidPasswords = [
        'onlylowercase',        // No uppercase
        'ONLYUPPERCASE',        // No lowercase
        'NoNumbers',            // No numbers
        'NoSpecialChars123',    // No special characters
        'Short1!',              // Too short
      ];

      for (const password of invalidPasswords) {
        await expect(
          authService.register({
            phoneNumber: '+1234567890',
            password,
          })
        ).rejects.toThrow();
      }
    });

    it('should enforce rate limiting on login attempts', async () => {
      const phoneNumber = '+1234567890';
      
      // Make multiple failed login attempts
      const promises = Array.from({ length: 6 }, () =>
        authService.login({
          phoneNumber,
          password: 'wrong_password',
        })
      );

      const results = await Promise.allSettled(promises);
      
      // First 5 should fail with "invalid credentials"
      // 6th should fail with "too many attempts"
      const lastResult = results[5];
      expect(lastResult.status).toBe('rejected');
      expect(lastResult.reason.message).toContain('Too many login attempts');
    });
  });

  describe('Session Security', () => {
    it('should invalidate sessions after timeout', async () => {
      // Create session
      const { accessToken } = await authService.login({
        phoneNumber: '+1234567890',
        password: 'ValidPassword123!',
      });

      // Mock time advance beyond session timeout
      jest.advanceTimersByTime(16 * 60 * 1000); // 16 minutes

      // Attempt to use expired token
      await expect(
        authService.validateToken(accessToken)
      ).rejects.toThrow('Token expired');
    });

    it('should require secure cookies in production', () => {
      process.env.NODE_ENV = 'production';
      
      const response = authService.createSessionResponse(mockUser);
      const setCookieHeader = response.headers.get('Set-Cookie');
      
      expect(setCookieHeader).toContain('Secure');
      expect(setCookieHeader).toContain('HttpOnly');
      expect(setCookieHeader).toContain('SameSite=Strict');
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in phone number field', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET password='hacked'; --",
      ];

      for (const input of maliciousInputs) {
        await expect(
          authService.login({
            phoneNumber: input,
            password: 'password',
          })
        ).rejects.toThrow('Invalid phone number format');
      }
    });

    it('should sanitize user input to prevent XSS', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')" />',
      ];

      for (const payload of xssPayloads) {
        const result = await userService.updateProfile(mockUser.id, {
          displayName: payload,
        });

        expect(result.displayName).not.toContain('<script>');
        expect(result.displayName).not.toContain('javascript:');
        expect(result.displayName).not.toContain('onerror');
      }
    });
  });
});

// Payment security tests
describe('Payment Security', () => {
  describe('Transaction Security', () => {
    it('should prevent double spending', async () => {
      const paymentRequest = {
        senderId: 'user_123',
        recipientId: 'user_456',
        amount: 1000, // User's full balance
        currency: 'USD',
      };

      // Attempt concurrent payments
      const promise1 = paymentService.processPayment(paymentRequest);
      const promise2 = paymentService.processPayment(paymentRequest);

      const results = await Promise.allSettled([promise1, promise2]);
      
      // Only one should succeed
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes).toHaveLength(1);
    });

    it('should require additional verification for high-value transactions', async () => {
      const highValuePayment = {
        senderId: 'user_123',
        recipientId: 'user_456',
        amount: 10000, // High value
        currency: 'USD',
      };

      await expect(
        paymentService.processPayment(highValuePayment)
      ).rejects.toThrow('Additional verification required');
    });

    it('should detect and block suspicious transaction patterns', async () => {
      const suspiciousPayments = Array.from({ length: 10 }, (_, i) => ({
        senderId: 'user_123',
        recipientId: `user_${i}`,
        amount: 100,
        currency: 'USD',
      }));

      // Process multiple payments rapidly
      for (const payment of suspiciousPayments) {
        if (suspiciousPayments.indexOf(payment) > 4) {
          // Should start blocking after 5 payments
          await expect(
            paymentService.processPayment(payment)
          ).rejects.toThrow('Suspicious activity detected');
        } else {
          await paymentService.processPayment(payment);
        }
      }
    });
  });

  describe('Data Protection', () => {
    it('should encrypt sensitive payment data', async () => {
      const paymentData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryDate: '12/25',
      };

      const encryptedData = await dataProtectionService.encrypt(paymentData);
      
      expect(encryptedData.cardNumber).not.toEqual(paymentData.cardNumber);
      expect(encryptedData.cvv).toBeUndefined(); // CVV should never be stored
      expect(encryptedData.expiryDate).toEqual(paymentData.expiryDate); // Can be stored
    });

    it('should mask PII in logs', async () => {
      const sensitiveData = {
        phoneNumber: '+1234567890',
        email: 'user@example.com',
        cardNumber: '4111111111111111',
      };

      const maskedData = dataProtectionService.maskForLogging(sensitiveData);
      
      expect(maskedData.phoneNumber).toEqual('+123****7890');
      expect(maskedData.email).toEqual('u***@example.com');
      expect(maskedData.cardNumber).toEqual('411111******1111');
    });
  });
});
```

## Test Data Management

### Test Data Factory
```typescript
// src/test/factories/index.ts
export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: `user_${faker.string.uuid()}`,
      phoneNumber: faker.phone.number({ style: 'international' }),
      passwordHash: '$2b$12$hashedpassword',
      displayName: faker.person.fullName(),
      userType: 'user',
      isActive: true,
      balance: faker.number.int({ min: 0, max: 10000 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createPayment(overrides: Partial<Payment> = {}): Payment {
    return {
      id: `payment_${faker.string.uuid()}`,
      senderId: `user_${faker.string.uuid()}`,
      recipientId: `user_${faker.string.uuid()}`,
      amount: faker.number.float({ min: 1, max: 1000, precision: 2 }),
      currency: faker.helpers.arrayElement(['USD', 'EUR', 'GBP']),
      status: faker.helpers.arrayElement(['pending', 'completed', 'failed', 'cancelled']),
      description: faker.commerce.productDescription(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  static createTransaction(overrides: Partial<Transaction> = {}): Transaction {
    const amount = faker.number.float({ min: 1, max: 1000, precision: 2 });
    
    return {
      id: `txn_${faker.string.uuid()}`,
      userId: `user_${faker.string.uuid()}`,
      type: faker.helpers.arrayElement(['payment', 'transfer', 'topup', 'withdrawal']),
      amount,
      currency: 'USD',
      status: 'completed',
      reference: faker.string.alphanumeric(10).toUpperCase(),
      description: faker.commerce.productDescription(),
      createdAt: faker.date.past(),
      ...overrides,
    };
  }

  static createBulkUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(overrides));
  }

  static createBulkPayments(count: number, overrides: Partial<Payment> = {}): Payment[] {
    return Array.from({ length: count }, () => this.createPayment(overrides));
  }
}
```

---

This comprehensive testing guide ensures that the PayPass platform maintains high quality, security, and performance standards throughout its development lifecycle. Each testing layer provides specific value and confidence in the system's reliability.