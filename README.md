# Energy Communications UK — Assessment

Full-stack technical assessment covering two tasks: a campaign management web application and a Python data pipeline.

---

## Tasks

| Task | Folder | Description |
|------|--------|-------------|
| 1 — Full-Stack Campaign App | [`assessment-1-fullstack-campaign-app/`](./assessment-1-fullstack-campaign-app/) | React + Node.js app for managing marketing campaigns, dispatching emails, and capturing landing-page form submissions |
| 2 — Python Data Pipeline | [`assessment-2-python-data-pipeline/`](./assessment-2-python-data-pipeline/) | ETL pipeline that classifies and enriches LinkedIn raw-data CSV, producing aggregated analytics |

---

## Task 1 — Full-Stack Campaign App

**Tech stack:** React 19 · TypeScript · Vite · TailwindCSS v4 · React Router v7 · Node.js · Express 5 · SQLite (better-sqlite3) · Nodemailer (Ethereal)

**Key features:**
- Browse, search, and filter campaigns by status
- Dispatch test emails with live Ethereal preview links
- Campaign detail drawer with events, budget, and platform info
- Lead-capture landing pages with full form validation
- Email Dispatch Log tracking every send
- Dark mode, toast notifications, confirm modal, skeleton loading
- Rate limiting on email send (10/IP/15 min)

See [`assessment-1-fullstack-campaign-app/README.md`](./assessment-1-fullstack-campaign-app/README.md) for setup, API reference, and DB schema.

---

## Task 2 — Python Data Pipeline

**Tech stack:** Python 3 · pandas · scikit-learn

**Key features:**
- Ingests raw LinkedIn engagement CSV
- Classifies records, removes duplicates, and fills missing fields
- Outputs enriched dataset with aggregated engagement metrics

See [`assessment-2-python-data-pipeline/`](./assessment-2-python-data-pipeline/) for usage instructions.

---

## Repo Structure

```
assessment-1-fullstack-campaign-app/
  backend/    Express API + SQLite
  frontend/   React SPA
assessment-2-python-data-pipeline/
  pipeline.py
  linkedin_raw_data.csv
```
