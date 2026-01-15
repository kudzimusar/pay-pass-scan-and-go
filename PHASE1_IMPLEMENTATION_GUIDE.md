# Phase 1 Implementation Guide

## Quick Start

This guide walks you through implementing the Phase 1 enhancements step-by-step.

---

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Neon PostgreSQL account (optional, for production)
- Environment variables configured (.env.local)

---

## Step 1: Install Dependencies

The project already includes all required dependencies. Verify they're installed:

```bash
npm install
```

Key dependencies used in enhancements:
- `jsonwebtoken` - JWT token generation and verification
- `bcryptjs` - Password/PIN hashing
- `speakeasy` - TOTP generation and verification
- `zod` - Schema validation
- `decimal.js` - Precise decimal calculations
- `drizzle-orm` - Database ORM

---

## Step 2: Configure Environment Variables

Create or update `.env.local`:

```bash
cp .env.local.example .env.local  # If example exists
# Or create manually
```

Add these variables:

```env
# Database (optional - uses in-memory storage by default)
DATABASE_URL=postgres://user:password@ep-host-name.region.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-12345
JWT_MOBILE_SECRET=your-super-secret-mobile-key-change-in-production-12345

# MFA Configuration
MFA_WINDOW=2
MFA_ISSUER=PayPass

# Exchange Rate APIs (Optional)
OPEN_EXCHANGE_RATES_API_KEY=your-api-key-here
XE_API_KEY=your-api-key-here
XE_API_SECRET=your-api-secret-here

# Node Environment
NODE_ENV=development
```

---

## Step 3: Database Setup (Optional)

If using Neon PostgreSQL:

```bash
# 1. Set DATABASE_URL in .env.local
# 2. Push schema to database
npm run db:push

# 3. Verify connection
npm run db:studio
```

If using in-memory storage (default for development):
- No additional setup needed
- Data persists during development session
- Useful for testing without database

---

## Step 4: Start Development Server

```bash
npm run dev
```

This starts:
- Next.js API server on `http://localhost:3000`
- Vite client server on `http://localhost:5173`

---

## Step 5: Test the Enhanced Endpoints

### 5.1 Test MFA Login Flow

**Create a test user first** (using existing register endpoint):

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "phone": "+263772222222",
    "email": "test@example.com",
    "pin": "1234",
    "biometricEnabled": false
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "user-123",
    "fullName": "Test User",
    "phone": "+263772222222",
    "email": "test@example.com",
    "biometricEnabled": false
  },
  "token": "token_user-123_1234567890"
}
```

**Enable MFA for the user** (using existing MFA setup):

```bash
curl -X POST http://localhost:3000/api/auth/mfa/setup \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123"
  }'
```

Response will include QR code and secret. Scan with authenticator app (Google Authenticator, Authy, etc.).

**Verify MFA setup**:

```bash
curl -X POST http://localhost:3000/api/auth/mfa/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "token": "123456",
    "setup": true
  }'
```

**Test enhanced login** (without MFA):

```bash
curl -X POST http://localhost:3000/api/auth/login-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+263772222222",
    "pin": "1234"
  }'
```

Response (MFA enabled):
```json
{
  "success": true,
  "message": "MFA verification required",
  "requiresMfa": true,
  "mfaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verify MFA token**:

Get TOTP code from authenticator app, then:

```bash
curl -X POST http://localhost:3000/api/auth/mfa/verify-login \
  -H "Content-Type: application/json" \
  -d '{
    "mfaToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token": "123456"
  }'
```

Response:
```json
{
  "success": true,
  "message": "MFA verification successful",
  "user": {
    "id": "user-123",
    "fullName": "Test User",
    "phone": "+263772222222",
    "email": "test@example.com",
    "walletBalance": 0,
    "mfaEnabled": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5.2 Test Financial Operations

**Test balance validation**:

```bash
# First, create a test user with balance
# (Use the register endpoint from above)

# Then validate balance
curl -X GET "http://localhost:3000/api/financial/validate-balance?userId=user-123" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Test transfer** (requires two users):

```bash
curl -X POST http://localhost:3000/api/money/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "senderId": "user-123",
    "recipientId": "user-456",
    "amount": 100,
    "description": "Payment for services"
  }'
```

### 5.3 Test KYC Submission

```bash
curl -X POST http://localhost:3000/api/identity/submit-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "documentType": "passport",
    "documentNumber": "AB123456",
    "documentCountry": "ZW",
    "documentExpiry": "2025-12-31T23:59:59Z",
    "frontImageUrl": "https://example.com/passport-front.jpg",
    "selfieUrl": "https://example.com/selfie.jpg"
  }'
```

**Check KYC status**:

```bash
curl -X GET "http://localhost:3000/api/identity/submit-enhanced?userId=user-123"
```

### 5.4 Test Exchange Rates

**Update exchange rate manually**:

```bash
curl -X POST http://localhost:3000/api/exchange-rates/update-enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "fromCurrency": "USD",
    "toCurrency": "ZWL",
    "rate": 15.50,
    "source": "manual"
  }'
```

**Fetch from external source**:

```bash
curl -X PUT "http://localhost:3000/api/exchange-rates/update-enhanced?source=open_exchange_rates"
```

---

## Step 6: Run Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:auth
npm run test:payments

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## Step 7: Integration with Frontend

### Update Login Component

```typescript
// components/login-form.tsx
import { useState } from 'react'

export function LoginForm() {
  const [step, setStep] = useState<'login' | 'mfa'>('login')
  const [mfaToken, setMfaToken] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [mfaCode, setMfaCode] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const response = await fetch('/api/auth/login-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, pin })
    })

    const data = await response.json()

    if (data.requiresMfa) {
      setMfaToken(data.mfaToken)
      setStep('mfa')
    } else if (data.token) {
      // Store token and redirect
      localStorage.setItem('authToken', data.token)
      window.location.href = '/dashboard'
    }
  }

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const response = await fetch('/api/auth/mfa/verify-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaToken, token: mfaCode })
    })

    const data = await response.json()

    if (data.token) {
      localStorage.setItem('authToken', data.token)
      window.location.href = '/dashboard'
    }
  }

  if (step === 'mfa') {
    return (
      <form onSubmit={handleMfaVerify}>
        <input
          type="text"
          placeholder="Enter 6-digit code from authenticator"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          maxLength={6}
        />
        <button type="submit">Verify</button>
      </form>
    )
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="tel"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="password"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

---

## Step 8: Deployment Checklist

- [ ] Update environment variables for production
- [ ] Change JWT secrets to strong, random values
- [ ] Configure database connection (Neon or other PostgreSQL)
- [ ] Run database migrations: `npm run db:push`
- [ ] Test all endpoints in staging environment
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting (consider Redis for distributed systems)
- [ ] Enable HTTPS
- [ ] Set up backups for database
- [ ] Document API changes for mobile team
- [ ] Create deployment runbook

---

## Troubleshooting

### Issue: "DATABASE_URL not configured"

**Solution**: 
- For development, you don't need DATABASE_URL (uses in-memory storage)
- For production, add DATABASE_URL to .env.local

### Issue: MFA token expired

**Solution**:
- MFA tokens expire after 5 minutes
- User must request new login

### Issue: "Invalid currency code"

**Solution**:
- Ensure currency code is valid ISO 4217 code (e.g., USD, EUR, ZWL)
- Check the supported currencies list in exchange-rates endpoint

### Issue: Balance discrepancy

**Solution**:
- Run balance validation: `GET /api/financial/validate-balance?userId=user-id`
- Check transaction history for inconsistencies
- Contact support if discrepancy persists

---

## Performance Optimization

### 1. Enable Caching

```typescript
// In route handlers
import { redis } from '@/api/_lib/redis'

const cacheKey = `user:${userId}:balance`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

// ... fetch data ...

await redis.set(cacheKey, JSON.stringify(data), 300) // 5 min TTL
```

### 2. Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency);
```

### 3. Query Optimization

- Use pagination for large result sets
- Limit transaction history queries to recent transactions
- Cache exchange rates with TTL

---

## Next Steps

1. **Write Tests**: Create comprehensive test suites for new endpoints
2. **API Documentation**: Generate OpenAPI/Swagger docs
3. **Mobile Integration**: Integrate enhanced endpoints with mobile app
4. **Monitoring**: Set up error tracking and performance monitoring
5. **Phase 2**: Begin Phase 2 implementation with these foundations

---

## Support

For issues or questions:
1. Check PHASE1_ENHANCEMENTS.md for detailed documentation
2. Review AUTHENTICATION_GUIDE.md for auth-specific help
3. Check existing test files for usage examples
4. Contact the development team

---

## Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)
- [TOTP Implementation](https://tools.ietf.org/html/rfc6238)
- [Neon Documentation](https://neon.tech/docs)
