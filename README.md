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
├── USER_MANUAL.md          # End-user Guide
└── PLAN.md                 # Development Roadmap
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** (recommended)
- **Python 3.11+** (for backend services)
- **Node.js 20+** (for frontend apps)
- **PostgreSQL 15+** (for data persistence)
- **Redis 7+** (for auth sessions/OTP)

---

### Option 1: Docker Compose (Recommended) 🐳

The easiest way to run the complete application with database:

```bash
# Clone the repository
git clone https://github.com/your-repo/suvidha2026.git
cd suvidha2026

# Start all services (backend + frontend + PostgreSQL + Redis)
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Access URLs after startup:**

| Service | URL | Description |
|---------|-----|-------------|
| **Kiosk UI** | http://localhost:8080 | Citizen touch interface |
| **Admin Portal** | http://localhost:8081 | Admin dashboard |
| **API Gateway** | http://localhost:3000 | REST API & WebSocket |
| **API Docs** | http://localhost:3000/docs | Swagger documentation |

---

### Option 2: Run Locally (Development)

#### Step 1: Start Infrastructure
```bash
# Start PostgreSQL and Redis using Docker
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
docker-compose logs postgres  # Check for "ready to accept connections"
```

#### Step 2: Install Python Dependencies
```bash
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install all backend dependencies
pip install fastapi uvicorn pydantic-settings pyjwt redis python-socketio httpx sqlalchemy[asyncio] asyncpg
```

#### Step 3: Start Backend Services (4 terminals)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
set DATABASE_URL=postgresql+asyncpg://suvidha:suvidha_secure_2026@localhost:5432/suvidha_db
uvicorn app.main:app --port 3001 --reload
```

**Terminal 2 - Billing Service:**
```bash
cd services/billing-service
set DATABASE_URL=postgresql+asyncpg://suvidha:suvidha_secure_2026@localhost:5432/suvidha_db
uvicorn app.main:app --port 3002 --reload
```

**Terminal 3 - Grievance Service:**
```bash
cd services/grievance-service
set DATABASE_URL=postgresql+asyncpg://suvidha:suvidha_secure_2026@localhost:5432/suvidha_db
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

### 🖥️ Kiosk UI
- **OTP Authentication** - Phone number login with simulated OTP
- **Utility Bill Viewing** - List bills by utility type with status indicators
- **Payment Flow** - Select payment method → Process → Receipt generation
- **Receipt Download** - PDF receipt generation for paid bills (jsPDF)
- **Grievance Filing** - Multi-step form with category selection
- **Complaint Tracking** - Look up status by ticket number
- **Service Requests** - New connections, address changes, bulk waste pickup
- **Emergency Ticker** - Real-time alerts fetched from API
- **Biometric Auth** - Fingerprint simulation with scanning animation
- **Multilingual** - English/Hindi toggle (i18next)
- **Accessibility** - Skip links, ARIA labels, WCAG-compliant touch targets

### 🎛️ Admin Portal
- **Dashboard** - Statistics overview, grievance summary, activity feed
- **Grievance Management** - Searchable table with filters
- **Transaction History** - Payment records with export option

### ⚙️ Backend Services (FastAPI + Python + PostgreSQL)
- **Auth Service** - OTP generation, JWT tokens, **PostgreSQL user persistence**
- **Billing Service** - **Database-backed bills**, transactional payments, receipts
- **Grievance Service** - **Persistent complaints**, service requests, ticket tracking
- **API Gateway** - Request routing, WebSocket notifications, rate limiting, **alerts endpoint**

### 💾 Database Integration (NEW)
- **SQLAlchemy ORM** with async support (asyncpg)
- **PostgreSQL schemas**: `auth`, `billing`, `grievance`
- **Data persistence** across container restarts
- **Transactional payments** with proper rollback

---

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **OTP Rate Limiting** (5 attempts → 15-min lockout)
- **Input Validation** with XSS sanitization
- **PostgreSQL** with parameterized queries (SQL injection prevention)
- **Error Boundaries** for graceful failure handling
- **WCAG 2.1 AA** accessibility compliance

---

## 📱 Testing the Complete Flow

### 1. Login with OTP
```
Enter any 10-digit phone number → Click "Send OTP" → Check console for OTP → Verify
```

### 2. Pay a Bill
```
Select utility → "Pay Bill" → Select bill → "Pay Now" → Choose method → Complete → Download Receipt
```

### 3. File a Grievance
```
Select utility → "File Grievance" → Follow steps → Get ticket number
```

### 4. Request New Connection
```
Login → Click "New Connection" on Dashboard → Select type → Fill form → Submit
```

### 5. Track Complaint
```
Click "Track Grievance" → Enter ticket number (e.g., GRV-260112-1234)
```

### 6. View Emergency Alerts
```
Alerts scroll automatically at the bottom ticker (fetched from /api/v1/alerts)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Zustand, TailwindCSS |
| Backend | FastAPI, Python 3.11, Pydantic, SQLAlchemy |
| Database | PostgreSQL 15, asyncpg |
| Real-time | python-socketio, Socket.IO client |
| Auth | PyJWT, Redis, bcrypt |
| PDF | jsPDF (client-side receipt generation) |
| Infrastructure | Docker, Docker Compose |

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
| 9. **Database Integration** | ✅ Complete |
| 10. **Service Requests** | ✅ Complete |
| 11. **Alert Ticker** | ✅ Complete |
| 12. **Receipt Download** | ✅ Complete |
| 13. **User Manual** | ✅ Complete |

See [PLAN.md](./PLAN.md) for detailed roadmap.
See [USER_MANUAL.md](./USER_MANUAL.md) for end-user guides.

---

## 🗂️ API Endpoints

### Auth Service (port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/send-otp` | Send OTP to phone |
| POST | `/auth/verify-otp` | Verify OTP & get tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

### Billing Service (port 3002)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bills` | List user's bills |
| GET | `/bills/{id}` | Get bill details |
| POST | `/payments` | Process payment |
| GET | `/payments/{id}/receipt` | Get payment receipt |

### Grievance Service (port 3003)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/complaints` | File new complaint |
| GET | `/complaints` | List user's complaints |
| GET | `/complaints/{ticket}` | Track complaint |
| POST | `/service-requests` | Submit service request |
| GET | `/service-requests` | List service requests |

### API Gateway (port 3000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/alerts` | Get emergency alerts |
| GET | `/health` | Service health check |
| WS | `/socket.io` | Real-time notifications |

---

## 📄 License

Developed for C-DAC SUVIDHA Hackathon Challenge 2026.

