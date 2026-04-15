// ============================================================
// Server Entry Point
// This is the main file that starts the Express server.
// It connects all the route modules and begins listening
// for incoming HTTP requests.
//
// To run: npx ts-node src/index.ts
// The server starts on port 3001 (frontend will run on 3000)
// ============================================================

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Import route modules — each handles a specific group of endpoints
import campaignRoutes from './routes/campaigns';
import landingRoutes from './routes/landing';
import submissionRoutes from './routes/submissions';
import emailLogRoutes from './routes/emailLogs';

// Limits the email send endpoint to 10 requests per IP per 15 minutes.
// Without this, anyone could spam the endpoint and hammer the SMTP server.
// This is a simple but important security measure.
const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 email sends per IP per window
    message: { error: 'Too many email requests. Please try again in 15 minutes.' },
    standardHeaders: true,     // send rate limit info in response headers
    legacyHeaders: false,
});

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// ── CORS ───────────────────────────────────────────────────────
// In development the Vite proxy handles CORS so any origin is fine.
// In production (Render) we restrict to the actual Vercel frontend URL
// via the ALLOWED_ORIGIN environment variable so no other origin can
// call the API from a browser.
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';

app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
}));

// ── Middleware ─────────────────────────────────────────────────
// Middleware runs on EVERY request before it reaches your routes.

// express.json() parses incoming JSON request bodies
// Without this, req.body would be undefined when the frontend sends data
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
// Each route module is mounted at a specific URL prefix.
// For example, campaignRoutes handles GET '/' which becomes GET '/api/campaigns'

// IMPORTANT: rate limiter must be registered BEFORE the route handler.
// Express processes middleware top-to-bottom — if we registered this after
// landingRoutes, the request would already be handled and this would never run.
app.use('/api/campaigns/:id/send', emailRateLimit);

app.use('/api/campaigns', campaignRoutes);
app.use('/api', landingRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/email-logs', emailLogRoutes);

// ── Health Check ──────────────────────────────────────────────
// A simple endpoint to verify the server is running.
// Useful for debugging and monitoring.
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`   Campaign API:    http://localhost:${PORT}/api/campaigns`);
    console.log(`   Submissions API: http://localhost:${PORT}/api/submissions`);
    console.log(`   Health check:    http://localhost:${PORT}/api/health\n`);
});