# Overview

PayPass is a digital payments platform designed for mobile money transactions in Zimbabwe. The application provides a mobile-first QR code payment system that enables users to pay for bus transportation and other services by scanning QR codes. The platform supports dual currency operations (USD and ZWL) and integrates with existing mobile money providers and remittance services.

The system consists of a React-based frontend with Express.js backend, featuring user wallet management, QR code scanning for payments, transaction history, and operator dashboards for business management. The application is designed to replace cash transactions in public transportation and retail environments.

# User Preferences

Preferred communication style: Simple, everyday language.

# Demo Environment Setup

## Test User Account
- **Phone**: +263772160634 (supports all formats: 772160634, 0772160634, 263772160634)
- **PIN**: 1234
- **Email**: test@example.com
- **Wallet**: $50.00 USD, 80,000 ZWL
- **Access**: Standard user dashboard with full payment functionality

## Operator Accounts (Business Dashboards)

### City Bus Lines
- **Phone**: +263712345678 
- **PIN**: 1234
- **Email**: admin@citybuslines.co.zw
- **Routes**: Harare CBD - Chitungwiza ($1.50/2500 ZWL), Harare CBD - Budiriro ($1.00/1800 ZWL)
- **Access**: `/operator-login` → `/operator` dashboard

### ZUPCO Transport
- **Phone**: +263775432109
- **PIN**: 5678
- **Email**: ops@zupco.co.zw
- **Routes**: Harare - Bulawayo Intercity ($15.00/25000 ZWL)
- **Access**: `/operator-login` → `/operator` dashboard

### Harare Kombis
- **Phone**: +263787654321
- **PIN**: 9876
- **Email**: manager@harerekombis.co.zw
- **Routes**: Copacabana - CBD ($0.75/1200 ZWL)
- **Access**: `/operator-login` → `/operator` dashboard

## Admin Dashboard
- **URL**: `/admin`
- **Purpose**: Platform administration, user management, system monitoring
- **Features**: Transaction analytics, operator management, fraud detection

## Access Paths for Stakeholders

1. **Bus/Taxi Operators**: `/operator-login` → Login with operator credentials → Full dashboard with route management, QR generation, revenue tracking
2. **Merchant Partners**: Can use operator login system for business account access
3. **Platform Administrators**: Direct access to `/admin` for system oversight
4. **Mobile Money Providers**: Partner integration status viewable in admin dashboard

## Sample Transaction Data
- Multiple completed bus fare payments across all operators
- Top-up transactions via EcoCash and TeleCash
- Real-time transaction history and analytics
- QR code payment flows with route validation

# System Architecture

## Frontend Architecture
The client is built using React with TypeScript, utilizing Vite as the build tool and development server. The UI framework leverages shadcn/ui components built on top of Radix UI primitives, providing a consistent design system with Tailwind CSS for styling. The application uses Wouter for client-side routing and TanStack Query for server state management and data fetching.

The frontend implements a mobile-first responsive design with dedicated pages for user authentication, wallet management, QR scanning, payment confirmation, transaction history, and operator dashboards. The authentication system supports both regular users and business operators with separate login flows and interfaces.

## Backend Architecture
The server is built on Express.js with TypeScript, implementing a RESTful API structure. The backend handles user authentication using JWT tokens with bcrypt for password hashing, wallet operations including balance management and top-ups, QR code generation and validation for routes, and transaction processing with detailed logging.

The API provides separate endpoints for user operations, operator functions, and authentication flows, with middleware for token verification and request logging.

## Database Design
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema includes five main entities: users for individual account holders, operators for business accounts, wallets for managing USD and ZWL balances, routes for transportation services with QR codes, and transactions for payment history and audit trails.

The database uses UUID primary keys and maintains proper foreign key relationships between entities, with timestamp tracking for all records.

## Authentication System
Authentication is implemented using JWT tokens stored in localStorage, supporting both user and operator account types with separate registration and login flows. The system includes PIN-based authentication with optional biometric support flags and session management with automatic token verification.

## State Management
The frontend uses TanStack Query for server state management, providing automatic caching, refetching, and error handling. Local state is managed through React hooks with a custom authentication context providing global access to user session data.

# External Dependencies

## Database Infrastructure
- PostgreSQL database hosted via Neon Database serverless platform
- Drizzle ORM for database operations and migrations
- Connection pooling through @neondatabase/serverless

## UI Framework
- Radix UI component primitives for accessible UI elements
- Tailwind CSS for utility-first styling
- shadcn/ui component library for consistent design system
- Lucide React for iconography

## Development Tools
- Vite for frontend build tooling and hot module replacement
- TypeScript for type safety across the stack
- React Hook Form with Zod for form validation
- ESBuild for server-side bundling

## Authentication & Security
- JWT for session management
- bcryptjs for password hashing
- Zod for runtime type validation and schema definition

## Potential Integrations
The application is architected to support integration with:
- Mobile money providers (EcoCash, TeleCash)
- International remittance services (Mukuru)
- QR code generation libraries for dynamic route codes
- Biometric authentication APIs for enhanced security
- Push notification services for transaction alerts
- SMS services for OTP verification
