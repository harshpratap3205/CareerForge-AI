# CareerForge AI

CareerForge AI is an enterprise-grade career acceleration and technical consultation platform. It combines AI-driven resume optimization, real-time interview advisory chat, automated consultation bookings with calendar synchronization, Stripe payment processing, and role-based workspaces for candidates, consultants, and administrators.

---

## 🌐 Live Deployments

| Component | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Web Application** | **Vercel** | [https://career-forge-ai-mauve-eight.vercel.app](https://career-forge-ai-mauve-eight.vercel.app) |
| **Backend REST API** | **Render** | [https://careerforge-ai-o8h2.onrender.com](https://careerforge-ai-o8h2.onrender.com) |
| **Interactive Swagger Docs** | **Render** | [https://careerforge-ai-o8h2.onrender.com/api/docs](https://careerforge-ai-o8h2.onrender.com/api/docs) |
| **System Health Check** | **Render** | [https://careerforge-ai-o8h2.onrender.com/health](https://careerforge-ai-o8h2.onrender.com/health) |

---

## 📑 Table of Contents

- [Live Deployments](#-live-deployments)
- [Architecture & System Overview](#-architecture--system-overview)
- [User Portals & Role-Based Access Control](#-user-portals--role-based-access-control)
- [Demo Accounts & Test Credentials](#-demo-accounts--test-credentials)
- [Step-by-Step Credentials & Environment Setup](#-step-by-step-credentials--environment-setup)
  - [1. MongoDB Atlas & Network Access (IP Whitelist)](#1-mongodb-atlas--network-access-ip-whitelist)
  - [2. Redis Setup (Local Docker or Upstash Cloud)](#2-redis-setup-local-docker-or-upstash-cloud)
  - [3. Google Calendar API & OAuth2 Refresh Token](#3-google-calendar-api--oauth2-refresh-token)
  - [4. SMTP Email Setup (Gmail App Password)](#4-smtp-email-setup-gmail-app-password)
  - [5. Groq API Key (Ultra-Fast LLM)](#5-groq-api-key-ultra-fast-llm)
  - [6. Google Gemini API Key (Fallback LLM)](#6-google-gemini-api-key-fallback-llm)
  - [7. Stripe Checkout & Webhook Setup](#7-stripe-checkout--webhook-setup)
- [Environment Variables Reference](#-environment-variables-reference)
- [Local Development Setup](#-local-development-setup)
- [Docker Compose Deployment](#-docker-compose-deployment)
- [System Architecture & Scaling Trade-offs](#-system-architecture--scaling-trade-offs)

---

## 🏗️ Architecture & System Overview

```
                            ┌────────────────────────┐
                            │   Next.js 14 Client    │
                            │ (React, Tailwind, SSE) │
                            └───────────┬────────────┘
                                        │ HTTP / SSE
                                        ▼
                            ┌────────────────────────┐
                            │  Express TypeScript API│
                            │      (Port 5000)       │
                            └─────┬────────────┬─────┘
                                  │            │
            ┌─────────────────────┼────────────┼─────────────────────┐
            ▼                     ▼            ▼                     ▼
     ┌─────────────┐       ┌─────────────┐┌─────────────┐     ┌─────────────┐
     │ MongoDB     │       │ Redis Cache ││ LLM Engines │     │ Stripe &    │
     │ (Atlas/7.0) │       │ (TTL/Event) ││(Groq/Gemini)│     │ Google APIs │
     └─────────────┘       └─────────────┘└─────────────┘     └─────────────┘
```

### Modular Service Boundaries

- **Auth & User Service**: JWT access & rotating refresh tokens with reuse detection, Bcrypt password hashing, email verification, password reset, and role management.

- **AI Career Advisor Service**: Multi-provider conversational coaching (Groq Llama 3.3 70B & Google Gemini) with Server-Sent Events (SSE) streaming and token usage tracking.

- **Resume Builder Service**: Structured JSON resume extraction, TipTap rich-text editor with real-time autosave indicators, rolling version history snapshots (up to 10 versions), resume duplication, and dual template rendering (**Modern Professional** & **ATS Classic**).

- **Consultation & Booking Service**: Concurrency-safe slot scheduling, availability validation, and state machine (`PENDING_PAYMENT` $\rightarrow$ `PAID` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED`).

- **Payment & Webhook Service**: Stripe Checkout integration with raw-body signature validation and idempotent duplicate event handling.

- **Notification Service**: Automated Google Meet calendar event creation and live Nodemailer HTML confirmation emails.

- **Dashboard & Analytics Service**: Aggregated analytics cached via Redis with event-driven invalidation.

---

## 👥 User Portals & Role-Based Access Control

### 1. Candidate Portal (`USER`)

- **Interactive Resume Studio**: Create, edit, and export resumes with real-time autosave and status feedback.

- **Personalized Profile Defaults**: Resume generator pre-populates with candidate profile data (name, email, phone, bio, skills, target role) with zero mock placeholder text.

- **Version History & Restore**: View past version snapshots and restore any prior snapshot in 1 click.

- **Dual Template Switcher**:
  - **Modern Professional**: Indigo accents, inline SVG contact icons, pill badges, and left-bordered experience cards.
  - **ATS Classic**: 100% monochrome, single-column layout, standard serif typography (`Times New Roman`), all-caps bordered headings, and zero SVGs/pills for strict ATS compliance.

- **AI Career Advisor**: Streaming conversational career preparation and interview coaching.

- **Mentor Booking**: Book 1-on-1 consultation slots, complete Stripe payment, and receive Google Calendar invitations.

### 2. Career Consultant Workspace (`CONSULTANT`)

- **Schedule Isolation**: Dedicated consultation view showing assigned candidate sessions and meeting agendas.

- **Filtered Navigation**: Automatically removes user booking buttons to focus on consultation delivery.

- **Live Google Meet Access**: Direct 1-click links to join booked client sessions.

### 3. Administrator Command Center (`ADMIN`)

- **Platform Analytics**: Monitor active resumes, scheduled sessions, completed consultations, and revenue.

- **User Management (`/admin/users`)**: Search across all registered users, verify statuses, and instantly promote or adjust roles (`USER`, `CONSULTANT`, `ADMIN`).

- **Audit Access**: Overview of all platform bookings and transaction states.

---

## 🔑 Demo Accounts & Test Credentials

The database comes pre-configured with all four platform roles ready for immediate login and evaluation:

| Role | Name | Email | Password | Portal View |
| :--- | :--- | :--- | :--- | :--- |
| **Candidate / Job Seeker** | Alex Johnson | `candidate@careerforge.ai` | `Candidate@123` | **Candidate Portal**: Pre-seeded resume, TipTap editor with autosave, version snapshots, AI chat advisor, mentor booking & Stripe checkout. |
| **Platform Administrator** | Platform Administrator | `admin@careerforge.ai` | `Admin@123456` | **Admin Command Center**: Platform analytics, User Management (`/admin/users`), system bookings oversight. |
| **Career Consultant** | Sarah Jenkins | `sarah.jenkins@careerforge.ai` | `Consultant@123` | **Consultant Workspace**: Assigned sessions, Google Meet video links, isolated mentor schedule. |
| **Career Consultant** | David Chen | `david.chen@careerforge.ai` | `Consultant@123` | **Consultant Workspace**: Secondary consultant demonstrating schedule isolation. |

To initialize or reset all demo accounts:

```bash
cd server
npm run seed
```

---

## 🛠️ Step-by-Step Credentials & Environment Setup

### 1. MongoDB Atlas & Network Access (IP Whitelist)

1. Sign in or register at [MongoDB Cloud](https://cloud.mongodb.com/).

2. Create a free **M0 Shared Cluster**.

3. **Create Database User**:
   - Go to **Security** $\rightarrow$ **Database Access**.
   - Click **Add New Database User**.
   - Select Authentication Method **Password** (e.g., username: `careerforge_admin`, password: `YourSecurePassword123`).
   - Set Database User Privileges to **Read and write to any database**.
   - Click **Add User**.

4. **Configure Network Access (Crucial Step)**:
   - Go to **Security** $\rightarrow$ **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (enters `0.0.0.0/0`).
   - *(Note: If `0.0.0.0/0` is not added, connections from local machines or cloud servers will fail with a connection timeout or DNS error).*
   - Click **Confirm**.

5. **Get Connection String**:
   - Go to **Deployment** $\rightarrow$ **Database**.
   - Click **Connect** on your cluster $\rightarrow$ **Drivers (Node.js)**.
   - Copy the URI and replace `<password>` with your database user password:
     ```env
     MONGODB_URI=mongodb+srv://careerforge_admin:YourSecurePassword123@cluster0.xxxxx.mongodb.net/careerforge?retryWrites=true&w=majority
     ```

---

### 2. Redis Setup (Local Docker or Upstash Cloud)

#### Option A: Local Docker (Recommended for Local Dev)

If running Redis locally via Docker:

```env
REDIS_URL=redis://localhost:6379
```

#### Option B: Upstash Redis (Free Managed Cloud Redis)

1. Sign in at the [Upstash Console](https://console.upstash.com/).

2. Click **Create Database**.

3. Choose a name (e.g. `careerforge-redis`) and select your closest region.

4. Once created, scroll down to the **Connect** section.

5. Select the **ioredis** or **Node** tab and copy the connection string:
   ```env
   REDIS_URL=rediss://default:AbCdEf123456@us1-example-32456.upstash.io:6379
   ```

---

### 3. Google Calendar API & OAuth2 Refresh Token

To automatically generate live Google Meet video links and schedule events on Google Calendar:

#### Step 1: Create Google Cloud Project & Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).

2. Create a new project (e.g., `CareerForge-Platform`).

3. In the sidebar, navigate to **APIs & Services** $\rightarrow$ **Library**.

4. Search for **Google Calendar API** and click **Enable**.

5. Go to **APIs & Services** $\rightarrow$ **OAuth consent screen**:
   - Select **External** and click **Create**.
   - Enter an App Name (e.g., `CareerForge AI`) and your email address.
   - Under **Test users**, click **Add Users** and add your personal Gmail address.
   - Save and continue.

6. Go to **APIs & Services** $\rightarrow$ **Credentials**:
   - Click **Create Credentials** $\rightarrow$ **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `CareerForge Backend`.
   - Under **Authorized redirect URIs**, add:
     ```
     https://developers.google.com/oauthplayground
     ```
   - Click **Create** and copy your **Client ID** and **Client Secret**.

#### Step 2: Generate the Refresh Token via OAuth 2.0 Playground

1. Open the [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground).

2. Click the **gear icon (⚙️)** in the top right corner:
   - Check the box **"Use your own OAuth credentials"**.
   - Enter your **OAuth Client ID** and **OAuth Client Secret** from Step 1.

3. On the left side under **Step 1 Select & authorize APIs**:
   - Scroll down to **Google Calendar API v3**.
   - Check `https://www.googleapis.com/auth/calendar`.

4. Click the blue **Authorize APIs** button.

5. Sign in with the Google account you added as a test user and click **Continue** / **Allow**.

6. Under **Step 2 Exchange authorization code for tokens**:
   - Click **Exchange authorization code for tokens**.

7. Copy the generated value from the **Refresh token** field.

8. Add to your `server/.env`:
   ```env
   GOOGLE_CALENDAR_CLIENT_ID=your_client_id.apps.googleusercontent.com
   GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-your_client_secret
   GOOGLE_CALENDAR_REFRESH_TOKEN=1//04your_refresh_token
   ```

*(Note: If Google Calendar credentials are not configured, the platform automatically generates simulated Google Meet links gracefully without blocking payments or bookings).*

---

### 4. SMTP Email Setup (Gmail App Password)

To send booking confirmation emails, password reset links, and email verification tokens:

1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).

2. Ensure **2-Step Verification** is turned ON.

3. In the search bar at the top, search for **App Passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).

4. Enter an App name: `CareerForge AI` and click **Create**.

5. Google will generate a 16-character code (e.g., `abcd efgh ijkl mnop`).

6. Add to your `server/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   EMAIL_FROM=CareerForge AI <your_email@gmail.com>
   ```

*(Note: If SMTP credentials are not set, emails are logged to the console in development/test mode with direct links).*

---

### 5. Groq API Key (Ultra-Fast LLM)

1. Navigate to the [Groq Cloud Console](https://console.groq.com/keys).

2. Sign in with GitHub or Google.

3. Click **Create API Key**.

4. Name the key (e.g., `careerforge-dev`) and copy the generated token (`gsk_...`).

5. Add to your `server/.env`:
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key
   ```

*Groq powers lightning-fast resume generation and streaming advisory chat using `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`.*

---

### 6. Google Gemini API Key (Fallback LLM)

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).

2. Click **Create API key**.

3. Select an existing Google Cloud project or create a new one.

4. Copy the generated key (`AIzaSy...`).

5. Add to your `server/.env`:
   ```env
   GEMINI_API_KEY=AIzaSy_your_gemini_api_key
   ```

---

### 7. Stripe Checkout & Webhook Setup

1. Sign in to the [Stripe Dashboard](https://dashboard.stripe.com/) and make sure **Test Mode** is enabled.

2. Under **Developers** $\rightarrow$ **API Keys**, copy the **Secret key** (`sk_test_...`).

3. For local webhooks, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) or configure Stripe webhooks:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```

4. Copy the webhook signing secret (`whsec_...`) printed by the CLI.

5. Add to `server/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## ⚙️ Environment Variables Reference

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# MongoDB & Redis
MONGODB_URI=mongodb+srv://careerforge_admin:YourPassword@cluster0.xxxxx.mongodb.net/careerforge?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379

# Authentication Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_32_characters_minimum
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_characters_minimum
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# AI Model Providers
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# Stripe Payment
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP Email Dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=CareerForge AI <your_email@gmail.com>

# Google Calendar API
GOOGLE_CALENDAR_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-your_client_secret
GOOGLE_CALENDAR_REFRESH_TOKEN=1//04your_refresh_token
```

### Frontend (`client/.env`)

```env
Server_API_URL=http://localhost:5000
```

---

## 🚀 Local Development Setup

### 1. Install & Run Server

```bash
cd server
npm install
npm run dev
```

- Server URL: `http://localhost:5000`
- Interactive Swagger UI: `http://localhost:5000/api/docs`

### 2. Install & Run Client

```bash
cd client
npm install
npm run dev
```

- Client URL: `http://localhost:3000`

### 3. Run Automated Tests

```bash
cd server
npm test
```

*Executes all 20 Jest integration test suites covering Authentication, Strong Passwords, Password Reset, Email Verification, Chat Sessions, Resume Engine, Booking State Machine, Payment Webhook Idempotency, and Redis Cache Invalidation.*

---

## 🐳 Docker Compose Deployment

To spin up the complete containerized stack (Next.js Client, Express Server, MongoDB 7.0, and Redis 7.2):

```bash
docker compose up --build -d
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

To view container statuses:

```bash
docker compose ps
```

To stop containers:

```bash
docker compose down
```

> For deep-dive networking details, healthcheck explanations, volume management, and troubleshooting, read the [Docker Guide (DOCKER.md)](DOCKER.md).

---

## 📈 System Architecture & Scaling Trade-offs

### 1. Microservice Service Boundaries vs. Modular Monolith

- **Current Architecture**: A modular monolith with strictly isolated module folders (`auth`, `user`, `chat`, `resume`, `booking`, `payment`, `notification`, `dashboard`).

- **Trade-off**: Provides zero network overhead between modules while preserving clean boundaries and domain separation.

- **Path to 1M Users**: Split the CPU-bound Resume Rendering and AI Streaming services into independent autoscaling microservices on Kubernetes (EKS / GKE) behind an API Gateway (Kong / Envoy).

### 2. Database Indexing & Query Strategy

- Compound unique indexes on `Booking` (`{ consultantId: 1, date: 1, timeSlot: 1 }`) eliminate double-booking race conditions at the database level.

- Compound indexing on `ChatMessage` (`{ sessionId: 1, createdAt: 1 }`) ensures fast paging of conversation threads.

- **Path to 1M Users**: Implement MongoDB horizontal sharding hashed on `userId` for `ChatMessage` and `Resume` collections, while caching hot consultant availability in Redis.

### 3. Asynchronous Workflow Reliability

- Payment confirmation triggers a 4-step workflow: Record Payment $\rightarrow$ Transition Booking to `PAID` $\rightarrow$ Schedule Google Calendar Event $\rightarrow$ Transition to `CONFIRMED` $\rightarrow$ Dispatch Email.

- If Google Calendar fails, the booking remains in `PAID` status and a background retry queue reconciles the appointment without charging the customer twice or dropping the reservation.

---

## 📄 License

MIT
