# PayPass API Endpoints Documentation

This document serves as the central reference for all public and internal API endpoints within the PayPass platform, with a focus on the enhanced Phase 1 and Phase 2 features.

## 1. Authentication & Security Endpoints

The core authentication flow has been enhanced to include Multi-Factor Authentication (MFA) and robust account security measures.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/login-enhanced` | `POST` | **Recommended Login Flow.** Accepts phone and PIN. Returns a JWT token or an MFA token if MFA is enabled. | None | Enhanced |
| `/api/auth/mfa/verify-login` | `POST` | **MFA Verification.** Accepts MFA token and TOTP code. Returns a full JWT token upon successful verification. | MFA Token | New |
| `/api/auth/login` | `POST` | Legacy login endpoint. Does not support the new MFA flow or account lockout features. | None | Legacy |
| `/api/auth/mfa/setup` | `POST` | Initiates the TOTP MFA setup process for a user. | JWT | Existing |
| `/api/auth/mfa/verify` | `POST` | Verifies the TOTP code during the MFA setup process. | JWT | Existing |

### Request/Response Schemas (Enhanced Login)

**`POST /api/auth/login-enhanced`**

| Field | Type | Description |
| :--- | :--- | :--- |
| `phone` | `string` | User's phone number (e.g., `+263771234567`). |
| `pin` | `string` | User's 4-12 digit PIN. |

**Success Response (No MFA)**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "fullName": "John Doe",
    "mfaEnabled": false
  }
}
```

**Success Response (MFA Required)**
```json
{
  "success": true,
  "message": "MFA required. Please verify your identity.",
  "requiresMfa": true,
  "mfaToken": "mfa-temp-token-xyz"
}
```

**Error Response (Account Locked)**
```json
{
  "success": false,
  "message": "Account locked. Please contact support."
}
```

## 2. Financial Core Endpoints

The financial core now ensures **atomic transactions** and enforces **spending limits**.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/money/send` | `POST` | **Enhanced Money Transfer.** Handles peer-to-peer transfers with atomic database transactions and spending limit checks. | JWT | Enhanced |
| `/api/user/wallet` | `GET` | Retrieves the user's current wallet balance. | JWT | Existing |
| `/api/user/transactions` | `GET` | Retrieves the user's transaction history. | JWT | Existing |

## 3. Compliance & KYC Endpoints

The KYC submission process includes automated validation for compliance.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/identity/submit-enhanced` | `POST` | **Enhanced KYC Submission.** Accepts identity documents and performs automated checks (expiry, format, country code). | JWT | Enhanced |

### Request/Response Schemas (Enhanced KYC Submission)

**`POST /api/identity/submit-enhanced`**

| Field | Type | Description |
| :--- | :--- | :--- |
| `documentType` | `string` | Type of document (`passport`, `national_id`, `drivers_license`). |
| `documentNumber` | `string` | The document's unique number. |
| `documentCountry` | `string` | ISO 3166-1 alpha-2 country code (e.g., `ZW`). |
| `documentExpiry` | `string` | Document expiry date (ISO 8601 format). |
| `frontImageUrl` | `string` | URL to the front image of the document. |
| `selfieUrl` | `string` | URL to the user's selfie for liveness check. |

**Success Response**
```json
{
  "success": true,
  "message": "KYC documents submitted and automated checks passed. Verification pending.",
  "verification": {
    "id": "verify-123",
    "status": "pending",
    "automatedChecks": {
      "passed": true,
      "details": "All automated checks passed (expiry, format, country code)."
    }
  }
}
```

**Error Response (Automated Check Failed)**
```json
{
  "success": false,
  "message": "KYC submission failed automated checks.",
  "details": "Document has expired. Please upload a valid document."
}
```

## 4. Exchange Rate Service

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/exchange-rates/current` | `GET` | Retrieves the latest exchange rates for all supported currencies. | None | Existing |
| `/api/exchange-rates/update-enhanced` | `POST` | **Internal/Admin Endpoint.** Triggers a fetch and update of real-time exchange rates from external providers. | Admin JWT | New |

## 5. Mobile Money & Bank Integration Endpoints (Phase 2)

These endpoints facilitate seamless transactions with various mobile money providers and banks.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/mobile-money/topup-enhanced` | `POST` | **Enhanced Top-Up.** Routes top-up requests to the appropriate mobile money provider (EcoCash, TeleCash, OneMoney). | JWT | New |
| `/api/providers/status` | `GET` | Retrieves the status and capabilities of all active payment providers. | None | New |
| `/api/bank/transfer/zipit` | `POST` | Initiates a real-time ZIPIT bank transfer. | JWT | New |
| `/api/bank/transfer/rtgs` | `POST` | Initiates an RTGS bank transfer. | JWT | New |

## 6. Advanced "Pay for your Friend" Endpoints (Phase 2)

These endpoints enable advanced features for the "Pay for your Friend" functionality.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/pay-for-friend/recurring/create` | `POST` | Creates a new recurring payment for a friend or family member. | JWT | New |
| `/api/pay-for-friend/group/create` | `POST` | Initiates a new group payment for shared expenses. | JWT | New |
| `/api/pay-for-friend/request/create` | `POST` | Creates a new payment request to a friend or family member. | JWT | New |

## 7. Paynow Integration Endpoints (Zimbabwe)

These endpoints facilitate payments and top-ups via the Paynow gateway for Zimbabwe.

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/payments/paynow/checkout` | `POST` | Initiates a Paynow checkout flow and returns a payment link. | JWT | New |
| `/api/payments/paynow/status` | `GET` | Polls the status of a Paynow transaction using the poll URL. | JWT | New |
| `/api/mobile-money/paynow-topup` | `POST` | Initiates a wallet top-up via Paynow. | JWT | New |

## 7. Security Enhancements (Phase 2)

| Endpoint | Method | Description | Authentication | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/auth/biometric/register` | `POST` | Registers a new biometric (fingerprint, FaceID) for a user. | JWT | New |
| `/api/auth/biometric/verify` | `POST` | Verifies a user's biometric data for authentication or transaction approval. | None | New |

---
*This document is automatically generated and maintained by the PayPass development team. Last updated: ${new Date().toISOString()}*
