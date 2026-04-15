// ============================================================
// Campaign List Page (Homepage)
// Displays all marketing campaigns in a clean card layout.
// Each campaign shows its name (clickable → detail drawer),
// status, platform, budget, and scheduled events.
//
// Features:
//   - Live search by name or description
//   - Filter by campaign status (active / draft)
//   - Inline email dispatch with confirm modal before sending
//   - Toast notification after send (success + clickable preview link)
//   - Copy-to-clipboard on the preview URL
//   - Campaign detail drawer (click any campaign name)
//   - Skeleton loading animation while data loads
//   - SVG empty state when no campaigns match the filter
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Campaign, CampaignWithEvents } from '../types';
import Toast, { ToastPayload } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import CampaignDrawer from '../components/CampaignDrawer';
import API_BASE from '../api';
import { formatEventDate } from '../utils/date';

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
    const [sending, setSending] = useState<boolean>(false);

    // ── Confirm modal state ───────────────────────────────────
    // Holds the campaign ID we are about to send to, or null when closed
    const [confirmCampaignId, setConfirmCampaignId] = useState<number | null>(null);

    // ── Toast notification state ──────────────────────────────
    const [toast, setToast] = useState<ToastPayload | null>(null);

    // ── Drawer state ──────────────────────────────────────────
    // Holds the full campaign object for the detail drawer, or null when closed
    const [drawerCampaign, setDrawerCampaign] = useState<CampaignWithEvents | null>(null);

    // ── Page title ────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Campaigns | Campaign Manager';
    }, []);

    // ── Fetch campaigns on mount ──────────────────────────────
    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns(): Promise<void> {
        try {
            setLoading(true);

            const response = await fetch(`${API_BASE}/api/campaigns`);
            if (!response.ok) throw new Error('Failed to fetch campaigns');

            const data: Campaign[] = await response.json();

            // Enrich each campaign with its associated events in parallel
            const campaignsWithEvents: CampaignWithEvents[] = await Promise.all(
                data.map(async (campaign) => {
                    const res = await fetch(`${API_BASE}/api/campaigns/${campaign.id}`);
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

    // ── Filtered campaigns (derived, not stored in state) ─────
    // useMemo avoids re-running the filter on every unrelated render.
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

    // ── Send email (called after confirm modal confirmed) ─────
    const handleSendEmail = useCallback(async (campaignId: number): Promise<void> => {
        try {
            setSending(true);

            const response = await fetch(`${API_BASE}/api/campaigns/${campaignId}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientEmail }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to send email');

            setToast({
                type: 'success',
                message: 'Email sent successfully!',
                previewUrl: data.previewUrl,
            });

            // Reset form state after a successful send
            setActiveEmailForm(null);
            setRecipientEmail('');
        } catch (err) {
            setToast({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to send email',
            });
        } finally {
            setSending(false);
        }
    }, [recipientEmail]);

    // ── Copy preview URL to clipboard ────────────────────────
    async function copyToClipboard(url: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(url);
            setToast({ type: 'success', message: 'Preview URL copied to clipboard!' });
        } catch {
            setToast({ type: 'error', message: 'Could not copy URL' });
        }
    }

    // ── Render ────────────────────────────────────────────────

    // Skeleton loading — 3 placeholder cards pulse while data loads
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <main className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6 animate-pulse">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-72 mb-1" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                                        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                                    </div>
                                </div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
                                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-28" />
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

            {/* Floating toast — stays above everything */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />

            {/* Confirm modal — shown before dispatching an email */}
            <ConfirmModal
                isOpen={confirmCampaignId !== null}
                title="Send campaign email?"
                message={`Send this campaign to ${recipientEmail}? This will dispatch a real email via Ethereal.`}
                confirmLabel="Send Email"
                onConfirm={() => {
                    const id = confirmCampaignId!;
                    setConfirmCampaignId(null);
                    handleSendEmail(id);
                }}
                onCancel={() => setConfirmCampaignId(null)}
            />

            {/* Campaign detail drawer — slides in from the right */}
            <CampaignDrawer
                campaign={drawerCampaign}
                onClose={() => setDrawerCampaign(null)}
            />

            <main className="max-w-6xl mx-auto px-6 py-8">

                {/* ── Search and filter bar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search campaigns by name or description…"
                        className="flex-1 px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>

                {/* Empty state — no campaigns match the current search/filter */}
                {filteredCampaigns.length === 0 && (
                    <div className="text-center py-20">
                        {/* Inline SVG magnifier illustration */}
                        <svg
                            className="mx-auto mb-4 text-gray-300 dark:text-gray-600"
                            width="64"
                            height="64"
                            viewBox="0 0 64 64"
                            fill="none"
                            aria-hidden="true"
                        >
                            <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2" />
                            <path d="M40 40l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M22 28h12M28 22v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
                            No campaigns found
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                            Try adjusting your search or status filter.
                        </p>
                    </div>
                )}

                {/* ── Campaign cards ── */}
                <div className="grid gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-800 p-6"
                        >
                            {/* Header row: name (clickable) + description + budget + badges */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    {/* Clicking the name opens the detail drawer */}
                                    <button
                                        onClick={() => setDrawerCampaign(campaign)}
                                        className="text-xl font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                                    >
                                        {campaign.name}
                                    </button>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                                        {campaign.description}
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                        Budget: ${campaign.budget_usd.toLocaleString('en-US')}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0 ml-4">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            campaign.status === 'active'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}
                                    >
                                        {campaign.status}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {campaign.platform}
                                    </span>
                                </div>
                            </div>

                            {/* Associated events */}
                            {campaign.events.length > 0 && (
                                <div className="mb-4">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                        Events
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {campaign.events.map((event) => (
                                            <span
                                                key={event.id}
                                                className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded text-sm"
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
                                    setRecipientEmail('');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                {activeEmailForm === campaign.id ? 'Cancel' : 'Send Email'}
                            </button>

                            {/* Inline email form — visible when this card's button is clicked */}
                            {activeEmailForm === campaign.id && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            // Submit on Enter key — same UX as clicking the Send button
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && recipientEmail.trim()) {
                                                    setConfirmCampaignId(campaign.id);
                                                }
                                            }}
                                            placeholder="Enter recipient email address"
                                            className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!recipientEmail.trim()) {
                                                    setToast({ type: 'error', message: 'Please enter an email address' });
                                                    return;
                                                }
                                                // Open the confirm modal rather than sending immediately
                                                setConfirmCampaignId(campaign.id);
                                            }}
                                            disabled={sending}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                                        >
                                            {sending ? 'Sending…' : 'Send'}
                                        </button>
                                    </div>

                                    {/* Copy-to-clipboard hint — shown after a successful send */}
                                    {toast?.type === 'success' && toast.previewUrl && (
                                        <button
                                            onClick={() => copyToClipboard(toast.previewUrl!)}
                                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors underline"
                                        >
                                            Copy preview URL
                                        </button>
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
