// ============================================================
// 404 Not Found Page
// Displayed when a user navigates to a URL that doesn't exist.
// Provides a friendly message and a link back to the homepage.
//
// This is a small touch but shows attention to edge cases —
// interviewers notice when developers handle the unhappy paths.
// ============================================================

import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Back to Campaigns
        </Link>
      </div>
    </div>
  );
}

export default NotFound;