# PayPass Scan & Go

A comprehensive payment platform supporting multiple user types with QR-based transactions, mobile money integration, and real-time analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) Upstash Redis for rate limiting
- (Optional) Neon Database for persistent storage

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd paypass-builder
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Development**
```bash
# Start both client (Vite) and API (Next.js) servers
npm run dev

# Or run separately:
npm run client:dev  # Vite dev server on :5173
npm run api:dev     # Next.js API on :3000
```

4. **Production Build**
```bash
npm run build
npm start
```

## 🔧 Environment Variables

### Required
- `JWT_SECRET` - Secret key for JWT tokens

### Optional (for enhanced features)
- `UPSTASH_REDIS_REST_URL` - Redis URL for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis token
- `DATABASE_URL` - Neon/PostgreSQL connection string

## 👥 User Types & Access

| User Type | Login Route | Dashboard | Purpose |
|-----------|-------------|-----------|---------|
| Regular Users | `/login` | `/dashboard` | Payments, transfers, bill payments |
| Bus/Taxi Operators | `/operator-login` | `/operator` | Fare collection, route management |
| Merchants/Retailers | `/merchant-login` | `/merchant` | Payment collection, business analytics |
| Mobile Money/Bank Partners | `/partner-login` | `/partner` | Integration monitoring, API management |
| Platform Admins | `/admin-login` | `/admin` | System oversight, user management |

## 🧪 Testing

### Demo Credentials

**Regular Users:**
- Phone: `+263711111111` | PIN: `1234`
- Phone: `+263722222222` | PIN: `1234`

**Operators:**
- Phone: `+263733333333` | PIN: `1234`
- Phone: `+263744444444` | PIN: `1234`

**Merchants:**
- Phone: `+263755555555` | PIN: `1234`
- Phone: `+263766666666` | PIN: `1234`

**Partners:**
- Phone: `+263777777777` | PIN: `1234`
- Phone: `+263788888888` | PIN: `1234`

**Admins:**
- Phone: `+263799999999` | PIN: `1234`
- Phone: `+263700000000` | PIN: `1234`

### Health Checks

- **API Health**: `GET /api/health`
- **Redis Status**: `GET /api/redis/verify`
- **Database**: `GET /api/conductor/verify`

## 🏗️ Architecture

### Frontend (Vite + React)
- **Location**: `client/`
- **Router**: Wouter
- **UI**: Tailwind CSS + Shadcn UI
- **State**: React Context + Custom Hooks
- **Build**: Vite

### Backend (Next.js API Routes)
- **Location**: `app/api/`
- **Auth**: JWT + bcrypt
- **Storage**: In-memory (dev) / Neon PostgreSQL (prod)
- **Rate Limiting**: Upstash Redis
- **Validation**: Zod

### Integrations
- **Mobile Money**: EcoCash, TeleCash, OneMoney
- **Banks**: CBZ Bank, other Zimbabwean banks
- **QR Codes**: JSON-based payment data
- **Analytics**: Recharts for dashboards

## 🔒 Security Features

- JWT-based authentication
- Rate limiting on auth endpoints
- Password hashing with bcrypt
- Secure HTTP-only cookies
- Phone number normalization
- Input validation with Zod

## 📊 Features

### User Dashboard
- QR payments
- Money transfers
- Bill payments
- Transaction history
- Profile management

### Operator Dashboard
- QR generation
- Fare collection
- Route management
- Revenue tracking

### Merchant Dashboard
- Payment collection
- Business analytics
- Customer management
- QR generator
- Settings

### Partner Dashboard
- Integration monitoring
- Transaction analytics
- API management
- Performance metrics

### Admin Dashboard
- System monitoring
- User management
- Platform analytics
- Configuration

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm start
```

## 📝 Development

### Adding New User Types
1. Update `app/api/_lib/storage/storage-memory.ts`
2. Create API routes in `app/api/auth/[type]/`
3. Add frontend pages in `client/src/pages/`
4. Update routing in `client/src/App.tsx`

### Database Migrations
```bash
npm run db:migrate
npm run db:push
npm run db:studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
