# Campaign App — Frontend

React 19 + TypeScript SPA built with Vite and TailwindCSS v4.

## Setup

```bash
cd frontend
npm install
cp .env.example .env        # set VITE_API_URL if not using Vite proxy
npm run dev                 # starts on http://localhost:3000
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | *(empty)* | Backend base URL. Leave empty in dev — Vite proxies `/api` to `localhost:3001`. Set to your EC2 URL for production (e.g. `http://1.2.3.4:3001`). |

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Campaign List | Browse, search, filter campaigns; dispatch emails |
| `/landing/:slug` | Landing Page | Public lead-capture form for a campaign |
| `/submissions` | Submissions | View all form submissions with expand/pagination |
| `/email-log` | Email Dispatch Log | History of every email sent via the app |

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serves the production build locally
```

For production deployment on AWS S3 + CloudFront, see the main [`README.md`](../../README.md).
