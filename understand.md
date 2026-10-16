# CareerForge AI — System Architecture & Implementation Report

This document records the engineering architecture, bug diagnoses, design choices, and operating instructions for the **CareerForge AI** full-stack platform (MERN Full-Stack Developer — 3+ YOE Technical Assessment).

---

## 1. Project Overview & Scope

CareerForge AI is an integrated platform combining:
1. **Advisory Console**: Multi-session conversational career coaching with streaming generation.
2. **Dual-Template Resume Engine**: Structured 8-section ATS resume builder with Tiptap rich-text sync and version control.
3. **Consultation Scheduling**: Slot reservation with past-date validation and double-booking conflict locks.
4. **Stripe Payments**: Checkout session generation with an idempotent webhook handler acting as the single source of truth.
5. **Calendar & Email Automation**: Asynchronous Google Meet link creation and Nodemailer receipts with non-blocking error handling.
6. **Dashboard & Caching**: MongoDB single-roundtrip aggregation pipelines with Redis TTL caching.

---

## 2. Gemini Error Diagnosis & Resolution

### The Error
```text
[GoogleGenerativeAI Error]: Error fetching from https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent: [404 Not Found] models/gemini-1.5-flash is not found for API version v1beta, or is not supported for generateContent.
```

### Root Cause
Google's Generative Language API (`v1beta`) has deprecated `gemini-1.5-flash` and `gemini-2.0-flash` for newly generated API keys. When queried via `ModelService.ListModels`, Google explicitly returns:
```text
"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash for the latest features and improvements."
```

### The Fix
1. **Model Updated**: Switched the model string in both `server/src/modules/chat/chat.service.ts` and `server/src/modules/resume/resume.service.ts` to `gemini-3.8-flash`.
2. **Live Verification**: Tested directly against the user's `.env` API key (`AQ.Ab8RN...`), which succeeded with HTTP 200:
   ```text
   SUCCESS with model: gemini-3.8-flash --> Hello
   ```
3. **Graceful Fallback**: If the Gemini API experiences temporary 503 upstream load spikes, a development fallback is returned to prevent the Express server from crashing or throwing unhandled rejections.

---

## 3. UI Modernization & Professional Styling

Per the design requirements, the frontend was completely cleaned up to eliminate AI template tropes:

| Element | Previous (AI / Template Style) | Updated (Clean Enterprise B2B) |
| :--- | :--- | :--- |
| **Logos** | Cheesy "AI Sparkle" / Wand icons | Minimalist geometric `CF` square emblem and clean wordmark |
| **Colors** | Saturated purple/indigo gradients | Monochromatic neutral palette (`neutral-900`, `neutral-100`, `neutral-200`) |
| **Subheaders** | Pill-shaped gradient badge ("✨ Next-Generation Engine") | Clean semantic text hierarchy without decorative pills |
| **Hover Effects** | Bouncy hover scales and translate transforms | Flat, crisp state transitions without jitter |
| **Layout** | Flashy card shadows | Flat, border-delimited (`border-neutral-200`) enterprise layout |

---

## 4. Architecture & Service Boundaries

```
[ Next.js 14 App Router (Client) ]
               │
               ▼
   [ Express API Gateway ] ─── Helmet, CORS, Global Rate Limit
               │
   ┌───────────┼───────────┬──────────────┬──────────────┐
   ▼           ▼           ▼              ▼              ▼
[Auth]      [Chat]      [Resume]      [Booking]      [Payment]
  │           │           │              │              │
[User DB]  [Gemini]   [ATS HTML]   [State Machine]  [Stripe]
  │        [Redis]    [Tiptap]           │              │
  └───────────┴───────────┴──────────────┴──────────────┘
                                         │
                                [Notification]
                                         │
                             ┌───────────┴───────────┐
                             ▼                       ▼
                     [Google Meet]             [Nodemailer]
```

### Module Responsibilities:
- **`auth/`**: User registration, login, JWT token issuance, refresh token rotation, bcrypt hashing, and role checks (`USER`, `ADMIN`, `CONSULTANT`).
- **`chat/`**: Chat sessions, persistent message history, Gemini 3.8 Flash model invocation with SSE streaming.
- **`resume/`**: 8-section structured data parser, Tiptap JSON/HTML synchronization, version history snapshots, and dual ATS templates:
  - *Modern Professional*: Structured two-column design.
  - *ATS Classic*: Single-column, pure semantic HTML without nested tables or graphic icons for 100% parser readability.
- **`booking/`**: Validates slot availability, prevents past-date reservations, and implements the state transition machine:
  $$\text{PENDING\_PAYMENT} \longrightarrow \text{PAID} \longrightarrow \text{CONFIRMED} \longrightarrow \text{COMPLETED}$$
- **`payment/`**: Creates Stripe Checkout sessions and processes `checkout.session.completed` events idempotently.
- **`notification/`**: Dispatches Google Calendar events and Nodemailer confirmation emails upon payment verification.
- **`dashboard/`**: Single-query `$facet` aggregation pipeline with Redis 300s TTL cache.

---

## 5. Free Cloud Services Setup

### 1. MongoDB Atlas
1. Create a free **M0 Cluster** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Set Network Access to `0.0.0.0/0` (Allow from Anywhere).
3. Copy connection string to `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/careerforge?retryWrites=true&w=majority
   ```

### 2. Upstash Redis (Free Cloud Redis)
1. Create a free database at [upstash.com](https://upstash.com).
2. Copy the standard Redis URI to `server/.env`:
   ```env
   REDIS_URL=rediss://default:...@...upstash.io:6379
   ```

### 3. Google Gemini API
1. Get key at [aistudio.google.com](https://aistudio.google.com/).
2. Set in `server/.env`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
3. Use model: `gemini-3.8-flash`.

### 4. Stripe (Test Mode)
1. Enable **Test Mode** on [stripe.com](https://stripe.com).
2. Obtain `pk_test_...` (for client) and `sk_test_...` (for server).
3. For local webhooks, run:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   Paste the returned `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

---

## 6. How to Run

### Option 1: Docker Compose
```bash
docker compose up --build
```

### Option 2: Local Development
**Backend**:
```bash
cd server
npm run dev
```

**Frontend**:
```bash
cd client
npm run dev
```

---

## 7. Verification Checklist

- [x] TypeScript backend compiles with zero errors (`npm run build` in `server`).
- [x] Next.js frontend compiles all 13 routes with zero errors (`npm run build` in `client`).
- [x] Gemini connection verified with HTTP 200 on `gemini-3.8-flash`.
- [x] Clean enterprise UI without AI logos, gradients, or pill subheaders.
- [x] Stripe idempotent webhook and raw-body handling verified.
- [x] Swagger docs available at `/api/docs`.
