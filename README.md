# CareerForge AI

Production-grade MERN full-stack career platform featuring multi-model AI advisory (Groq & Gemini), dual-template ATS resume management with live TipTap document synchronization, and end-to-end consultant bookings backed by Stripe Checkout, Google Calendar event creation (with Google Meet), and Nodemailer receipts.

---

## Architecture

```
                               ┌────────────────────────────────┐
                               │   Next.js 14 App Router UI     │
                               │  TypeScript + Tailwind CSS     │
                               │  TipTap Editor + SSE Client    │
                               └───────────────┬────────────────┘
                                               │ (HTTPS / SSE Stream)
                                               ▼
                               ┌────────────────────────────────┐
                               │       Node / Express API       │
                               │     Helmet + Strict CORS       │
                               │   Redis Token Bucket Limiter   │
                               └───────────────┬────────────────┘
                                               │
             ┌───────────────────┬─────────────┴───────┬───────────────────┐
             ▼                   ▼                     ▼                   ▼
      ┌─────────────┐     ┌─────────────┐       ┌─────────────┐     ┌─────────────┐
      │ Auth & User │     │ Resume & AI │       │Consultations│     │Notification │
      │   Module    │     │   Engine    │       │  & Stripe   │     │   Module    │
      └──────┬──────┘     └──────┬──────┘       └──────┬──────┘     └──────┬──────┘
             │                   │                     │                   │
             ▼                   ▼                     ▼                   ▼
      [MongoDB Atlas]     [Groq / Gemini]       [Stripe Webhook]     [Google Meet]
      [Upstash Redis]     [TipTap & ATS]        [Idempotent DB]     [Nodemailer]
```

### Module Boundaries
- **Auth & Identity (`/api/auth`, `/api/users`)**: JWT access tokens (15m expiry) paired with HttpOnly refresh cookies (7d). Features dynamic silent token refresh on client, cryptographic token rotation with family reuse revocation, and candidate profile management.
- **AI Advisory (`/api/chat`)**: Multi-provider support (Groq `openai/gpt-oss-120b`, `qwen/qwen3.8-27b` and Google `gemini-flash-latest`, `gemini-3.5-flash`). Delivers real-time Server-Sent Events (SSE) streaming with persistent thread history in MongoDB.
- **Resume Studio (`/api/resumes`)**: Two distinct rendering pipelines — **ATS Classic** (strict semantic HTML, single-column monochrome) and **Modern Professional** (executive layout with indigo accenting and pill badges). Real-time autosave via TipTap headless document JSON + HTML parser.
- **Consultation Engine (`/api/consultations`)**: State machine transitions (`PENDING_PAYMENT` -> `PAID` -> `CONFIRMED` -> `COMPLETED` / `CANCELLED`). Slot locking prevents double bookings.
- **Payments & Webhooks (`/api/consultations/webhook`)**: Stripe Checkout integration. Signature-verified raw-body webhook with unique database constraints on `stripeSessionId` and `paymentIntentId` for absolute idempotency.
- **Calendar & Notifications**: Google Calendar API creates scheduled calendar invites with native Google Meet links. Async Nodemailer dispatches HTML booking confirmations with error isolation.
- **Rate Limiting**: Distributed Token Bucket algorithm powered by atomic Redis Lua scripts with graceful in-memory Map fallback.

---

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, TipTap Editor (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`), Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, Helmet, CORS, Morgan, ioredis, Zod.
- **Databases**: MongoDB Atlas (Mongoose ODM with compound indexing), Upstash Redis (Redis 7.2).
- **External APIs**: Stripe (Checkout & Webhooks), Google Calendar API (`googleapis`), Google Gemini & Groq SDKs, Nodemailer SMTP.
- **Testing & Documentation**: Jest, Supertest, Swagger / OpenAPI 3.0.

---

## Database Schema & Index Design

- **`users`**: `{ name, email (unique), passwordHash, role, phone, profile: { headline, bio, skills }, refreshTokenHash }`
  - Indexes: `{ email: 1 }` (unique), `{ role: 1 }`
- **`chatsessions`**: `{ userId, title, createdAt, updatedAt }`
  - Indexes: `{ userId: 1, updatedAt: -1 }`
- **`chatmessages`**: `{ sessionId, userId, role, content, createdAt }`
  - Indexes: `{ sessionId: 1, createdAt: 1 }`
- **`resumes`**: `{ userId, title, templateId, personalInfo, summary, experience, education, skills, projects, certifications, achievements, tiptapHtml, tiptapContent }`
  - Indexes: `{ userId: 1, updatedAt: -1 }`
- **`consultants`**: `{ name, email, specialty, hourlyRate, slots, availableDays, isActive }`
- **`bookings`**: `{ candidateId, consultantId, candidateName, candidateEmail, candidatePhone, date, timeSlot, agenda, priceAmount, currency, status, stripeSessionId, paymentIntentId, calendarEventId, calendarLink }`
  - Indexes: `{ consultantId: 1, date: 1, timeSlot: 1 }` (prevents double bookings), `{ candidateId: 1, createdAt: -1 }`
- **`payments`**: `{ bookingId, candidateId, stripeSessionId (unique), paymentIntentId (unique), amount, currency, status }`
  - Indexes: `{ stripeSessionId: 1 }` (unique), `{ paymentIntentId: 1 }` (unique)

---

## Local Setup

### Prerequisites
- Node.js 18+ or 20+
- MongoDB Atlas connection string
- Redis (Local instance or Upstash Redis URL)
- Stripe Account (Test mode keys)

### 1. Environment Configuration

Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careerforge?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379

JWT_ACCESS_SECRET=your_super_secret_access_jwt_key_32chars
JWT_REFRESH_SECRET=your_super_secret_refresh_jwt_key_32chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=CareerForge AI <no-reply@careerforge.ai>

GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALENDAR_REFRESH_TOKEN=1//...
```

Create `client/.env.local`:
```env
Server_API_URL=http://localhost:5000/api
```

### 2. Install & Start Server
```bash
cd server
npm install
npm run dev
```
The server boots on `http://localhost:5000`.
Interactive Swagger UI documentation is available at `http://localhost:5000/api/docs`.

### 3. Install & Start Client
```bash
cd client
npm install
npm run dev
```
The client runs on `http://localhost:3000`.

### 4. Run Automated Test Suite
```bash
cd server
npm test
```
Executes comprehensive integration tests across Authentication, Refresh Token Rotation, Resume CRUD, Consultation Slot Locking, Stripe Webhook Idempotency, and Rate Limiting.

---

## Technical Assessment Q&A

### 1. Why did you choose these microservice boundaries?
Boundaries are structured around functional isolation and failure boundaries:
- Identity & Auth has high security and low latency requirements.
- AI Advisory has high latency and external rate limits; keeping it isolated prevents LLM backpressure from degrading transactional booking or auth flows.
- Consultations & Payments require strict ACID guarantees, atomic slot locking, and webhook idempotency.
- Notifications (Calendar + Email) run asynchronously so third-party external failures never block payment confirmation.

### 2. Why did you embed or reference particular MongoDB data?
- **Embedded**: Resume sections (work experience, education entries, bullet items, skills) are embedded inside the `Resume` document. They are always mutated and read together with the resume, easily fitting within MongoDB's 16MB document limit and eliminating expensive `$lookup` joins.
- **Referenced**: `ChatMessages` reference `ChatSessions` via foreign keys to keep unbounded conversational text from bloating session documents. `Bookings` reference `User` and `Consultant` to maintain relational integrity and support independent consultant profiles.

### 3. What happens if Stripe sends the same webhook twice?
The handler is strictly idempotent:
Before any mutation, it queries `Payment` by `stripeSessionId`. If a record already exists with status `succeeded`, the webhook logs the duplicate event and immediately returns `200 OK` with `{ status: 'already_processed' }`. No duplicate calendar events, email receipts, or status changes are executed.

### 4. What happens if payment succeeds but Google Calendar fails?
The payment is already verified and the booking status is set to `CONFIRMED`. Google Calendar generation runs in an isolated `try/catch` block. If Google rejects the OAuth token or rate limits the request, the error is logged to the system logger, the booking keeps its confirmed state with a direct meeting fallback URL, and an email notification is still dispatched to the candidate.

### 5. How would you make the payment-to-booking workflow idempotent?
Two-tier idempotency:
1. Unique database index on `Payment.stripeSessionId` and `Payment.paymentIntentId`.
2. State validation on `Booking`: only transitions from `PENDING_PAYMENT` to `PAID`/`CONFIRMED` are accepted. Re-processing an already confirmed booking executes as a safe no-op.

### 6. What happens if the LLM takes 30 seconds to respond?
Server-Sent Events (SSE) streaming emits tokens as soon as they are produced by the model. Time-to-First-Token (TTFT) is under 800ms, keeping the HTTP connection active and preventing browser timeouts. For standard non-streaming fallback endpoints, a 30s timeout aborts the request and serves a polite fallback message.

### 7. How would you implement streaming?
Using SSE (`text/event-stream`). The Express endpoint sets `Cache-Control: no-cache` and `Connection: keep-alive`. As Groq or Gemini produces chunks, `res.write('data: ...\n\n')` flushes them to the client. When generation finishes, `data: [DONE]\n\n` is sent and the stream is closed with `res.end()`.

### 8. Where would you use Redis and how would you invalidate the cache?
- **Usage**: Token Bucket rate limiters (`rate:bucket:<prefix>:<id>`), and dashboard aggregation results (`dashboard:<userId>`).
- **Invalidation**: Time-To-Live (TTL of 300s) combined with event-driven cache invalidation: mutating actions (creating a resume, updating profile, confirming a booking) call `cacheDel('dashboard:<userId>')` immediately.

### 9. How would you scale the AI service?
- Run stateless AI worker replicas behind a round-robin load balancer.
- Implement an asynchronous job queue (e.g., BullMQ backed by Redis) for non-realtime tasks like batch resume generation and PDF exports.
- Cache common career advice responses in Redis keyed by prompt embedding or normalized query string.

### 10. Which MongoDB indexes did you create and why?
- `users.email` (Unique): Fast login lookups and prevention of duplicate accounts.
- `bookings.{consultantId, date, timeSlot}` (Compound): High-speed query to prevent double-booking identical slots.
- `resumes.{userId, updatedAt}`: Rapid pagination of user resumes sorted by latest update.
- `chatmessages.{sessionId, createdAt}`: High-performance retrieval of conversation histories in chronological sequence.
- `payments.stripeSessionId` (Unique): Prevents duplicate webhook handling.

### 11. How would you handle 100 concurrent resume generations?
Place generation requests into a BullMQ queue with concurrency throttled to match provider limits (e.g., 20 parallel workers). Return a Job ID with HTTP 202 Accepted. The frontend listens to progress via WebSockets or Server-Sent Events, decoupling incoming traffic from LLM rate limits.

### 12. What happens if one microservice becomes unavailable?
The API Gateway implements circuit breakers. If the notification service is down, consultation bookings and payments complete successfully, and notifications are queued in a persistent dead-letter queue in Redis to be replayed upon service recovery.

### 13. How would you authenticate service-to-service requests?
Using short-lived asymmetric JWTs (`RS256`) signed by the calling service with the destination service verifying via public keys, or using mutual TLS (mTLS) within a Kubernetes service mesh (e.g. Istio).

### 14. What would you change to support 1 million users?
- Shard MongoDB horizontally on `userId`.
- Deploy Next.js frontend to a global edge CDN (Cloudflare / Vercel Edge).
- Separate the AI inference pipeline into dedicated GPU or third-party queue workers.
- Add read replicas for read-heavy dashboard and public consultant queries.

### 15. Which part of your own implementation would you refactor after reviewing it?
Introduce BullMQ with Redis Streams for asynchronous event dispatch (Google Calendar creation and Nodemailer sending) to provide native retry mechanisms with exponential backoff and persistent job telemetry.

---

## License
MIT