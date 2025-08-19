# PayPass Builder

A comprehensive digital payment platform built with Next.js, featuring multi-stakeholder support for users, operators, merchants, admins, and partners.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Caching**: Upstash Redis
- **Authentication**: JWT with bcryptjs
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **Validation**: Zod schemas

## 🛠 Features

### Core Payment System
- **Scan & Go**: Universal QR code scanner for buses, taxis, and retail
- **Multi-Currency**: USD and ZWL wallet support
- **Request-to-Pay**: Send and receive payment requests
- **Real-time Notifications**: Instant payment confirmations

### Stakeholder Dashboards
- **Users**: Mobile-first wallet and payment interface
- **Operators**: Bus route and fare management
- **Merchants**: Point-of-sale and inventory tracking
- **Admins**: System oversight and analytics
- **Partners**: API integration and revenue sharing

### Advanced Features
- **Dynamic Routing**: Distance-based fare calculation
- **Conductor App**: Route verification and ticket validation
- **Enhanced QR Scanning**: Multi-format QR code support
- **Payment Confirmation**: Multi-step payment verification

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account
- Upstash Redis account

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd paypass-builder

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Add your DATABASE_URL and Redis credentials

# Database initialization
npm run neon:init

# Start development server
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 📱 Demo Credentials

Access demo accounts at `/demo-credentials`:

- **User**: +263772222222 (PIN: 1234)
- **Operator**: +263771111111 (PIN: 1234)  
- **Merchant**: +263773333333 (PIN: 1234)
- **Admin**: +263774444444 (PIN: 1234)
- **Partner**: +263775555555 (PIN: 1234)

## 🔧 Development

\`\`\`bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Database operations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio

# Initialize Neon database
npm run neon:init
\`\`\`

## 🏗 Architecture

### API Routes
- `/api/auth/*` - Authentication endpoints
- `/api/user/*` - User operations
- `/api/operator/*` - Operator management
- `/api/qr/*` - QR code scanning
- `/api/payment/*` - Payment processing
- `/api/requests/*` - Request-to-Pay system

### Database Schema
- **users** - Customer accounts
- **operators** - Transport operators  
- **merchants** - Business accounts
- **admins** - System administrators
- **partners** - Integration partners
- **routes** - Transport routes
- **transactions** - Payment history
- **payment_requests** - Request-to-Pay system
- **notifications** - Real-time alerts

### Storage Strategy
- **Production**: Neon PostgreSQL for scalability
- **Development**: In-memory storage for rapid iteration
- **Automatic fallback** based on DATABASE_URL presence

## 🚀 Deployment

### Vercel (Recommended)
\`\`\`bash
# Deploy to Vercel
vercel --prod

# Environment variables needed:
# - DATABASE_URL (Neon)
# - UPSTASH_REDIS_REST_URL 
# - UPSTASH_REDIS_REST_TOKEN
# - JWT_SECRET
\`\`\`

### Manual Deployment
\`\`\`bash
npm run build
npm run start
\`\`\`

## 📊 Monitoring

- Health check: `/api/health`
- Redis verification: `/redis-verify` 
- Database status included in health endpoint

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.
