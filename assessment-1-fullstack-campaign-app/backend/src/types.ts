// ============================================================
// Type Definitions
// Shared TypeScript interfaces for all data models in the app.
// These mirror the database schema and are used across routes,
// services, and API responses.
// ============================================================

// Represents a marketing campaign (matches the campaigns table)
export interface Campaign {
    id: number;
    name: string;          // e.g. "Summer Brand Awareness 2025"
    slug: string;          // URL-friendly version, e.g. "summer-brand-awareness"
    description: string;
    email_subject: string; // subject line used when dispatching campaign emails
    cta_text: string;      // call-to-action button text, e.g. "Explore the Campaign"
    status: string;        // "active" or "paused"
    platform: string;      // e.g. "Meta", "LinkedIn", "Google"
    budget_usd: number;
    created_at: string;
}

// Represents an event linked to a campaign (matches the events table)
export interface Event {
    id: number;
    campaign_id: number;   // foreign key → campaigns.id
    name: string;
    event_date: string;
    location: string;
    capacity: number;
    description: string;
}

// Represents a form submission from a landing page (matches the submissions table)
export interface Submission {
    id: number;
    campaign_id: number;   // foreign key → campaigns.id
    first_name: string;
    last_name: string;
    email: string;
    company: string;
    submitted_at: string;  // ISO timestamp of when the form was submitted
}

// Extended campaign type that includes associated events
// Used by GET /api/campaigns/:id to return a campaign with its events
export interface CampaignWithEvents extends Campaign {
    events: Event[];
}

// Extended submission type that includes the campaign name
// Used by GET /api/submissions so we can show which campaign each submission belongs to
export interface SubmissionWithCampaign extends Submission {
    campaign_name: string;
}

// Records a single email dispatch event (matches the email_logs table)
export interface EmailLog {
    id: number;
    campaign_id: number;
    recipient_email: string;
    preview_url: string;
    sent_at: string;
}

// Extended email log with the campaign name joined from the campaigns table
// Used by GET /api/email-logs so the frontend does not need a second request
export interface EmailLogWithCampaign extends EmailLog {
    campaign_name: string;
}

// Shape of the seed_campaigns.json file
// Used by database.ts when loading initial data on startup
export interface SeedData {
    campaigns: Campaign[];
    events: Event[];
}