# SUVIDHA 2026

**Smart Urban Virtual Interactive Digital Helpdesk Assistant**

A touch-based, multilingual Self-Service Kiosk interface for civic utility offices (Electricity, Gas, Water, Municipal). Built for the C-DAC SUVIDHA Hackathon Challenge.

---

## 🏗️ Project Structure

```
suvidha2026/
├── apps/
│   ├── kiosk-ui/           # React Touch Kiosk Interface (port 5173)
│   ├── admin-portal/       # React Admin Dashboard (port 5174)
│   └── api-gateway/        # Node.js/Express API Gateway (port 3000)
├── services/
│   ├── auth-service/       # OTP Authentication (port 3001)
│   ├── billing-service/    # Bill Management (port 3002)
│   └── grievance-service/  # Complaint Tracking (port 3003)
├── packages/
│   └── types/              # Shared TypeScript Definitions
├── infrastructure/
│   └── scripts/            # Database Init Scripts
└── PLAN.md                 # Development Roadmap
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Development Setup

```powershell
# 1. Install dependencies for each service
cd apps/kiosk-ui && npm install && cd ../..
cd apps/admin-portal && npm install && cd ../..
cd services/auth-service && npm install && cd ../..
cd services/billing-service && npm install && cd ../..
cd services/grievance-service && npm install && cd ../..

# 2. Start backend services (each in separate terminal)
cd services/auth-service && npm run dev      # Port 3001
cd services/billing-service && npm run dev   # Port 3002
cd services/grievance-service && npm run dev # Port 3003

# 3. Start Kiosk UI
cd apps/kiosk-ui && npm run dev              # Port 5173

# 4. Start Admin Portal
cd apps/admin-portal && npm run dev          # Port 5174
```

### Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| Kiosk UI | http://localhost:5173 | Touch-optimized citizen interface |
| Admin Portal | http://localhost:5174 | Dashboard for administrators |
| Auth Service | http://localhost:3001 | OTP/JWT authentication |
| Billing Service | http://localhost:3002 | Bill management & payments |
| Grievance Service | http://localhost:3003 | Complaint tracking |

---

## ✅ Implemented Features

### Kiosk UI
- **OTP Authentication** - Phone number login with simulated OTP
- **Utility Bill Viewing** - List bills by utility type with status indicators
- **Payment Flow** - Select payment method → Process → Receipt generation
- **Grievance Filing** - Multi-step form with category selection
- **Complaint Tracking** - Look up status by ticket number
- **Multilingual** - English/Hindi toggle (i18next)
- **Accessibility** - Skip links, ARIA labels, WCAG-compliant touch targets

### Admin Portal
- **Dashboard** - Statistics overview, grievance summary, activity feed
- **Grievance Management** - Searchable table with filters
- **Transaction History** - Payment records with export option

### Backend Services
- **Auth Service** - OTP generation, JWT tokens, Redis session storage
- **Billing Service** - Mock bills, payment processing, receipts
- **Grievance Service** - Complaint filing, ticket tracking, status updates

---

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **OTP Rate Limiting** (5 attempts → 15-min lockout)
- **Input Validation** with XSS sanitization
- **Error Boundaries** for graceful failure handling
- **WCAG 2.1 AA** accessibility compliance

---

## 📱 Testing the Flow

1. **Login**: Enter any 10-digit phone number → Click "Send OTP" → Copy OTP from console → Verify
2. **Pay Bill**: Select utility → "Pay Bill" → Select a bill → "Pay Now" → Choose method → Complete
3. **File Grievance**: Select utility → "File Grievance" → Follow steps → Get ticket number
4. **Track Complaint**: Use ticket `GRV-260112-1234` to see sample status

---

## 📋 Development Status

| Phase | Status |
|-------|--------|
| 1. Scaffolding | ✅ Complete |
| 2. Authentication | ✅ Complete |
| 3. Billing Module | ✅ Complete |
| 4. Grievance System | ✅ Complete |
| 5. Multilingual | ✅ Complete |
| 6. Admin Dashboard | ✅ Complete |
| 7. Security & Accessibility | ✅ Complete |
| 8. Testing & QA | Pending |
| 9. Production Deploy | Pending |

See [PLAN.md](./PLAN.md) for detailed roadmap.

---

## 📄 License

Developed for C-DAC SUVIDHA Hackathon Challenge 2026.
