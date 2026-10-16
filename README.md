# CareerForge AI — Production MERN Career & Consultation Platform

CareerForge AI is a modular, microservice-oriented full-stack career platform designed to empower engineers with AI career coaching, dual-template ATS resume generation with live Tiptap editing, and seamless 1-on-1 expert consultation bookings backed by Stripe Checkout, Google Calendar events, and automated Nodemailer confirmations.

---

## Architecture Overview

```
                               ┌────────────────────────────────┐
                               │   Next.js 14 Client (Vercel)   │
                               │    TypeScript + TailwindCSS    │
                               │   Tiptap Editor + Lucide UI    │
                               └───────────────┬────────────────┘
                                               │ (HTTPS / SSE)
                                               ▼
                               ┌────────────────────────────────┐
                               │       API Gateway Server       │
                               │    Express + Helmet + CORS     │
                               │     Rate Limiting + Routes     │
                               └───────────────┬────────────────┘
                                               │
             ┌───────────────────┬─────────────┴───────┬───────────────────┐
             ▼                   ▼                     ▼                   ▼
      ┌─────────────┐     ┌─────────────┐       ┌─────────────┐     ┌─────────────┐
      │ Auth & User │     │ AI & Resume │       │ Consultation│     │ Notification│
      │   Module    │     │   Module    │       │  & Payment  │     │   Module    │
      └──────┬──────┘     └──────┬──────┘       └──────┬──────┘     └──────┬──────┘
             │                   │                     │                   │
             ▼                   ▼                     ▼                   ▼
      [MongoDB Atlas]     [Google Gemini]       [Stripe Webhook]     [Google Meet]
      [Upstash Redis]     [ATS Templates]       [Idempotency DB]    [Nodemailer]
```

### Service Boundaries & Rationale
1. **Auth & Identity Module (`/api/auth`, `/api/users`)**: Encapsulates credential storage, bcrypt hashing, JWT access token issuance, refresh token rotation, and role authorization (`USER`, `ADMIN`, `CONSULTANT`).
2. **AI & Chat Module (`/api/chat`)**: Isolates the LLM client (Google Gemini 1.5/2.0 Flash) from core transactional data. Supports Server-Sent Events (SSE) streaming, context memory, and custom per-minute rate limiting.
3. **Resume Module (`/api/resumes`)**: Maintains structured data schemas (8 required sections) strictly decoupled from the presentation templates. Syncs with Tiptap editor JSON and ATS-compliant HTML.
4. **Booking & Consultation Module (`/api/bookings`)**: Enforces state machine transitions (`PENDING_PAYMENT` $\rightarrow$ `PAID` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` / `CANCELLED`), prevents slot double-booking, and handles server-side pagination, search, and filtering.
5. **Payment & Webhook Module (`/api/payments`)**: Direct Stripe Checkout integration. Follows Stripe best practice where the webhook is the single source of truth, protected by raw body signature verification and duplicate event idempotency checks.
6. **Notification Module (`/api/notifications`)**: Async dispatch for Google Calendar API meeting invitations (Google Meet) and Nodemailer receipts. Errors in external calendar APIs are handled gracefully without aborting verified payments.
7. **Dashboard Module (`/api/dashboard`)**: Single-roundtrip MongoDB `$facet` aggregation pipelines cached in Redis with a 300-second TTL.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Tiptap (`@tiptap/react`, `@tiptap/starter-kit`), Lucide Icons, Axios |
| **Backend** | Node.js, Express, TypeScript, Helmet, CORS, Morgan, Express Rate Limit, Zod |
| **Database & Cache** | MongoDB Atlas (Mongoose ODM with compound indexing), Redis (Upstash / Redis 7.2) |
| **AI / LLM** | Google Gemini 1.5 Flash / 2.0 Flash via `@google/generative-ai` |
| **Payments** | Stripe Node SDK, Stripe Checkout Sessions, Webhooks |
| **Calendar & Email** | Google Calendar API (`googleapis`), Nodemailer (SMTP / Gmail App Passwords) |
| **Testing & Docs** | Jest, Supertest, Swagger / OpenAPI 3.0 (`swagger-ui-express`) |
| **Containerization** | Docker, Docker Compose |

---

## Database Design & Indexing

### Collections
- **`users`**: `{ _id, name, email (unique), passwordHash, role, profile, refreshTokenHash, createdAt, updatedAt }`
  - *Indexes*: `{ email: 1 }` (unique), `{ role: 1 }`
- **`chatsessions`**: `{ _id, userId, title, createdAt, updatedAt }`
  - *Indexes*: `{ userId: 1, updatedAt: -1 }`
- **`chatmessages`**: `{ _id, sessionId, userId, role, content, tokenCount, createdAt }`
  - *Indexes*: `{ sessionId: 1, createdAt: 1 }`
- **`resumes`**: `{ _id, userId, title, templateId, personalInfo, summary, education, experience, skills, projects, certifications, achievements, tiptapHtml, versions, createdAt, updatedAt }`
  - *Indexes*: `{ userId: 1, updatedAt: -1 }`
- **`consultants`**: `{ _id, name, email (unique), specialty, hourlyRate, slots, availableDays, isActive }`
- **`bookings`**: `{ _id, userId, consultantId, date, timeSlot, name, email, phone, meetingAgenda, status, amount, stripeSessionId, paymentIntentId, calendarEventId, meetingLink, createdAt, updatedAt }`
  - *Indexes*: Compound `{ consultantId: 1, date: 1, timeSlot: 1 }`, `{ userId: 1, createdAt: -1 }`
- **`payments`**: `{ _id, bookingId, userId, stripeSessionId (unique), paymentIntentId (unique), amount, currency, status, rawWebhookData, createdAt }`
  - *Indexes*: Sparse unique on `stripeSessionId` and `paymentIntentId` for webhook idempotency.

---

## Setup & Local Installation

### Prerequisites
- Node.js 18+ or 20+
- MongoDB (Local or MongoDB Atlas connection string)
- Redis (Local or free Upstash Redis URL)
- Stripe Account (Test mode keys)
- Google AI Studio (Free Gemini API key)

### 1. Clone & Configure Environment Variables
```bash
git clone https://github.com/<your-username>/CareerForge-AI.git
cd CareerForge-AI
```

Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careerforge?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_key_123
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_456
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

GEMINI_API_KEY=your_gemini_api_key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=CareerForge AI <no-reply@careerforge.ai>

GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REFRESH_TOKEN=
```

Create `client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Run with Docker Compose (Recommended)
```bash
docker compose up --build
```
- Client runs at: `http://localhost:3000`
- API Server runs at: `http://localhost:5000`
- Swagger Documentation: `http://localhost:5000/api/docs`

### 3. Run Manually

**Start Backend**:
```bash
cd server
npm install
npm run dev
```

**Start Frontend**:
```bash
cd client
npm install
npm run dev
```

### 4. Running Automated Tests
```bash
cd server
npm test
```

---

## Free Cloud Deployment

### 1. MongoDB Atlas (Database)
- Create free **M0 Cluster** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
- Under Network Access, whitelist `0.0.0.0/0`.
- Copy connection string and paste into backend `MONGODB_URI`.

### 2. Upstash Redis (Cache)
- Create a free database at [upstash.com](https://upstash.com).
- Copy the standard `rediss://default:...@...upstash.io:6379` connection URI into `REDIS_URL`.

### 3. Backend on Render
- Connect repository to [render.com](https://render.com) $\rightarrow$ New Web Service.
- Root Directory: `server`.
- Build Command: `npm install && npm run build`.
- Start Command: `npm start`.
- Inject environment variables.

### 4. Frontend on Vercel
- Import repository into [vercel.com](https://vercel.com).
- Root Directory: `client`.
- Add environment variable: `NEXT_PUBLIC_API_URL=https://your-server.onrender.com/api`.

---

## Architecture & Code Review Walkthrough (Section 29)

### 1. Why did you choose these microservice boundaries?
Boundaries are established around business domains with distinct scaling and fault tolerance profiles:
- **Auth & Identity**: High security, shared across all services.
- **AI Career Coach**: High latency, compute-intensive, third-party bounded (Gemini API), requiring dedicated rate limits.
- **Consultation & Stripe Payments**: Strict transactional consistency, zero duplicate tolerances, external webhook ingestion.
- **Notifications**: Asynchronous, background-safe; external API failures (Google Calendar/SMTP) should not roll back completed payments.

### 2. Why did you embed or reference particular MongoDB data?
- **Embedded**: Resume versions, education entries, experience bullets, and skills are embedded directly within the `Resume` document because they are always read and mutated in conjunction with the resume, staying well beneath MongoDB's 16MB document limit.
- **Referenced**: `ChatMessages` reference `ChatSessions` via `sessionId` to prevent document bloat across long discussions. `Bookings` reference `Consultant` and `User` via ObjectIds because consultants exist independently of individual bookings.

### 3. What happens if Stripe sends the same webhook twice?
The webhook handler is strictly idempotent:
Before processing, it queries the `Payment` collection using `stripeSessionId` or `paymentIntentId`. If a document already exists with `status: 'succeeded'`, the webhook instantly returns `200 OK` with `{ status: 'already_processed' }`, preventing double booking updates or duplicate calendar invites.

### 4. What happens if payment succeeds but Google Calendar fails?
The state transition from `PENDING_PAYMENT` to `PAID` is persisted first. The Google Calendar API call is isolated in a try-catch block. If it fails, the booking remains in `CONFIRMED` status with a fallback meeting URL, and the error is logged to an incident queue rather than aborting the transaction.

### 5. How would you make the payment-to-booking workflow idempotent?
We use two-layer idempotency:
1. Unique constraints on `Payment.stripeSessionId` and `Payment.paymentIntentId`.
2. A compound check on `Booking` ensuring only valid state transitions occur (`PENDING_PAYMENT` $\rightarrow$ `PAID` $\rightarrow$ `CONFIRMED`). Multiple calls on an already `CONFIRMED` booking no-op safely.

### 6. What happens if the LLM takes 30 seconds to respond?
1. Streaming SSE (`POST /api/chat/sessions/:id/stream`) sends tokens incrementally as they arrive, providing an immediate Time-to-First-Token (TTFT) under 600ms and eliminating client-side timeouts.
2. For non-streaming requests, client timeouts are set to 45s, and the backend employs an AbortController with a fallback response if the upstream LLM hangs.

### 7. How would you implement streaming?
Using Server-Sent Events (SSE) with `res.setHeader('Content-Type', 'text/event-stream')`. As Gemini yields chunks via `chat.sendMessageStream()`, `res.write('data: ...\n\n')` flushes chunks to the client in real time until `[DONE]` is signaled.

### 8. Where would you use Redis and how would you invalidate the cache?
- **Where**: Dashboard metric aggregations (`GET /api/dashboard`), active user session authorization tokens, and AI request rate limits.
- **Invalidation Strategy**: Cache-aside with TTL (300 seconds). Immediate key invalidation (`cacheDel('dashboard:<userId>')`) is triggered upon any write operation (`createResume`, `updateResume`, `createBooking`, `confirmPayment`).

### 9. How would you scale the AI service?
- Run multiple stateless AI worker instances behind a round-robin load balancer.
- Implement an async message queue (BullMQ / RabbitMQ) for background tasks like bulk resume optimization.
- Cache popular career advice prompts in Redis to bypass LLM calls for repeated standard queries.

### 10. Which MongoDB indexes did you create and why?
- `User.email` (Unique): Fast login lookups and enforcement of single account per email.
- `Booking.{consultantId, date, timeSlot}`: Compound index preventing concurrent double-booking.
- `Resume.{userId, updatedAt}`: Speeds up user resume dashboard listings sorted by recent edits.
- `ChatMessage.{sessionId, createdAt}`: Efficient retrieval of conversation history.
- `Payment.{stripeSessionId, paymentIntentId}`: Sparse unique indexes guaranteeing webhook idempotency.

### 11. How would you handle 100 concurrent resume generations?
Offload generation requests into a BullMQ Redis queue with concurrency throttling (e.g. 10 parallel Gemini workers) to respect LLM provider rate limits (TPM/RPM), and return a task ID to the frontend to poll or listen via WebSockets.

### 12. What happens if one microservice becomes unavailable?
The API Gateway catches downstream failures and serves circuit-breaker fallbacks. If the Notification service goes down, booking and payment continue to succeed, and un-sent emails are retained in an event store for replay upon recovery.

### 13. How would you authenticate service-to-service requests?
Internal requests between microservices utilize mTLS or signed internal JWTs (`HS256` or asymmetric `RS256`) with short 1-minute expiration windows passed in the `X-Internal-Service-Auth` header.

### 14. What would you change to support 1 million users?
- Shard MongoDB cluster across `userId`.
- Place a CDN (Cloudflare) in front of Next.js static assets and cached resume templates.
- Transition from in-process event dispatches to an Apache Kafka or AWS SQS event stream.
- Employ read replicas for dashboard aggregations and listing queries.

### 15. Which part of your own implementation would you refactor after reviewing it?
Introduce BullMQ with Redis streams for calendar event dispatch and email delivery so asynchronous worker tasks have built-in exponential backoff, dead-letter queues, and automatic re-tries.

---

## License
MIT
#   C a r e e r F o r g e - A I  
 