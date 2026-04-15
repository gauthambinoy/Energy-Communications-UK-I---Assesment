# Campaign Email Dispatch & Lead Capture App

A full-stack web application that lets marketing teams dispatch campaign emails and capture leads through dedicated landing pages. Built with React, Node.js, TypeScript, and SQLite.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Node.js, Express.js, TypeScript |
| Database | SQLite (via `better-sqlite3`) |
| Frontend | React 19, TypeScript, Vite, TailwindCSS, React Router v7 |
| Email | Nodemailer + Ethereal Email (test SMTP — no real emails sent) |
| Security | `express-rate-limit`, HTML input sanitisation |

---

## Local Setup

### Prerequisites

- Node.js v18 or higher
- npm

### Step 1 — Start the backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at **http://localhost:3001**

On first run the server will automatically:
- Create the SQLite database file (`campaigns.db`)
- Create all three tables (`campaigns`, `events`, `submissions`)
- Seed 5 campaigns and 5 events from `seed_campaigns.json`

### Step 2 — Start the frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## How to verify emails are sending

When you send a campaign email, the backend logs a preview URL to the console:

```
Email sent! Preview URL: https://ethereal.email/message/AbCdEf...
```

Open that URL in your browser to see the full HTML email — including the CTA button linking to the landing page. No real email account is needed.

---

## Application Pages

| URL | Page | Description |
|-----|------|-------------|
| `/` | Campaign List | View all campaigns, send emails inline |
| `/landing/:slug` | Landing Page | Lead capture form (for email recipients) |
| `/submissions` | Submissions Dashboard | View all leads, download CSV |
| `*` | 404 Not Found | Catch-all for unknown URLs |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Returns all campaigns, sorted by date |
| GET | `/api/campaigns/:id` | Returns one campaign with its events |
| POST | `/api/campaigns/:id/send` | Sends a campaign email via Ethereal |
| POST | `/api/landing/:slug/submit` | Saves a landing page form submission |
| GET | `/api/submissions` | Returns all submissions with campaign name |
| GET | `/api/submissions/export` | Downloads all submissions as a CSV file |
| GET | `/api/health` | Health check |

**POST `/api/campaigns/:id/send`**
```json
// Request
{ "recipientEmail": "someone@example.com" }

// Response
{ "message": "Email sent successfully", "previewUrl": "https://ethereal.email/..." }
```

**POST `/api/landing/:slug/submit`**
```json
// Request
{ "firstName": "Jane", "lastName": "Smith", "email": "jane@company.com", "company": "Acme Ltd" }

// Response (201)
{ "message": "Submission received — thank you!" }
```

---

## Database Schema

Three tables are created automatically on startup:

```sql
campaigns   — id, name, slug, description, email_subject, cta_text,
              status, platform, budget_usd, created_at

events      — id, campaign_id (→ campaigns), name, event_date,
              location, capacity, description

submissions — id, campaign_id (→ campaigns), first_name, last_name,
              email, company, submitted_at
```

Foreign key constraints are enforced with `PRAGMA foreign_keys = ON`.

---

## End-to-End Flow

```
1. Open http://localhost:3000
2. Click "Send Email" on any campaign → enter a recipient email → Send
3. Check the backend console for the Ethereal preview URL
4. Open the URL → verify the email HTML and CTA link
5. Click the CTA link (or go to /landing/:slug directly)
6. Fill in the lead capture form → Submit
7. Open /submissions → the new lead appears in the table
8. Click "Download CSV" → file downloads with all submission data
```

---

## Project Structure

```
backend/
  src/
    index.ts          ← Express server, middleware, route mounting
    database.ts       ← SQLite setup, table creation, seed logic
    types.ts          ← Shared TypeScript interfaces
    utils.ts          ← isValidEmail, isBlank, formatDate helpers
    routes/
      campaigns.ts    ← GET /api/campaigns, GET /api/campaigns/:id
      landing.ts      ← POST /api/campaigns/:id/send, POST /api/landing/:slug/submit
      submissions.ts  ← GET /api/submissions, GET /api/submissions/export
    services/
      email.ts        ← Nodemailer + Ethereal transporter and HTML template

frontend/
  src/
    App.tsx           ← React Router setup, conditional Navbar
    types.ts          ← Frontend TypeScript interfaces (mirrors backend)
    components/
      Navbar.tsx      ← Shared navigation with active link highlighting
    pages/
      CampaignList.tsx   ← Campaign cards, inline email send form
      LandingPage.tsx    ← Lead capture form, thank-you screen
      Submissions.tsx    ← Submissions table, pagination, CSV download
      NotFound.tsx       ← 404 page
```

---

## Design Decisions

- **SQLite seeding on startup** — The database is created and seeded automatically when the server starts (`database.ts`). This means reviewers can `npm run dev` and immediately see data — no manual SQL imports, no migration CLI, no Docker dependency. If the database already exists, seeding is skipped. For a demo-scoped assessment this is simpler and more reliable than a separate migration tool.

- **Ethereal for email testing** — Nodemailer's Ethereal service generates a throwaway SMTP account on first use. Emails aren't delivered to real inboxes — instead you get a preview URL to inspect the full HTML. This means the assessment can demonstrate real email dispatch without requiring API keys, signup, or risking spam delivery.

- **Rate limiting placement** — The `express-rate-limit` middleware for the email send endpoint is registered *before* the route handler in `index.ts` (line `app.use('/api/campaigns/:id/send', emailRateLimit)`). Express processes middleware top-to-bottom, so if the limiter ran after the route, requests would already be handled. Placing it first ensures every send request is checked against the 10-per-IP-per-15-minute cap before any SMTP work happens.

- **Separation of concerns** — Routes, services, types, and utilities each have their own module. Route files only deal with HTTP — no business logic mixed in.

- **Single source of truth for types** — All TypeScript interfaces are defined once in `types.ts` and imported where needed. No local redefinitions anywhere.

- **Server-side validation** — Every endpoint validates all inputs before touching the database. Missing fields, malformed emails, and invalid IDs return clear 400 errors.

- **Input sanitisation** — Text fields are stripped of HTML tags before saving (`/<[^>]*>/g`). This prevents stored XSS if data is ever rendered back in a browser context.

- **Rate limiting** — `POST /api/campaigns/:id/send` is capped at 10 requests per IP per 15 minutes via `express-rate-limit`. The limiter is registered *before* the route handler so it runs on every request.

- **Foreign key enforcement** — SQLite ignores foreign key constraints by default. `PRAGMA foreign_keys = ON` is set explicitly so referential integrity is always enforced.

- **Reusable utilities** — `isValidEmail`, `isBlank`, and `formatDate` live in `utils.ts` and are shared across routes and services rather than duplicated.

- **Vite proxy** — The frontend proxies `/api` requests to `localhost:3001`. No hardcoded backend URLs anywhere in the frontend code.

- **Conditional Navbar** — The Navbar is hidden on `/landing/*` routes. Landing pages are public-facing (opened by email recipients) and should not expose internal app navigation.