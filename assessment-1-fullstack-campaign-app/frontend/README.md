# Campaign App — Frontend

React 19 + TypeScript SPA built with Vite and TailwindCSS v4.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The dev server starts at <http://localhost:3000>.

## Environment Variables

- `VITE_API_URL`: Optional backend base URL.
  Leave it empty in development because Vite proxies `/api` to the backend automatically.
  Set it to your deployed backend URL in production.

## Routes

- `/`: Campaign list page for browsing, filtering, and dispatching emails
- `/landing/:slug`: Public landing page for one campaign
- `/submissions`: Submissions dashboard with expand and pagination behavior
- `/email-log`: Email dispatch history page

## Build

```bash
npm run build     # outputs to dist/
npm run preview   # serves the production build locally
```

For production deployment on AWS S3 + CloudFront, see the main [`README.md`](../../README.md).
