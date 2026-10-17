# CareerForge AI

CareerForge AI is an all-in-one career acceleration platform that connects ambitious job seekers with AI-driven resume optimization, real-time interview advisory, and direct 1-on-1 mentorship with experienced industry consultants.

---

## User Portals & Features

### 1. Candidate Experience
- **Interactive Resume Studio**: Create, edit, and export professional resumes with real-time autosave.
- **Dual Template Engine**:
  - **Modern Professional**: Designed for executive recruiters with SVG contact icons, color-coded skill pills, and modern typography.
  - **ATS Classic**: Strict 100% monochrome, single-column layout with standard serif typography engineered for legacy Applicant Tracking Systems (Taleo, Workday, Greenhouse).
- **AI Career Advisor**: Live conversational career coaching with real-time Server-Sent Events (SSE) streaming for interview preparation and resume feedback.
- **1-on-1 Mentorship Booking**: Browse verified career mentors, select flexible session windows (including standard hour and half-hour start options like 10:30 AM within 10-11 AM, and 3:00 to 4:00 PM), complete secure Stripe Checkout, and receive instant Google Meet video invitations.

### 2. Consultant Workspace
- **Rate & Profile Management**: Set your hourly consultation rate ($/hr), edit your professional specialty, and update your coaching bio.
- **Availability & Slot Scheduling**: Customize your active days (Monday through Sunday) and add or remove consultation time ranges (e.g. 09:00 AM - 10:00 AM, 03:00 PM - 04:00 PM).
- **Session Management**: Review upcoming candidate appointments with candidate details, session agendas, and direct Google Meet room links. Strict isolation ensures consultants only view appointments booked with their profile.

### 3. Administrator Command Center
- **Platform Analytics**: Monitor active resumes, scheduled sessions, completed consultations, and gross revenue.
- **System-Wide Bookings**: Comprehensive table of all consultation appointments across candidates and mentors.
- **User Management**: View all platform users and reassign roles (`USER`, `CONSULTANT`, or `ADMIN`) dynamically. Public registration strictly disallows selecting the Admin role.

---

## Demo Accounts & Test Credentials

The platform includes pre-configured accounts for each role so every user journey can be tested immediately:

| Role | Name | Email / ID | Password | Portal View |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Administrator** | Platform Administrator | `admin@careerforge.ai` | `Admin@123456` | **Admin Command Center**: Platform analytics, user role management, system bookings. |
| **Career Consultant** | Sarah Jenkins | `sarah.jenkins@careerforge.ai` | `Consultant@123` | **Consultant Workspace**: Manage $/hr, configure availability slots, view candidate bookings. |
| **Career Consultant** | David Chen | `david.chen@careerforge.ai` | `Consultant@123` | **Consultant Workspace**: Secondary consultant demonstrating strict role and booking isolation. |
| **Candidate / Job Seeker** | Alex Morgan | `candidate@careerforge.ai` | `Candidate@123` | **Candidate Dashboard**: Build & edit resumes, AI advisory chat, book mentor sessions. |

### Database Seeding Command
To populate or reset all demo accounts and sample candidate resumes at any time:

```bash
cd server
npm run seed
```

To update or seed only the platform administrator:

```bash
cd server
npm run seed:admin
```

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ or 20+
- MongoDB Atlas database
- Redis instance (Upstash Redis or local)

### 1. Environment Configuration

**Backend (`server/.env`)**:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/careerforge?retryWrites=true&w=majority
REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379

JWT_ACCESS_SECRET=your_jwt_access_secret_32_characters
JWT_REFRESH_SECRET=your_jwt_refresh_secret_32_characters
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
EMAIL_FROM=CareerForge AI <no-reply@careerforge.ai>

GOOGLE_CALENDAR_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALENDAR_REFRESH_TOKEN=1//...
```

**Frontend (`client/.env`)**:
```env
Server_API_URL=http://localhost:5000
```
*(Automatically falls back to `http://localhost:5000` if omitted).*

---

### 2. Starting the Application

**Run the Backend Server**:
```bash
cd server
npm install
npm run dev
```
The server starts on `http://localhost:5000`. Swagger API documentation is accessible at `http://localhost:5000/api/docs`.

**Run the Frontend Application**:
```bash
cd client
npm install
npm run dev
```
The client application starts on `http://localhost:3000`.

---

### 3. Running Automated Tests

```bash
cd server
npm test
```
Executes the full test suite covering Authentication, Token Refresh Rotation, AI Advisory Streaming, Resume Engine, Consultation Slot Validation, and Payment Confirmation.

---

## License
MIT