// ============================================================
// Campaign Detail Drawer
// A slide-in panel from the right side that shows full details
// for a selected campaign: budget, platform, status, events
// (with location, capacity, and description), email subject,
// and CTA button text.
//
// Opens when the user clicks a campaign's name on the list.
// Closes via the ✕ button or by clicking the backdrop.
//
// Using a CSS transform (translate-x) instead of mounting/unmounting
// preserves the slide animation in both directions.
// ============================================================

import { CampaignWithEvents } from '../types';
import { formatEventDate } from '../utils/date';

interface Props {
    // null = drawer closed; a campaign object = drawer open showing that campaign
    campaign: CampaignWithEvents | null;
    onClose: () => void;
}

export default function CampaignDrawer({ campaign, onClose }: Props) {
    const isOpen = campaign !== null;

    return (
        <>
            {/* Backdrop — only visible when the drawer is open */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Drawer panel — always in the DOM, translated off-screen when closed */}
            <aside
                aria-label="Campaign details"
                className={`
                    fixed top-0 right-0 z-50 h-full w-full max-w-md
                    bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                {/* Only render the content when a campaign is selected */}
                {campaign && (
                    <div className="p-6">

                        {/* Header row: campaign name + close button */}
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 pr-4 leading-tight">
                                {campaign.name}
                            </h2>
                            <button
                                onClick={onClose}
                                aria-label="Close campaign details"
                                className="flex-shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
                            {campaign.description}
                        </p>

                        {/* Key stats in a 2-column grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                                <span className={`text-sm font-semibold ${
                                    campaign.status === 'active'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-yellow-600 dark:text-yellow-400'
                                }`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Platform</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {campaign.platform}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Budget</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    ${campaign.budget_usd.toLocaleString('en-US')}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Created</p>
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                    {/* created_at may be a full ISO string or just a date */}
                                    {formatEventDate(campaign.created_at.split('T')[0])}
                                </p>
                            </div>
                        </div>

                        {/* Email subject line */}
                        <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                Email Subject
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                {campaign.email_subject}
                            </p>
                        </div>

                        {/* CTA button label */}
                        <div className="mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                                CTA Button Text
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                {campaign.cta_text}
                            </p>
                        </div>

                        {/* Linked events */}
                        {campaign.events.length > 0 && (
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                    Events ({campaign.events.length})
                                </p>
                                <div className="space-y-3">
                                    {campaign.events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="border dark:border-gray-700 rounded-lg p-3"
                                        >
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                {event.name}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatEventDate(event.event_date)} · {event.location}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Capacity: {event.capacity.toLocaleString('en-US')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                {event.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
}
