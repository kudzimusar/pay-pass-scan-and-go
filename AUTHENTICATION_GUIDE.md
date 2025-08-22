# PayPass Authentication Guide

## Overview

PayPass is a unified payment platform that serves multiple stakeholder types with tailored authentication and dashboard experiences. This guide provides comprehensive information about all user types, their access routes, and demo credentials.

## User Types & Access Routes

### 1. Regular Users (Individual Customers)
- **Purpose**: Individual customers for payments, transfers, and bill payments
- **Access Route**: `/login`
- **Dashboard**: `/dashboard`
- **Features**: QR payments, money transfers, bill payments, transaction history

### 2. Bus/Taxi Operators
- **Purpose**: Transport operators for fare collection and route management
- **Access Route**: `/operator-login`
- **Dashboard**: `/operator`
- **Features**: QR generation, fare collection, route management, revenue tracking

### 3. Retailers/Merchants/Utilities
- **Purpose**: Businesses, utilities, and service providers for payment collection
- **Access Route**: `/merchant-login`
- **Dashboard**: `/merchant` (to be implemented)
- **Features**: Payment collection, business analytics, customer management

### 4. Mobile Money/Bank Partners
- **Purpose**: Mobile money providers, banks, and fintech partners for integration monitoring
- **Access Route**: `/partner-login`
- **Dashboard**: `/partner` (to be implemented)
- **Features**: Integration monitoring, transaction analytics, API management

### 5. Platform Administrators
- **Purpose**: System administrators for platform oversight and management
- **Access Route**: `/admin-login`
- **Dashboard**: `/admin`
- **Features**: System monitoring, user management, platform analytics

## Demo Credentials

### Regular Users
All regular users use PIN: `1234`

| Name | Phone Number | Email |
|------|-------------|-------|
| John Doe | +263771234567 | john@example.com |
| Sarah Wilson | +263772345678 | sarah@example.com |
| Mike Johnson | +263773456789 | mike@example.com |
| Emma Davis | +263774567890 | emma@example.com |
| David Brown | +263775678901 | david@example.com |

### Bus/Taxi Operators
All operators use PIN: `1234`

| Company | Phone Number | Email | License |
|---------|-------------|-------|---------|
| City Bus Lines | +263712345678 | info@citybus.co.zw | OP001 |
| ZUPCO Transport | +263775432109 | admin@zupco.co.zw | OP002 |
| Harare Kombis | +263787654321 | contact@hararekombis.co.zw | OP003 |
| Metro Peach | +263796543210 | support@metropeach.co.zw | OP004 |

### Retailers/Merchants/Utilities
All merchants use PIN: `1234`

| Business | Phone Number | Email | Type | License |
|----------|-------------|-------|------|---------|
| Pick n Pay Harare | +263711111111 | harare@pnp.co.zw | Retailer | RET001 |
| ZESA Harare | +263722222222 | harare@zesa.co.zw | Utility | UTL001 |
| City of Harare | +263733333333 | payments@hararecity.co.zw | Service Provider | GOV001 |

### Mobile Money/Bank Partners
All partners use PIN: `1234`

| Company | Phone Number | Email | Type | Integration Key |
|---------|-------------|-------|------|-----------------|
| EcoCash | +263744444444 | integration@ecocash.co.zw | Mobile Money | ecocash_prod_2024 |
| CBZ Bank | +263755555555 | payments@cbz.co.zw | Bank | cbz_bank_prod_2024 |
| OneMoney | +263766666666 | api@onemoney.co.zw | Mobile Money | onemoney_prod_2024 |

### Platform Administrators
All admins use PIN: `1234`

| Name | Phone Number | Email | Role | Permissions |
|------|-------------|-------|------|-------------|
| System Administrator | +263700000001 | admin@paypass.co.zw | Super Admin | All |
| Platform Manager | +263700000002 | manager@paypass.co.zw | Platform Admin | Users, Operators, Transactions, Reports |

## API Endpoints

### Authentication Endpoints

#### Regular Users
- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`

#### Operators
- **Login**: `POST /api/auth/operator/login`
- **Register**: `POST /api/auth/operator/register`

#### Merchants
- **Login**: `POST /api/auth/merchant/login`
- **Register**: `POST /api/auth/merchant/register`

#### Partners
- **Login**: `POST /api/auth/partner/login`
- **Register**: `POST /api/auth/partner/register`

#### Admins
- **Login**: `POST /api/auth/admin/login`
- **Register**: `POST /api/auth/admin/register`

## Quick Access Links

### Main Landing Page
- **URL**: `/` - Comprehensive landing page with all user type options

### Direct Login Links
- Regular Users: `/login`
- Bus/Taxi Operators: `/operator-login`
- Retailers/Merchants: `/merchant-login`
- Partners: `/partner-login`
- Admins: `/admin-login`

### Registration
- New User Registration: `/signup`

## Security Features

### Rate Limiting
All authentication endpoints implement rate limiting:
- Phone-based: 5 attempts per hour
- IP-based: 20 attempts per hour

### Password Security
- All PINs are hashed using bcrypt with salt rounds of 10-12
- PIN requirements: 4-12 characters

### JWT Tokens
- Tokens include user type and ID for proper authorization
- Token expiration: 7 days
- Secure cookie storage with httpOnly flag

## User Experience Features

### Phone Number Normalization
The system automatically normalizes phone numbers to international format:
- Local format (0771234567) → +263771234567
- National format (771234567) → +263771234567
- International format (+263771234567) → +263771234567

### Demo Account Visibility
All login pages include visible demo credentials for easy testing and demonstration purposes.

### Responsive Design
All authentication pages are fully responsive and optimized for mobile devices.

## Testing Instructions

1. **Start with the landing page** (`/`) to see all available options
2. **Choose your user type** and click the appropriate login button
3. **Use the demo credentials** provided on each login page
4. **Test the authentication flow** by logging in with different user types
5. **Verify dashboard access** for each user type

## Troubleshooting

### Common Issues
1. **Invalid credentials**: Ensure you're using the correct demo credentials
2. **Phone format**: The system accepts various phone formats and normalizes them
3. **Rate limiting**: Wait 1 hour if you've exceeded login attempts
4. **Network issues**: Check your internet connection and API endpoint availability

### Support
For technical support or questions about the authentication system, please refer to the main project documentation or contact the development team.