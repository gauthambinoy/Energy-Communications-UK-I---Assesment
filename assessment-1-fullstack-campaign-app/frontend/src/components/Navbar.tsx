// ============================================================
// Navbar Component
// Shared navigation bar used across all pages.
// Shows the app name and links to main sections.
// Highlights the currently active page for better UX.
//
// Reusable component — imported by every page so we don't
// duplicate navigation code across the app.
// ============================================================

import { Link, useLocation } from 'react-router-dom';

function Navbar() {
    const location = useLocation();

    function isActive(path: string): boolean {
        return location.pathname === path;
    }

    return (
        <header className="bg-white shadow-sm border-b sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl">📧</span>
                    <h1 className="text-xl font-bold text-gray-800">Campaign Manager</h1>
                </Link>

                <nav className="flex gap-6">
                    <Link
                        to="/"
                        className={`text-sm font-medium transition-colors ${isActive('/')
                                ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Campaigns
                    </Link>
                    <Link
                        to="/submissions"
                        className={`text-sm font-medium transition-colors ${isActive('/submissions')
                                ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        Submissions
                    </Link>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;