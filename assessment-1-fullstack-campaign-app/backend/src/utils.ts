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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
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
 * Strips HTML tags from a user-supplied string and trims whitespace.
 * Prevents stored XSS when data is later rendered in a browser.
 *
 * @param value - Raw string from user input
 * @returns Sanitised, trimmed string
 */
export function sanitise(value: string): string {
    return value.trim().replace(/<[^>]*>/g, '');
}

/**
 * Escapes a value for CSV export and neutralises spreadsheet formulas.
 * This keeps commas and quotes valid, flattens line breaks, and stops
 * values like "=SUM(...)" from being interpreted as a formula in Excel.
 *
 * @param value - Raw value to export
 * @returns Safe CSV cell wrapped in quotes
 */
export function escapeCsvField(value: unknown): string {
    const text = String(value ?? '').replace(/[\r\n]+/g, ' ');
    const formulaSafe = /^[\t ]*[=+\-@]/.test(text) ? `'${text}` : text;
    const escaped = formulaSafe.replace(/"/g, '""');
    return `"${escaped}"`;
}