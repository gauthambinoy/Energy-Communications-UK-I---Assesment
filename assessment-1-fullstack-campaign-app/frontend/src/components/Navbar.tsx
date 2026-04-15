// ============================================================
// Navbar Component
// Shared navigation bar used across all internal pages.
// Shows the app name, nav links, and a dark mode toggle.
//
// Active link detection: uses useLocation() to compare the
// current path — active links get a blue underline indicator
// with a smooth CSS transition.
//
// Dark mode: stored in localStorage so it persists between
// sessions. Toggling adds/removes the "dark" class on <html>.
// ============================================================

import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar() {
    const location = useLocation();

    // Initialise dark mode from localStorage so the preference survives refreshes
    const [isDark, setIsDark] = useState<boolean>(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    // Sync the "dark" class on <html> whenever isDark changes
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('darkMode', String(isDark));
    }, [isDark]);

    function isActive(path: string): boolean {
        return location.pathname === path;
    }

    return (
        <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-30">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

                {/* Brand mark */}
                <Link to="/" className="flex items-center gap-2">
                    <span className="text-2xl">📧</span>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        Campaign Manager
                    </h1>
                </Link>

                <div className="flex items-center gap-6">
                    {/* Navigation links */}
                    <nav className="flex gap-6">
                        <Link
                            to="/"
                            className={`
                                relative text-sm font-medium transition-colors pb-1
                                after:absolute after:bottom-0 after:left-0 after:h-0.5
                                after:bg-blue-600 after:transition-all after:duration-200
                                ${isActive('/')
                                    ? 'text-blue-600 dark:text-blue-400 after:w-full'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 after:w-0'
                                }
                            `}
                        >
                            Campaigns
                        </Link>
                        <Link
                            to="/submissions"
                            className={`
                                relative text-sm font-medium transition-colors pb-1
                                after:absolute after:bottom-0 after:left-0 after:h-0.5
                                after:bg-blue-600 after:transition-all after:duration-200
                                ${isActive('/submissions')
                                    ? 'text-blue-600 dark:text-blue-400 after:w-full'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 after:w-0'
                                }
                            `}
                        >
                            Submissions
                        </Link>
                        <Link
                            to="/email-log"
                            className={`
                                relative text-sm font-medium transition-colors pb-1
                                after:absolute after:bottom-0 after:left-0 after:h-0.5
                                after:bg-blue-600 after:transition-all after:duration-200
                                ${isActive('/email-log')
                                    ? 'text-blue-600 dark:text-blue-400 after:w-full'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 after:w-0'
                                }
                            `}
                        >
                            Email Log
                        </Link>
                    </nav>

                    {/* Dark mode toggle button */}
                    <button
                        onClick={() => setIsDark((d) => !d)}
                        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="text-xl leading-none text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 transition-colors"
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Navbar;