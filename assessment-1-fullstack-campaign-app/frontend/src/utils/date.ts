/**
 * Formats a YYYY-MM-DD date string to a short locale string, e.g. "18 Sep 2025".
 * Pins to local midnight to avoid UTC offset day-shifts.
 *
 * @param raw - ISO date string (e.g. "2025-09-18")
 * @returns Formatted date string (e.g. "18 Sep 2025")
 */
export function formatEventDate(raw: string): string {
    return new Date(raw + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
