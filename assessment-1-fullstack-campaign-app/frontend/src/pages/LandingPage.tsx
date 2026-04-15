// ============================================================
// Landing Page
// This is the page a recipient sees after clicking the link
// in their campaign email. It displays the campaign name and
// description, plus a form to capture their details.
//
// The :slug in the URL (e.g. /landing/summer-brand-awareness)
// is used to fetch the correct campaign from the backend.
//
// Flow: email link → this page → user fills form → submission saved
// ============================================================

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Campaign } from '../types';

function LandingPage() {
    // Extract the slug from the URL (e.g. "summer-brand-awareness")
    const { slug } = useParams<{ slug: string }>();

    // ── State ─────────────────────────────────────────────────
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // Form fields
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [company, setCompany] = useState<string>('');

    // Tracks whether the form was submitted successfully
    const [submitted, setSubmitted] = useState<boolean>(false);

    // Tracks form-level errors
    const [formError, setFormError] = useState<string>('');

    // Tracks if the form is currently submitting
    const [submitting, setSubmitting] = useState<boolean>(false);

    // ── Fetch campaign details on page load ───────────────────
    useEffect(() => {
        fetchCampaign();
    }, [slug]);

    async function fetchCampaign(): Promise<void> {
        try {
            setLoading(true);

            // Fetch all campaigns and find the one matching our slug
            const response = await fetch('/api/campaigns');

            if (!response.ok) {
                throw new Error('Failed to load campaign');
            }

            const campaigns: Campaign[] = await response.json();
            const found = campaigns.find((c) => c.slug === slug);

            if (!found) {
                setError('Campaign not found');
                return;
            }

            setCampaign(found);
        } catch (err) {
            setError('Unable to load campaign. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // ── Form submission handler ──────────────────────────────
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        // Prevent the default browser form submission (which would reload the page)
        e.preventDefault();
        setFormError('');

        // Validate all fields are filled in
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !company.trim()) {
            setFormError('All fields are required');
            return;
        }

        try {
            setSubmitting(true);

            const response = await fetch(`/api/landing/${slug}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, company }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            // Show the thank-you message
            setSubmitted(true);
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'Something went wrong'
            );
        } finally {
            setSubmitting(false);
        }
    }

    // ── Render ────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 text-lg">Loading...</p>
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

    // Show thank-you message after successful submission
    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm border p-10 text-center max-w-md">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
                    <p className="text-gray-500">
                        Your details have been submitted successfully. We'll be in touch soon.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-sm border p-8 max-w-lg w-full mx-4">
                {/* Campaign info */}
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {campaign?.name}
                </h1>
                <p className="text-gray-500 mb-8">{campaign?.description}</p>

                {/* Lead capture form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Alexandra"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Hartwell"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="alexandra@blackstone.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Blackstone Group"
                        />
                    </div>

                    {/* Error message */}
                    {formError && (
                        <p className="text-red-600 text-sm">{formError}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LandingPage;