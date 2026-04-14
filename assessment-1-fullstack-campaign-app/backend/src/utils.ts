// ============================================================
// Utility Functions
// Reusable helper functions shared across the application.
// Extracted into their own module to avoid duplication and
// keep route files focused on handling requests.
// ============================================================

/**
 * Validates whether a string is a properly formatted email address.
 * Uses a standard regex pattern that covers most common email formats.
 * 
 * Used in:
 *   - POST /api/campaigns/:id/send (validating recipient email)
 *   - POST /api/landing/:slug/submit (validating form submission email)
 * 
 * @param email - The string to validate
 * @returns true if the email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Checks if a string is empty, null, undefined, or just whitespace.
 * Useful for form validation — ensures required fields aren't blank.
 * 
 * @param value - The string to check
 * @returns true if the value is blank or missing
 */
export function isBlank(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'string') return true;
    return value.trim().length === 0;
}

/**
 * Formats a date string into a human-readable format.
 * Used when generating email content or CSV exports.
 * 
 * @param dateStr - ISO date string (e.g. "2025-09-18")
 * @returns Formatted date (e.g. "18 September 2025")
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IE', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}