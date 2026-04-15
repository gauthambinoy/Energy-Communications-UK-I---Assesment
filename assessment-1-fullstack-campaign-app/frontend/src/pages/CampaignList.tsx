// ============================================================
// Campaign List Page (Homepage)
// Displays all marketing campaigns in a clean card layout.
// Each campaign shows its name, status, platform, budget,
// and scheduled events.
//
// Features:
//   - Live search by name or description
//   - Filter by campaign status (active / draft)
//   - Inline email dispatch form per campaign
//   - Clickable Ethereal preview link after sending
//   - Skeleton loading animation while data loads
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { Campaign, CampaignWithEvents } from '../types';

// Convert a raw ISO date string (YYYY-MM-DD) to a human-readable label.
// Appending T00:00:00 pins it to local midnight so the day never shifts
// due to UTC offset differences.
function formatEventDate(raw: string): string {
    return new Date(raw + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function CampaignList() {
    // ── Data state ────────────────────────────────────────────
    const [campaigns, setCampaigns] = useState<CampaignWithEvents[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // ── Filter state ──────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // ── Email form state ──────────────────────────────────────
    // activeEmailForm: which campaign's inline form is open (null = none)
    const [activeEmailForm, setActiveEmailForm] = useState<number | null>(null);
    const [recipientEmail, setRecipientEmail] = useState<string>('');
    const [sendStatus, setSendStatus] = useState<{
        type: 'success' | 'error';
        message: string;
        previewUrl?: string;
    } | null>(null);
    const [sending, setSending] = useState<boolean>(false);

    // ── Fetch campaigns on page load ──────────────────────────
    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns(): Promise<void> {
        try {
            setLoading(true);

            const response = await fetch('/api/campaigns');
            if (!response.ok) throw new Error('Failed to fetch campaigns');

            const data: Campaign[] = await response.json();

            // Enrich each campaign with its associated events in parallel
            const campaignsWithEvents: CampaignWithEvents[] = await Promise.all(
                data.map(async (campaign) => {
                    const res = await fetch(`/api/campaigns/${campaign.id}`);
                    return res.json() as Promise<CampaignWithEvents>;
                })
            );

            setCampaigns(campaignsWithEvents);
        } catch (err) {
            setError('Unable to load campaigns. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ── Filtered campaigns (derived, not stored) ──────────────
    // useMemo avoids re-filtering on every render that isn't caused
    // by a change in campaigns, searchQuery, or statusFilter.
    const filteredCampaigns = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return campaigns.filter((c) => {
            const matchesSearch =
                query === '' ||
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query);
            const matchesStatus =
                statusFilter === 'all' || c.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [campaigns, searchQuery, statusFilter]);

    // ── Send email handler ────────────────────────────────────
    async function handleSendEmail(campaignId: number): Promise<void> {
        if (!recipientEmail.trim()) {
            setSendStatus({ type: 'error', message: 'Please enter an email address' });
            return;
        }

        try {
            setSending(true);
            setSendStatus(null);

            const response = await fetch(`/api/campaigns/${campaignId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientEmail }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send email');

            setSendStatus({
                type: 'success',
                message: 'Email sent successfully!',
                previewUrl: data.previewUrl,
            });
            setRecipientEmail('');
        } catch (err) {
            setSendStatus({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to send email',
            });
        } finally {
            setSending(false);
        }
    }

    // ── Render ────────────────────────────────────────────────

    // Skeleton loading — 3 placeholder cards while data loads
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <main className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                                        <div className="h-4 bg-gray-200 rounded w-72 mb-1" />
                                        <div className="h-3 bg-gray-200 rounded w-24" />
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <div className="h-7 bg-gray-200 rounded-full w-20" />
                                        <div className="h-7 bg-gray-200 rounded-full w-20" />
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                                <div className="h-9 bg-gray-200 rounded-lg w-28" />
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
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* ── Search and filter bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaigns by name or description…"
                        className="flex-1 px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>

                {/* Empty state */}
                {filteredCampaigns.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg">No campaigns match your search.</p>
                    </div>
                )}

                {/* ── Campaign cards ── */}
                <div className="grid gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-white rounded-lg shadow-sm border p-6"
                        >
                            {/* Header row: name + description + budget + badges */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {campaign.name}
                                    </h2>
                                    <p className="text-gray-500 mt-1">{campaign.description}</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Budget: ${campaign.budget_usd.toLocaleString('en-US')}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            campaign.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        {campaign.status}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                        {campaign.platform}
                                    </span>
                                </div>
                            </div>

                            {/* Associated events */}
                            {campaign.events.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                                        Events
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.events.map((event) => (
                                            <span
                                                key={event.id}
                                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                                            >
                                                {event.name} — {formatEventDate(event.event_date)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Toggle email form button */}
                            <button
                                onClick={() => {
                                    setActiveEmailForm(
                                        activeEmailForm === campaign.id ? null : campaign.id
                                    );
                                    setSendStatus(null);
                                    setRecipientEmail('');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                {activeEmailForm === campaign.id ? 'Cancel' : 'Send Email'}
                            </button>

                            {/* Inline email form — slides in when button is clicked */}
                            {activeEmailForm === campaign.id && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="Enter recipient email address"
                                            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => handleSendEmail(campaign.id)}
                                            disabled={sending}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                                        >
                                            {sending ? 'Sending…' : 'Send'}
                                        </button>
                                    </div>

                                    {/* Feedback after send attempt */}
                                    {sendStatus && (
                                        <div
                                            className={`mt-3 text-sm ${
                                                sendStatus.type === 'success'
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }`}
                                        >
                                            <span>{sendStatus.message}</span>
                                            {sendStatus.previewUrl && (
                                                <a
                                                    href={sendStatus.previewUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="ml-2 underline font-medium hover:opacity-75 transition-opacity"
                                                >
                                                    View email preview →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default CampaignList;