// ============================================================
// Submissions Dashboard
// Displays all form submissions in a paginated table.
// Clicking a row expands it to reveal the full submission details.
//
// Features:
//   - Skeleton loading animation while data loads
//   - SVG empty state illustration when no submissions exist
//   - Row click to expand / collapse full details
//   - Relative timestamps ("2 minutes ago") with exact time on hover
//   - Numbered pagination (1 2 3 … N) instead of plain Prev/Next
//   - CSV export button
// ============================================================

import { useState, useEffect } from 'react';
import { Submission } from '../types';
import API_BASE from '../api';

// Number of submissions visible per page
const PAGE_SIZE = 10;

// Formats an ISO timestamp as a short relative label using the
// built-in Intl.RelativeTimeFormat API (no external library needed).
// e.g. "2 minutes ago", "3 hours ago", "yesterday"
function relativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    const seconds = Math.round(diff / 1000);
    if (seconds < 60) return rtf.format(-seconds, 'second');

    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return rtf.format(-minutes, 'minute');

    const hours = Math.round(minutes / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');

    const days = Math.round(hours / 24);
    return rtf.format(-days, 'day');
}

// Builds the array of page numbers to display in the pagination bar.
// Shows at most 7 numbers; uses -1 as a sentinel value for "…" ellipsis.
// Examples:
//   5 pages  → [1, 2, 3, 4, 5]
//   10 pages, page 1  → [1, 2, 3, 4, 5, -1, 10]
//   10 pages, page 5  → [1, -1, 4, 5, 6, -1, 10]
//   10 pages, page 10 → [1, -1, 6, 7, 8, 9, 10]
function buildPageNumbers(current: number, total: number): number[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];

    const windowStart = Math.max(2, current - 1);
    const windowEnd   = Math.min(total - 1, current + 1);

    if (windowStart > 2) pages.push(-1);  // leading ellipsis

    for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

    if (windowEnd < total - 1) pages.push(-1);  // trailing ellipsis

    pages.push(total);
    return pages;
}

function Submissions() {
    // ── State ─────────────────────────────────────────────────
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Which submission row is currently expanded (null = none)
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Pagination — 1-indexed
    const [currentPage, setCurrentPage] = useState<number>(1);

    // ── Page title ────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Submissions | Campaign Manager';
        fetchSubmissions();
    }, []);

    // ── Fetch submissions on mount ────────────────────────────
    async function fetchSubmissions(): Promise<void> {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/submissions`);
            if (!response.ok) throw new Error('Failed to fetch submissions');
            const data: Submission[] = await response.json();
            setSubmissions(data);
        } catch (err) {
            setError('Unable to load submissions. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ── CSV download ──────────────────────────────────────────
    function handleDownloadCSV(): void {
        // Setting window.location triggers the browser's file download.
        // The backend sets Content-Disposition: attachment so the browser
        // saves it rather than navigating to the URL.
        window.location.href = `${API_BASE}/api/submissions/export`;
    }

    // ── Pagination derived values ────────────────────────────
    const totalPages   = Math.ceil(submissions.length / PAGE_SIZE);
    const startIndex   = (currentPage - 1) * PAGE_SIZE;
    const pageItems    = submissions.slice(startIndex, startIndex + PAGE_SIZE);
    const pageNumbers  = buildPageNumbers(currentPage, totalPages);

    // ── Render ────────────────────────────────────────────────

    // Skeleton loading — pulse rows while data loads
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-56 animate-pulse" />
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                </div>
                <main className="max-w-6xl mx-auto px-6 py-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 overflow-hidden">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <div key={n} className="grid grid-cols-5 gap-4 px-6 py-4 border-b dark:border-gray-800 animate-pulse">
                                {[1, 2, 3, 4, 5].map((col) => (
                                    <div key={col} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                ))}
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* Page header */}
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    Submissions Dashboard
                </h2>
                <button
                    onClick={handleDownloadCSV}
                    disabled={submissions.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                    Download CSV
                </button>
            </div>

            <main className="max-w-6xl mx-auto px-6 pb-8">

                {/* Empty state with SVG illustration */}
                {submissions.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-16 text-center">
                        {/* Inline SVG clipboard-style illustration */}
                        <svg
                            className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                            width="64"
                            height="64"
                            viewBox="0 0 64 64"
                            fill="none"
                            aria-hidden="true"
                        >
                            <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
                            <path d="M22 20h20M22 30h20M22 40h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                            No submissions yet
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Submissions appear here once someone fills in a landing page form.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Submissions table */}
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Campaign</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {pageItems.map((sub) => (
                                        <>
                                            {/* Main row — click to expand/collapse details */}
                                            <tr
                                                key={sub.id}
                                                onClick={() =>
                                                    setExpandedId(expandedId === sub.id ? null : sub.id)
                                                }
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors select-none"
                                                aria-expanded={expandedId === sub.id}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    {sub.first_name} {sub.last_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {sub.email}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {sub.company}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {sub.campaign_name}
                                                </td>
                                                {/* title gives the exact timestamp on hover */}
                                                <td
                                                    className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500"
                                                    title={new Date(sub.submitted_at).toLocaleString('en-GB')}
                                                >
                                                    {relativeTime(sub.submitted_at)}
                                                </td>
                                            </tr>

                                            {/* Expanded detail row — only mounted when this row is open */}
                                            {expandedId === sub.id && (
                                                <tr key={`${sub.id}-expanded`} className="bg-blue-50 dark:bg-blue-900/10">
                                                    <td colSpan={5} className="px-6 py-4">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Full Name</p>
                                                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                                                    {sub.first_name} {sub.last_name}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
                                                                <p className="text-gray-700 dark:text-gray-300">{sub.email}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Company</p>
                                                                <p className="text-gray-700 dark:text-gray-300">{sub.company}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Campaign</p>
                                                                <p className="text-gray-700 dark:text-gray-300">{sub.campaign_name}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Submission ID</p>
                                                                <p className="text-gray-700 dark:text-gray-300">#{sub.id}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Exact Time</p>
                                                                <p className="text-gray-700 dark:text-gray-300">
                                                                    {new Date(sub.submitted_at).toLocaleString('en-GB')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Numbered pagination bar */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-1 mt-6">
                                {/* Previous button */}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-300 disabled:opacity-40 transition-colors"
                                >
                                    ‹
                                </button>

                                {/* Page number buttons — -1 renders as "…" */}
                                {pageNumbers.map((page, idx) =>
                                    page === -1 ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-3 py-2 text-sm text-gray-400"
                                        >
                                            …
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                                                page === currentPage
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                {/* Next button */}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700 dark:text-gray-300 disabled:opacity-40 transition-colors"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default Submissions;
