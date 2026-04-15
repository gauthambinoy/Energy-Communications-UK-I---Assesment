// ============================================================
// Email Dispatch Log Page
// Shows every campaign email that has been sent through the system.
// Each row records: campaign name, recipient address, when it was
// sent (as a relative timestamp), and a link to the Ethereal preview.
//
// This page is useful for QA, demos, and audit purposes.
// It demonstrates the full end-to-end flow of the application.
// ============================================================

import { useState, useEffect } from 'react';
import { EmailLog } from '../types';
import API_BASE from '../api';

// Formats a stored ISO timestamp as a human-readable relative label.
// e.g. "2 minutes ago", "3 hours ago", "yesterday"
// Falls back gracefully for very old records ("30 days ago").
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

function EmailLogPage() {
    // ── State ─────────────────────────────────────────────────
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // ── Fetch on mount ────────────────────────────────────────
    useEffect(() => {
        document.title = 'Email Log | Campaign Manager';
        fetchLogs();
    }, []);

    async function fetchLogs(): Promise<void> {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/api/email-logs`);
            if (!response.ok) throw new Error('Failed to fetch email logs');
            const data: EmailLog[] = await response.json();
            setLogs(data);
        } catch (err) {
            setError('Unable to load email logs. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ── Render ────────────────────────────────────────────────

    // Skeleton loading — matches the shape of the real table rows
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-52 mb-8 animate-pulse" />
                    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 overflow-hidden">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="flex gap-6 px-6 py-4 border-b dark:border-gray-800 animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto" />
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                            </div>
                        ))}
                    </div>
                </div>
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
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Page header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Email Dispatch Log
                    </h2>
                    <span className="text-sm text-gray-400">
                        {logs.length} {logs.length === 1 ? 'dispatch' : 'dispatches'}
                    </span>
                </div>

                {/* Empty state — shown when no emails have been sent yet */}
                {logs.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-800 p-16 text-center">
                        {/* Simple inline SVG envelope illustration */}
                        <svg
                            className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                            width="64"
                            height="64"
                            viewBox="0 0 64 64"
                            fill="none"
                            aria-hidden="true"
                        >
                            <rect x="8" y="14" width="48" height="36" rx="4" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 22l24 15 24-15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No emails sent yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Use the "Send Email" button on a campaign to dispatch your first email.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Campaign
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Recipient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Sent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Preview
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {log.campaign_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {log.recipient_email}
                                        </td>
                                        {/* title gives the exact timestamp on hover */}
                                        <td
                                            className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500"
                                            title={new Date(log.sent_at).toLocaleString('en-GB')}
                                        >
                                            {relativeTime(log.sent_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <a
                                                href={log.preview_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                View →
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmailLogPage;
