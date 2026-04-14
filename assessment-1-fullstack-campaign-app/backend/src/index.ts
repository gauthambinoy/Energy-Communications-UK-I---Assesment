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

// Import route modules — each handles a specific group of endpoints
import campaignRoutes from './routes/campaigns';
import landingRoutes from './routes/landing';
import submissionRoutes from './routes/submissions';

const app = express();
const PORT = 3001;

// ── Middleware ─────────────────────────────────────────────────
// Middleware runs on EVERY request before it reaches your routes.

// cors() allows the frontend (port 3000) to talk to the backend (port 3001)
// Without this, the browser blocks cross-origin requests for security
app.use(cors());

// express.json() parses incoming JSON request bodies
// Without this, req.body would be undefined when the frontend sends data
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
// Each route module is mounted at a specific URL prefix.
// For example, campaignRoutes handles GET '/' which becomes GET '/api/campaigns'

app.use('/api/campaigns', campaignRoutes);
app.use('/api', landingRoutes);
app.use('/api/submissions', submissionRoutes);

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