// ============================================================
// App Component — Root of the Frontend
// Sets up client-side routing between all pages.
// Applies the persisted dark mode class on initial render.
// Includes a catch-all 404 route for unknown URLs.
//
// Routes:
//   /                  → Campaign List (homepage)
//   /landing/:slug     → Landing Page (from email link)
//   /submissions       → Submissions Dashboard
//   /email-log         → Email Dispatch Log
//   *                  → 404 Not Found (catch-all)
// ============================================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CampaignList from './pages/CampaignList';
import LandingPage from './pages/LandingPage';
import Submissions from './pages/Submissions';
import EmailLogPage from './pages/EmailLog';
import NotFound from './pages/NotFound';

// Wrapper that conditionally shows the Navbar and defines all routes.
// We hide the Navbar on landing pages because those are public-facing
// and shouldn't expose internal navigation to email recipients.
function AppLayout() {
    const location = useLocation();

    // Apply dark mode class from localStorage on first render.
    // This runs in the layout component (not main.tsx) so it has access
    // to the DOM. A brief flash is acceptable for a dev/assessment context.
    useEffect(() => {
        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const isLandingPage = location.pathname.startsWith('/landing');

    return (
        <>
            {!isLandingPage && <Navbar />}
            <Routes>
                <Route path="/"             element={<CampaignList />} />
                <Route path="/landing/:slug" element={<LandingPage />} />
                <Route path="/submissions"  element={<Submissions />} />
                <Route path="/email-log"    element={<EmailLogPage />} />
                {/* Catch-all — any unknown URL shows the 404 page */}
                <Route path="*"             element={<NotFound />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

export default App;