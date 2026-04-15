// ============================================================
// App Component — Root of the Frontend
// Sets up client-side routing between all pages.
// Includes a catch-all 404 route for unknown URLs.
//
// Routes:
//   /                  → Campaign List (homepage)
//   /landing/:slug     → Landing Page (from email link)
//   /submissions       → Submissions Dashboard
//   *                  → 404 Not Found (catch-all)
// ============================================================

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CampaignList from './pages/CampaignList';
import LandingPage from './pages/LandingPage';
import Submissions from './pages/Submissions';
import NotFound from './pages/NotFound';

// Wrapper that conditionally shows the Navbar
// We hide it on landing pages because those are public-facing
// and shouldn't show internal navigation
function AppLayout() {
  const location = useLocation();

  // Don't show navbar on landing pages (those are for external recipients)
  const isLandingPage = location.pathname.startsWith('/landing');

  return (
    <>
      {!isLandingPage && <Navbar />}
      <Routes>
        <Route path="/" element={<CampaignList />} />
        <Route path="/landing/:slug" element={<LandingPage />} />
        <Route path="/submissions" element={<Submissions />} />
        {/* Catch-all route — any unknown URL shows the 404 page */}
        <Route path="*" element={<NotFound />} />
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