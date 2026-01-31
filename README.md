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
│   └── api-gateway/        # FastAPI API Gateway (port 3000)
├── services/
│   ├── auth-service/       # FastAPI OTP Authentication (port 3001)
│   ├── billing-service/    # FastAPI Bill Management (port 3002)
│   └── grievance-service/  # FastAPI Complaint Tracking (port 3003)
├── packages/
│   └── types/              # Shared TypeScript Definitions
├── infrastructure/
│   └── scripts/            # Database Init Scripts
└── PLAN.md                 # Development Roadmap
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** (for backend services)
- **Node.js 20+** (for frontend apps)
- **Redis** (for auth sessions/OTP)
- **Docker** (optional, but recommended)

---

### Option 1: Docker Compose (Recommended)

The easiest way to run the complete application:

```bash
# Start all services (backend + frontend + Redis + PostgreSQL)
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

**Access URLs after startup:**
| Service | URL |
|---------|-----|
| Kiosk UI | http://localhost:8080 |
| Admin Portal | http://localhost:8081 |
| API Gateway | http://localhost:3000 |

---

### Option 2: Run Locally (Development)

#### Step 1: Start Redis
```bash
# Using Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Or install Redis locally and run
redis-server
```

#### Step 2: Install Python Dependencies
```bash
# Install all backend dependencies
pip install fastapi uvicorn pydantic-settings pyjwt redis python-socketio httpx
```

#### Step 3: Start Backend Services (4 terminals)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
uvicorn app.main:app --port 3001 --reload
```

**Terminal 2 - Billing Service:**
```bash
cd services/billing-service
uvicorn app.main:app --port 3002 --reload
```

**Terminal 3 - Grievance Service:**
```bash
cd services/grievance-service
uvicorn app.main:app --port 3003 --reload
```

**Terminal 4 - API Gateway:**
```bash
cd apps/api-gateway
uvicorn app.main:socket_app --port 3000 --reload
```

#### Step 4: Start Frontend Apps (2 terminals)

**Terminal 5 - Kiosk UI:**
```bash
cd apps/kiosk-ui
npm install
npm run dev
```

**Terminal 6 - Admin Portal:**
```bash
cd apps/admin-portal
npm install
npm run dev
```

---

### Access URLs (Development)

| Service | URL | Description |
|---------|-----|-------------|
| Kiosk UI | http://localhost:5173 | Touch-optimized citizen interface |
| Admin Portal | http://localhost:5174 | Dashboard for administrators |
| API Gateway | http://localhost:3000 | Centralized API entry point |
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

### Backend Services (FastAPI + Python)
- **Auth Service** - OTP generation, JWT tokens, Redis session storage
- **Billing Service** - Mock bills, payment processing, receipts
- **Grievance Service** - Complaint filing, ticket tracking, status updates
- **API Gateway** - Request routing, WebSocket notifications, rate limiting

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

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Zustand |
| Backend | FastAPI, Python 3.11, Pydantic |
| Real-time | python-socketio, Socket.IO client |
| Auth | PyJWT, Redis |
| Infrastructure | Docker, PostgreSQL, Redis |

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
| 8. FastAPI Migration | ✅ Complete |
| 9. Testing & QA | Pending |
| 10. Production Deploy | Pending |

See [PLAN.md](./PLAN.md) for detailed roadmap.

---

## 📄 License

Developed for C-DAC SUVIDHA Hackathon Challenge 2026.
