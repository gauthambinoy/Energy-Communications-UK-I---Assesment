# Assessment 1 — Full Stack Campaign App

A full-stack Campaign Email Dispatch & Lead Capture application built with React, Node.js, TypeScript, and SQLite.

## Tech Stack

- **Backend:** Node.js, Express.js, TypeScript, SQLite (better-sqlite3), Nodemailer
- **Frontend:** React, TypeScript, Vite, TailwindCSS, React Router
- **Email:** Ethereal Email (test SMTP — no real emails sent)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev
```

The server starts at `http://localhost:3001`. On first run, it automatically creates the SQLite database and seeds it with campaign and event data from `seed_campaigns.json`.

The Ethereal email preview URL is logged to the console each time an email is sent.

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | Returns all campaigns |
| GET | `/api/campaigns/:id` | Returns a single campaign with its events |
| POST | `/api/campaigns/:id/send` | Sends a campaign email to a recipient |
| POST | `/api/landing/:slug/submit` | Handles landing page form submission |
| GET | `/api/submissions` | Returns all submissions with campaign name |
| GET | `/api/submissions/export` | Downloads all submissions as CSV |
| GET | `/api/health` | Health check endpoint |

## Application Flow

1. User views campaigns on the homepage
2. User clicks "Send Email" and enters a recipient email address
3. Backend sends an HTML email via Ethereal with a CTA linking to the landing page
4. Recipient clicks the link and lands on `/landing/:slug`
5. Recipient fills in the lead capture form (First Name, Last Name, Email, Company)
6. Submission is saved to SQLite
7. All submissions are viewable on the `/submissions` dashboard
8. Submissions can be exported as CSV

## Database Schema

Three tables are created on startup:

- **campaigns** — seeded from `seed_campaigns.json` (5 campaigns)
- **events** — seeded from `seed_campaigns.json` (5 events, linked to campaigns)
- **submissions** — populated when users submit the landing page form

## Design Decisions

- **Separation of concerns:** Routes, services, types, and utilities are in separate files so each module has a single responsibility.
- **Input validation:** All endpoints validate incoming data before processing. Invalid campaign IDs, missing fields, and malformed emails are caught with descriptive error messages.
- **Reusable utilities:** Email validation, blank-check, and date formatting are extracted into `utils.ts` to avoid duplication across routes.
- **Ethereal Email:** Used as a test SMTP provider so emails can be verified without a real mail account. The preview URL is logged to the console on each send.
- **Proxy configuration:** Vite proxies `/api` requests to the backend during development, keeping frontend and backend decoupled while avoiding CORS issues.