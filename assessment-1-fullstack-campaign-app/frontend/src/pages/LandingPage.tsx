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
import API_BASE from '../api';

function LandingPage() {
    // Extract the slug from the URL (e.g. "summer-brand-awareness")
    const { slug } = useParams<{ slug: string }>();

    // ── State ─────────────────────────────────────────────────
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [formError, setFormError] = useState<string>('');

    // Form fields
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [company, setCompany] = useState<string>('');

    // Tracks whether the form was submitted successfully
    const [submitted, setSubmitted] = useState<boolean>(false);

    // Per-field validation errors — each key maps to an error string or ''
    const [fieldErrors, setFieldErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
    });

    // Tracks if the form is currently submitting
    const [submitting, setSubmitting] = useState<boolean>(false);

    // ── Fetch campaign details on page load ───────────────────
    useEffect(() => {
        fetchCampaign();
    }, [slug]);

    async function fetchCampaign(): Promise<void> {
        if (!slug) {
            setError('Campaign not found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Load just the requested campaign so public landing pages do not
            // need to download the full campaign list first.
            const response = await fetch(`${API_BASE}/api/campaigns/slug/${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Campaign not found');
                    return;
                }

                throw new Error('Failed to load campaign');
            }

            const found: Campaign = await response.json();
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

        // Validate each field individually so the user knows exactly what's missing
        const errors = {
            firstName: firstName.trim() ? '' : 'First name is required',
            lastName: lastName.trim() ? '' : 'Last name is required',
            email: email.trim() ? '' : 'Email is required',
            company: company.trim() ? '' : 'Company is required',
        };

        if (Object.values(errors).some(Boolean)) {
            setFieldErrors(errors);
            return;
        }

        // Clear any previous errors before submitting
        setFieldErrors({ firstName: '', lastName: '', email: '', company: '' });
        setFormError('');

        try {
            setSubmitting(true);

            const response = await fetch(`${API_BASE}/api/landing/${slug}/submit`, {
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
            const message = err instanceof Error ? err.message : 'Something went wrong';

            if (message === 'Invalid email format') {
                setFieldErrors((prev) => ({
                    ...prev,
                    email: message,
                }));
                return;
            }

            setFormError(message);
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
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.firstName ? 'border-red-500' : ''
                                    }`}
                                placeholder="Alexandra"
                            />
                            {fieldErrors.firstName && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors.firstName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.lastName ? 'border-red-500' : ''
                                    }`}
                                placeholder="Hartwell"
                            />
                            {fieldErrors.lastName && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors.lastName}</p>
                            )}
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
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.email ? 'border-red-500' : ''
                                }`}
                            placeholder="alexandra@blackstone.com"
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldErrors.company ? 'border-red-500' : ''
                                }`}
                            placeholder="Blackstone Group"
                        />
                        {fieldErrors.company && (
                            <p className="mt-1 text-xs text-red-600">{fieldErrors.company}</p>
                        )}
                    </div>

                    {formError && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {formError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                        {submitting ? 'Submitting…' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LandingPage;