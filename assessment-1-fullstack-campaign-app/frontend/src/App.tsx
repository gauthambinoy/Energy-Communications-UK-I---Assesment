// ============================================================
// App Component — Root of the Frontend
// Sets up client-side routing between the three pages:
//   /                  → Campaign List (homepage)
//   /landing/:slug     → Landing Page (from email link)
//   /submissions       → Submissions Dashboard
//
// React Router handles navigation without full page reloads,
// making the app feel fast and smooth like a native application.
// ============================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CampaignList from './pages/CampaignList';
import LandingPage from './pages/LandingPage';
import Submissions from './pages/Submissions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Homepage — shows all campaigns with send email buttons */}
        <Route path="/" element={<CampaignList />} />

        {/* Landing page — the page recipients see after clicking the email link */}
        {/* :slug is a dynamic parameter, e.g. /landing/summer-brand-awareness */}
        <Route path="/landing/:slug" element={<LandingPage />} />

        {/* Dashboard — view all submissions and export as CSV */}
        <Route path="/submissions" element={<Submissions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;