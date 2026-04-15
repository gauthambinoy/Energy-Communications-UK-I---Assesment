// ============================================================
// Campaign List Page (Homepage)
// Displays all marketing campaigns in a clean card layout.
// Each campaign shows its name, status, platform, and events.
// Includes a "Send Email" button that opens an inline form
// to dispatch a campaign email to a recipient.
//
// This is the entry point of the application — the first thing
// users see when they open the app.
// ============================================================

import { useState, useEffect } from 'react';
// CampaignWithEvents is already defined in types.ts — importing it from there
// instead of redefining it here keeps types in a single source of truth
import { Campaign, Event, CampaignWithEvents } from '../types';

function CampaignList() {
    // ── State ─────────────────────────────────────────────────
    // campaigns: the list of campaigns fetched from the API
    // loading: shows a spinner while data is being fetched
    // error: stores any error message if the fetch fails
    const [campaigns, setCampaigns] = useState<CampaignWithEvents[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Track which campaign's email form is currently open (null = none)
    const [activeEmailForm, setActiveEmailForm] = useState<number | null>(null);

    // The email address typed into the send form
    const [recipientEmail, setRecipientEmail] = useState<string>('');

    // Feedback message after sending (success or error)
    const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Track if an email is currently being sent (to disable the button)
    const [sending, setSending] = useState<boolean>(false);

    // ── Fetch campaigns on page load ─────────────────────────
    useEffect(() => {
        fetchCampaigns();
    }, []);

    async function fetchCampaigns(): Promise<void> {
        try {
            setLoading(true);

            // Fetch all campaigns from the backend
            const response = await fetch('/api/campaigns');

            if (!response.ok) {
                throw new Error('Failed to fetch campaigns');
            }

            const data: Campaign[] = await response.json();

            // For each campaign, fetch its events
            const campaignsWithEvents: CampaignWithEvents[] = await Promise.all(
                data.map(async (campaign) => {
                    const eventResponse = await fetch(`/api/campaigns/${campaign.id}`);
                    const fullCampaign: CampaignWithEvents = await eventResponse.json();
                    return fullCampaign;
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

    // ── Send email handler ───────────────────────────────────
    async function handleSendEmail(campaignId: number): Promise<void> {
        // Basic validation before sending
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

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send email');
            }

            setSendStatus({
                type: 'success',
                message: `Email sent! Preview: ${data.previewUrl}`,
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

    // Show loading state while fetching
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading campaigns...</p>
            </div>
        );
    }

    // Show error state if fetch failed
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-500 text-lg">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Campaign cards */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid gap-6">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-white rounded-lg shadow-sm border p-6"
                        >
                            {/* Campaign header row */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        {campaign.name}
                                    </h2>
                                    <p className="text-gray-500 mt-1">{campaign.description}</p>
                                </div>
                                <div className="flex gap-2">
                                    {/* Status badge */}
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${campaign.status === 'active'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                            }`}
                                    >
                                        {campaign.status}
                                    </span>
                                    {/* Platform badge */}
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                        {campaign.platform}
                                    </span>
                                </div>
                            </div>

                            {/* Associated events (if any) */}
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
                                                {event.name} — {event.event_date}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Send email button */}
                            <button
                                onClick={() => {
                                    // Toggle the form open/closed
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

                            {/* Inline email form — only visible when this campaign's button is clicked */}
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
                                            {sending ? 'Sending...' : 'Send'}
                                        </button>
                                    </div>

                                    {/* Success or error message */}
                                    {sendStatus && (
                                        <p
                                            className={`mt-3 text-sm ${sendStatus.type === 'success'
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}
                                        >
                                            {sendStatus.message}
                                        </p>
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