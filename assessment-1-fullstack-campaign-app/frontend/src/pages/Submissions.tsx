// ============================================================
// Submissions Dashboard
// Displays all form submissions in a table format.
// Includes a "Download CSV" button that triggers the backend
// export endpoint to download a file.
//
// Features:
//   - Shows name, email, company, campaign, and date for each entry
//   - Sorted by newest first (handled by the backend)
//   - CSV export for sharing with non-technical team members
//   - Pagination to handle large numbers of submissions
// ============================================================

import { useState, useEffect } from 'react';
import { Submission } from '../types';

// Number of submissions to show per page
const PAGE_SIZE = 10;

function Submissions() {
    // ── State ─────────────────────────────────────────────────
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Pagination — tracks which page the user is on
    const [currentPage, setCurrentPage] = useState<number>(1);

    // ── Fetch submissions on page load ────────────────────────
    useEffect(() => {
        fetchSubmissions();
    }, []);

    async function fetchSubmissions(): Promise<void> {
        try {
            setLoading(true);

            const response = await fetch('/api/submissions');

            if (!response.ok) {
                throw new Error('Failed to fetch submissions');
            }

            const data: Submission[] = await response.json();
            setSubmissions(data);
        } catch (err) {
            setError('Unable to load submissions. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ── CSV download handler ──────────────────────────────────
    function handleDownloadCSV(): void {
        // This triggers the browser to download the file
        // The backend sets Content-Disposition: attachment header
        // so the browser knows to save it instead of displaying it
        window.location.href = '/api/submissions/export';
    }

    // ── Pagination logic ──────────────────────────────────────
    const totalPages = Math.ceil(submissions.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedSubmissions = submissions.slice(startIndex, startIndex + PAGE_SIZE);

    // ── Render ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading submissions...</p>
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
        <div className="min-h-screen bg-gray-50">
            {/* Page header */}
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Submissions Dashboard</h2>
                <button
                    onClick={handleDownloadCSV}
                    disabled={submissions.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                    Download CSV
                </button>
            </div>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Empty state */}
                {submissions.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-10 text-center">
                        <p className="text-gray-500 text-lg">No submissions yet.</p>
                        <p className="text-gray-400 mt-2">
                            Submissions will appear here once someone fills in a landing page form.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Submissions table */}
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                            Company
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                            Campaign
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-800">
                                                {sub.first_name} {sub.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {sub.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {sub.company}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {sub.campaign_name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(sub.submitted_at).toLocaleDateString('en-IE', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination controls — only shown if there's more than one page */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-6">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 text-sm"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-40 text-sm"
                                >
                                    Next
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