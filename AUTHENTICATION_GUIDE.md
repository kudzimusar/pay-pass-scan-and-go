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
- **Dashboard**: `/merchant`
- **Features**: Payment collection, business analytics, customer management, QR code generation

### 4. Mobile Money/Bank Partners
- **Purpose**: Mobile money providers, banks, and fintech partners for integration monitoring
- **Access Route**: `/partner-login`
- **Dashboard**: `/partner`
- **Features**: Integration monitoring, transaction analytics, API management, webhook configuration

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

### Authentication Endpoints (Enhanced)

#### Regular Users
- **Login (PIN/Password)**: `POST /api/auth/login` (Legacy)
- **Login (Enhanced)**: `POST /api/auth/login-enhanced` (Recommended)
- **MFA Verification**: `POST /api/auth/mfa/verify-login` (Used after Enhanced Login if MFA is enabled)
- **Register**: `POST /api/auth/register`

#### Operators (Legacy)
- **Login**: `POST /api/auth/operator/login`
- **Register**: `POST /api/auth/operator/register`

#### Merchants (Legacy)
- **Login**: `POST /api/auth/merchant/login`
- **Register**: `POST /api/auth/merchant/register`

#### Partners (Legacy)
- **Login**: `POST /api/auth/partner/login`
- **Register**: `POST /api/auth/partner/register`

#### Admins (Legacy)
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

## Merchant Dashboard Features

The merchant dashboard provides comprehensive tools for businesses, utilities, and service providers:

### Overview Tab
- **Key Metrics**: Today's revenue, total revenue, transaction count, active customers
- **Payment Methods Breakdown**: QR payments, card payments, mobile money usage
- **Recent Transactions**: Latest payment activities with status indicators
- **Quick Actions**: Generate QR codes, download reports, add products

### Payments Tab
- **Transaction Management**: Complete list of all transactions with search and filtering
- **Payment Details**: Customer information, amounts, payment methods, status
- **Export Functionality**: Download transaction reports in various formats
- **Status Tracking**: Monitor pending, completed, and failed payments

### Customers Tab
- **Customer Analytics**: Total customers, active customers, average customer value
- **Top Customers**: List of highest-spending customers with visit counts
- **Customer Profiles**: Individual customer details and transaction history
- **Customer Status**: Track active and inactive customer segments

### Analytics Tab
- **Revenue Analytics**: Visual charts showing revenue trends over time
- **Payment Method Trends**: Distribution of payment methods used
- **Customer Growth**: Customer acquisition and retention metrics
- **Business Insights**: Data-driven insights for business optimization

### QR Generator Tab
- **Dynamic QR Codes**: Generate payment QR codes for any amount
- **Custom Descriptions**: Add payment descriptions for better tracking
- **Download Options**: Download QR codes as images for printing
- **QR Data Export**: Copy QR code data for integration purposes

### Settings Tab
- **Business Profile**: Update business name, type, contact information
- **Account Management**: Manage merchant account settings
- **Security Settings**: Update PIN and security preferences
- **Integration Settings**: Configure payment integrations

### Key Benefits
- **Real-time Monitoring**: Live updates of payment activities
- **Customer Insights**: Detailed customer behavior analytics
- **Payment Flexibility**: Support for multiple payment methods
- **Business Growth**: Tools to optimize revenue and customer retention

## Partner Dashboard Features

The partner dashboard provides comprehensive tools for mobile money providers, banks, and fintech partners:

### Overview Tab
- **Key Metrics**: Total transactions, success rate, average response time, uptime
- **System Health**: Real-time monitoring of API gateway, database, and services
- **Recent Activity**: Latest transaction activities with status indicators
- **Integration Key**: Secure access to API authentication credentials

### Transactions Tab
- **Transaction Log**: Complete list of all processed transactions
- **Advanced Search**: Search transactions by ID, amount, method, or status
- **Status Tracking**: Monitor completed, pending, processing, and failed transactions
- **Performance Metrics**: Response times and processing durations
- **Export Functionality**: Download transaction reports for analysis

### API Monitoring Tab
- **Endpoint Health**: Real-time status of all API endpoints
- **Performance Metrics**: Response times and success rates for each endpoint
- **Active Endpoints**: Count of healthy vs problematic endpoints
- **Endpoint Details**: URL, method, description, and last test time
- **Testing Tools**: Built-in endpoint testing functionality

### Analytics Tab
- **Transaction Analytics**: Visual charts showing transaction volume trends
- **API Performance**: Response time trends and performance metrics
- **Error Rate Trends**: Monitoring of API failures and error patterns
- **Business Insights**: Data-driven insights for optimization

### Integrations Tab
- **API Documentation**: Complete integration guide and examples
- **Base URL Management**: API endpoint configuration
- **Authentication Setup**: Integration key management
- **Webhook Configuration**: Set up webhook URLs and event subscriptions
- **Code Examples**: Ready-to-use code snippets for integration

### Settings Tab
- **Partner Profile**: Update company name, type, contact information
- **Security Settings**: PIN management and security preferences
- **Account Management**: Partner account configuration
- **Integration Settings**: API and webhook configuration

### Key Benefits
- **Real-time Monitoring**: Live updates of API health and transaction status
- **Performance Analytics**: Detailed metrics for optimization
- **Integration Support**: Complete documentation and tools
- **Webhook Management**: Automated event notifications
- **Security**: Secure API key management and authentication