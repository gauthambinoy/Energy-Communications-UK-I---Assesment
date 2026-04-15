// ============================================================
// API Base URL Helper
// In development (npm run dev) this is an empty string — Vite's
// dev server proxy forwards /api/* to localhost:3001 automatically.
//
// In production (deployed on Vercel) set the environment variable:
//   VITE_API_URL=https://your-backend.onrender.com
// Vite bakes the value into the bundle at build time via import.meta.env.
// ============================================================

const API_BASE = (import.meta.env.VITE_API_URL as string) ?? '';

export default API_BASE;
