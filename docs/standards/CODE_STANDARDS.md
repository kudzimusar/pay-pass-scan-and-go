# Code Standards & Style Guide 📝

## Table of Contents
- [TypeScript Standards](#typescript-standards)
- [React/Next.js Standards](#reactnextjs-standards)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Code Style](#code-style)
- [Import Organization](#import-organization)
- [Component Structure](#component-structure)
- [API Standards](#api-standards)

## TypeScript Standards

### Strict Typing Requirements
```typescript
// ✅ GOOD: Strict typing with proper interfaces
interface PaymentRequest {
  amount: number;
  currency: string;
  recipientId: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ❌ BAD: Using any type
function processPayment(data: any) {
  // Avoid this
}

// ✅ GOOD: Proper typing
function processPayment(request: PaymentRequest): Promise<PaymentResponse> {
  // Implementation
}
```

### Interface Definitions
```typescript
// ✅ Interfaces should be descriptive and well-documented
interface User {
  /** Unique identifier for the user */
  id: string;
  /** User's phone number in international format */
  phoneNumber: string;
  /** User's display name */
  displayName: string;
  /** User type for role-based access */
  userType: UserType;
  /** Account creation timestamp */
  createdAt: Date;
  /** Last login timestamp */
  lastLoginAt?: Date;
}

// ✅ Use union types for controlled values
type UserType = 'user' | 'merchant' | 'operator' | 'partner' | 'admin';
type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
```

### Avoiding `any`
```typescript
// ❌ BAD: Using any
const processData = (data: any) => {
  return data.someProperty;
};

// ✅ GOOD: Using generics
const processData = <T>(data: T): T => {
  return data;
};

// ✅ GOOD: Using unknown for truly unknown data
const parseApiResponse = (response: unknown): ParsedResponse => {
  if (isValidResponse(response)) {
    return response as ParsedResponse;
  }
  throw new Error('Invalid response format');
};
```

### Error Handling
```typescript
// ✅ Custom error types
class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

// ✅ Result type pattern
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function processPayment(request: PaymentRequest): Promise<Result<Payment, PaymentError>> {
  try {
    const payment = await paymentService.process(request);
    return { success: true, data: payment };
  } catch (error) {
    return { 
      success: false, 
      error: new PaymentError('Payment processing failed', 'PAYMENT_FAILED') 
    };
  }
}
```

## React/Next.js Standards

### Functional Components Only
```tsx
// ✅ GOOD: Functional component with proper typing
interface PaymentFormProps {
  onSubmit: (payment: PaymentRequest) => void;
  initialAmount?: number;
  disabled?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  onSubmit, 
  initialAmount = 0, 
  disabled = false 
}) => {
  const [amount, setAmount] = useState(initialAmount);
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Component content */}
    </form>
  );
};

// ❌ BAD: Class components (avoid)
class PaymentForm extends React.Component {
  // Don't use class components
}
```

### Proper Prop Typing
```tsx
// ✅ Required and optional props clearly defined
interface DashboardProps {
  user: User; // Required
  transactions?: Transaction[]; // Optional
  onRefresh?: () => void; // Optional callback
  className?: string; // Optional styling
}

// ✅ Children prop when needed
interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showNavigation?: boolean;
}
```

### App Router Conventions (Next.js 15)
```tsx
// ✅ Page components in app directory
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  );
}

// ✅ Layout components
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}

// ✅ Loading and error components
// app/dashboard/loading.tsx
export default function DashboardLoading() {
  return <div>Loading dashboard...</div>;
}

// app/dashboard/error.tsx
'use client';
export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### Custom Hooks
```tsx
// ✅ Custom hooks for reusable logic
interface UsePaymentReturn {
  balance: number;
  isLoading: boolean;
  error: string | null;
  processPayment: (request: PaymentRequest) => Promise<void>;
  refreshBalance: () => void;
}

function usePayment(userId: string): UsePaymentReturn {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (request: PaymentRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await paymentService.process(request);
      await refreshBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const refreshBalance = useCallback(async () => {
    // Implementation
  }, [userId]);

  return { balance, isLoading, error, processPayment, refreshBalance };
}
```

## File Organization

### Feature-Based Directory Structure
```
app/
├── (auth)/                     # Auth route group
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
├── dashboard/                  # Dashboard feature
│   ├── components/            # Feature-specific components
│   │   ├── balance-card.tsx
│   │   ├── transaction-list.tsx
│   │   └── quick-actions.tsx
│   ├── hooks/                 # Feature-specific hooks
│   │   ├── use-balance.ts
│   │   └── use-transactions.ts
│   ├── types/                 # Feature-specific types
│   │   └── dashboard.types.ts
│   ├── page.tsx
│   └── layout.tsx
├── api/                       # API routes
│   ├── auth/
│   ├── payments/
│   └── users/
└── components/                # Shared components
    ├── ui/                    # Base UI components
    ├── forms/                 # Form components
    └── layout/                # Layout components

components/                    # Shared component library
├── ui/                       # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── forms/                    # Reusable form components
│   ├── payment-form.tsx
│   └── contact-form.tsx
└── layout/                   # Layout components
    ├── header.tsx
    ├── sidebar.tsx
    └── footer.tsx

lib/                          # Shared utilities and services
├── auth/                     # Authentication utilities
├── api/                      # API clients and utilities
├── validations/              # Zod schemas
├── utils/                    # General utilities
└── types/                    # Shared type definitions

hooks/                        # Shared custom hooks
├── use-auth.ts
├── use-api.ts
└── use-local-storage.ts
```

### Component File Organization
```typescript
// components/forms/payment-form.tsx
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentRequest } from '@/lib/types/payment';

// 1. Types and schemas first
const paymentSchema = z.object({
  amount: z.number().min(1),
  recipientId: z.string().min(1),
  description: z.string().optional(),
});

interface PaymentFormProps {
  onSubmit: (payment: PaymentRequest) => void;
  disabled?: boolean;
}

// 2. Component implementation
export function PaymentForm({ onSubmit, disabled = false }: PaymentFormProps) {
  // Component logic
}

// 3. Default export at the end
export default PaymentForm;
```

## Naming Conventions

### File Names
```
// ✅ GOOD: kebab-case for files
payment-form.tsx
user-dashboard.tsx
transaction-list.tsx
use-payment-hook.ts
payment.types.ts

// ❌ BAD: Other cases
PaymentForm.tsx
userDashboard.tsx
TransactionList.tsx
```

### Component Names
```typescript
// ✅ GOOD: PascalCase for components
const PaymentForm = () => {};
const UserDashboard = () => {};
const TransactionList = () => {};

// ✅ GOOD: Descriptive names
const MobileMoneyPaymentForm = () => {};
const AdminUserManagementTable = () => {};
```

### Function Names
```typescript
// ✅ GOOD: camelCase for functions
const processPayment = () => {};
const validateUserInput = () => {};
const formatCurrency = () => {};

// ✅ GOOD: Verb-based names
const handleSubmit = () => {};
const fetchUserData = () => {};
const updateTransactionStatus = () => {};
```

### Variable Names
```typescript
// ✅ GOOD: Descriptive variable names
const userId = '123';
const paymentAmount = 100;
const isProcessingPayment = false;
const userTransactions = [];

// ❌ BAD: Abbreviated or unclear names
const uid = '123';
const amt = 100;
const flag = false;
const data = [];
```

### Constants
```typescript
// ✅ GOOD: SCREAMING_SNAKE_CASE for constants
const MAX_PAYMENT_AMOUNT = 10000;
const DEFAULT_CURRENCY = 'USD';
const API_ENDPOINTS = {
  PAYMENTS: '/api/payments',
  USERS: '/api/users',
} as const;

// ✅ GOOD: Enum naming
enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
```

## Code Style

### Formatting Rules
```typescript
// ✅ Use Prettier defaults
// 2 spaces for indentation
// Single quotes for strings
// Trailing commas where valid
// Semicolons always

const config = {
  apiUrl: 'https://api.paypass.com',
  timeout: 5000,
  retries: 3,
};

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};
```

### Function Declaration Style
```typescript
// ✅ GOOD: Arrow functions for consistency
const processPayment = async (request: PaymentRequest): Promise<Payment> => {
  // Implementation
};

// ✅ GOOD: Named function expressions for hoisting when needed
function validatePaymentRequest(request: unknown): PaymentRequest {
  return paymentSchema.parse(request);
}

// ✅ GOOD: Method shorthand in objects
const paymentService = {
  async process(request: PaymentRequest): Promise<Payment> {
    // Implementation
  },
  
  validate(request: unknown): PaymentRequest {
    return validatePaymentRequest(request);
  },
};
```

## Import Organization

### Import Ordering
```typescript
// 1. React and core libraries
import React, { useState, useEffect } from 'react';
import { NextRequest, NextResponse } from 'next/server';

// 2. Third-party libraries
import { z } from 'zod';
import { clsx } from 'clsx';

// 3. Internal components (UI first)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentForm } from '@/components/forms/payment-form';

// 4. Internal utilities and services
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { validatePayment } from '@/lib/validations/payment';

// 5. Types and constants
import { PaymentRequest, PaymentResponse } from '@/lib/types/payment';
import { API_ENDPOINTS } from '@/lib/constants';
```

### Path Aliases
```typescript
// Use absolute imports with path aliases
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { PaymentService } from '@/lib/services/payment';

// ❌ Avoid relative imports for shared code
import { Button } from '../../../components/ui/button';
import { useAuth } from '../../hooks/use-auth';
```

## Component Structure

### Component Template
```tsx
'use client';

import React from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';

// Types and schemas
interface ComponentProps {
  // Props definition
}

const validationSchema = z.object({
  // Validation schema
});

// Component implementation
export function ComponentName({ 
  prop1, 
  prop2 = defaultValue 
}: ComponentProps) {
  // Hooks
  const [state, setState] = useState(initialValue);
  
  // Derived state
  const computedValue = useMemo(() => {
    return state.map(item => transform(item));
  }, [state]);
  
  // Event handlers
  const handleAction = useCallback((event: Event) => {
    // Handle event
  }, [dependencies]);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // Early returns
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorMessage error={error} />;
  }
  
  // Main render
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
}

// Default export
export default ComponentName;
```

## API Standards

### API Route Structure
```typescript
// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';

const createPaymentSchema = z.object({
  amount: z.number().min(1),
  recipientId: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const user = await auth.getUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Input validation
    const body = await request.json();
    const paymentData = createPaymentSchema.parse(body);

    // 3. Business logic
    const payment = await paymentService.create({
      ...paymentData,
      userId: user.id,
    });

    // 4. Response
    return NextResponse.json({
      success: true,
      data: payment,
    });

  } catch (error) {
    // Error handling
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Payment creation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Response Formats
```typescript
// ✅ Consistent API response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Success response
{
  "success": true,
  "data": {
    "id": "payment_123",
    "amount": 100,
    "status": "completed"
  }
}

// Error response
{
  "success": false,
  "error": "Payment failed",
  "message": "Insufficient funds"
}

// Validation error response
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "amount",
      "message": "Amount must be greater than 0"
    }
  ]
}
```

## Documentation Standards

### JSDoc Comments
```typescript
/**
 * Processes a payment request and returns the payment result.
 * 
 * @param request - The payment request containing amount, recipient, and metadata
 * @param options - Optional configuration for payment processing
 * @returns Promise that resolves to the processed payment
 * 
 * @throws {PaymentError} When payment processing fails
 * @throws {ValidationError} When request data is invalid
 * 
 * @example
 * ```typescript
 * const payment = await processPayment({
 *   amount: 100,
 *   recipientId: 'user_123',
 *   description: 'Coffee payment'
 * });
 * ```
 */
async function processPayment(
  request: PaymentRequest,
  options?: PaymentOptions
): Promise<Payment> {
  // Implementation
}
```

### Component Documentation
```tsx
/**
 * PaymentForm component for handling payment submissions.
 * 
 * Features:
 * - Real-time validation
 * - Currency formatting
 * - Loading states
 * - Error handling
 * 
 * @param onSubmit - Callback fired when form is submitted with valid data
 * @param initialAmount - Optional initial amount to populate
 * @param disabled - Whether the form should be disabled
 * 
 * @example
 * ```tsx
 * <PaymentForm
 *   onSubmit={handlePayment}
 *   initialAmount={50}
 *   disabled={isProcessing}
 * />
 * ```
 */
export function PaymentForm({ onSubmit, initialAmount, disabled }: PaymentFormProps) {
  // Component implementation
}
```

---

## Enforcement

### Pre-commit Hooks
- ESLint for code quality
- Prettier for formatting
- TypeScript compilation check
- Test execution

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] Component prop typing
- [ ] Naming conventions followed
- [ ] File organization correct
- [ ] Documentation complete
- [ ] Tests included

### Validation Script
```bash
npm run validate:code-standards
```

This script checks:
- TypeScript compilation
- ESLint rules
- Prettier formatting
- Import organization
- Naming conventions
- Documentation presence

---

*These standards ensure consistent, maintainable, and high-quality code across the PayPass platform. All team members must follow these guidelines for code reviews and development.*
