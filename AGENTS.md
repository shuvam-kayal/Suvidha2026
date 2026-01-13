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

## 3. Architecture Rules
* **Microservices:** The backend MUST be split into independent services (e.g., `auth-service`, `billing-service`, `grievance-service`) communicating via REST or gRPC.
* **API Gateway:** Implement a centralized API Gateway to route requests from the Kiosk UI to backend services.
* **Loose Coupling:** Services must not share databases. Each service owns its data.

## 4. Key Features to Build
1.  **Unified Dashboard:** Single interface for Electricity, Gas, and Water services.
2.  **Authentication:** Secure login for citizens (OTP/Biometric simulation).
3.  **Bill Payment:** Fetch bills, view history, and simulate payment processing.
4.  **Grievance Redressal:** Log complaints and track status.
5.  **Multilingual Support:** UI must support dynamic language switching (English/Hindi/Regional).
6.  **Admin Panel:** Separate web portal for office staff to monitor Kiosk usage and view analytics.

## 5. Security & Compliance
* **Data Protection:** Adhere to **DPDP Act (Digital Personal Data Protection)** guidelines. Encrypt PII at rest and in transit.
* **Validation:** Strict input validation to prevent injection attacks on public kiosks.

## 6. Development Workflow (Agent Instructions)
* **Plan First:** Before coding complex logic, write a plan in `PLAN.md`.
* **TDD:** Write tests for critical paths (Payment, Auth) before implementation.
* **UI/UX:** Buttons must be large (touch-friendly). High contrast for accessibility.