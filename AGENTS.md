# AGENTS.md - Project Context & Rules
**Project:** SUVIDHA (Smart Urban Virtual Interactive Digital Helpdesk Assistant) - 2026
**Hackathon:** C-DAC SUVIDHA Challenge
**Role:** Senior Full-Stack Architect & Developer

## 1. Core Mission
Build a touch-based, multilingual Self-Service Kiosk interface for civic utility offices (Electricity, Gas, Water, Municipal). The system must be accessible, secure, and microservice-based.

## 2. Tech Stack (Strict Constraints)
* **Frontend:** React.js (v19+) with TypeScript. Use a responsive framework (Tailwind CSS preferred) optimized for **Touch/Kiosk** interfaces.
* **Backend:** Node.js (Express/NestJS) OR Python (FastAPI). Use **Microservices Architecture**.
* **Database:** PostgreSQL (User Data/Logs) & Redis (Caching).
* **Auth:** OAuth2 / JWT (Stateless authentication).
* **Containerization:** Docker & Docker Compose (Required for deliverables).
* **Real-time:** Socket.io for live notifications.
* **Hardware Simulation:** react-webcam for document scanning, jsPDF for receipt printing.

## 3. Architecture Rules
* **Microservices:** The backend MUST be split into independent services (e.g., `auth-service`, `billing-service`, `grievance-service`) communicating via REST or gRPC.
* **API Gateway:** Implement a centralized API Gateway to route requests from the Kiosk UI to backend services.
* **Loose Coupling:** Services must not share databases. Each service owns its data.
* **Real-time Gateway:** Socket.io server integrated in API Gateway for notification broadcasting.

## 4. Key Features to Build
1.  **Unified Dashboard:** Single interface for Electricity, Gas, and Water services.
2.  **Authentication:** Secure login for citizens (OTP/Biometric simulation).
3.  **Bill Payment:** Fetch bills, view history, and simulate payment processing.
4.  **Grievance Redressal:** Log complaints and track status.
5.  **Multilingual Support:** UI must support dynamic language switching (English/Hindi/Regional).
6.  **Admin Panel:** Separate web portal for office staff to monitor Kiosk usage and view analytics.

## 5. Smart Features (Hackathon Differentiators)

### 5.1 Voice Assistant
* **Component:** `VoiceAssistant.tsx` - Floating button with expandable chat interface
* **Tech:** Web Speech API for voice recognition
* **Commands:** "electricity", "water", "gas", "bill", "pay", "complaint", "grievance"
* **Fallback:** Text-based chat input for browsers without speech support

### 5.2 Real-time Notifications
* **Backend:** Socket.io integrated in API Gateway (`/admin/broadcast` endpoint)
* **Frontend:** `NewsTicker.tsx` marquee at bottom of screen, `notificationStore.ts` for state
* **Use Case:** Push alerts like "Heavy Rain Alert: Power Cuts Expected" to all connected kiosks

### 5.3 Hardware Simulation
* **Document Scanner:** `DocumentScanner.tsx` with react-webcam for live camera and frame capture
* **Receipt Printer:** `PrintReceiptModal.tsx` with simulated printing animation and jsPDF generation
* **Sound Effects:** Audio feedback for printing operations

### 5.4 Unified Service Switching
* **Store:** `serviceStore.ts` with Zustand for global service context
* **UI:** Toggle-able service cards in `DashboardPage.tsx` with glow effects
* **Filtering:** Selected service filters available actions and billing history

## 6. Security & Compliance

### 6.1 DPDP Act Compliance (Required)
* **Consent Layer:** `ConsentModal.tsx` shown before biometric/OTP login
* **Content:** Explicit consent for UIDAI/biometric data processing
* **Logging:** `consentStore.ts` tracks consent timestamp and version for audit trail
* **Blocking:** Login flow blocked until "I Agree" is tapped
* **Data Protection:** Adhere to **DPDP Act (Digital Personal Data Protection)** guidelines. Encrypt PII at rest and in transit.

### 6.2 Validation
* Strict input validation to prevent injection attacks on public kiosks.

## 7. Development Workflow (Agent Instructions)
* **Plan First:** Before coding complex logic, write a plan in `PLAN.md`.
* **TDD:** Write tests for critical paths (Payment, Auth) before implementation.
* **UI/UX:** Buttons must be large (touch-friendly). High contrast for accessibility.
