// ============================================================
// Frontend Type Definitions
// Mirrors the backend types so the frontend knows what shape
// the API data will be in. Keeps both sides in sync.
// ============================================================

export type CampaignStatus = 'active' | 'paused';

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  description: string;
  email_subject: string;
  cta_text: string;
  status: CampaignStatus;
  platform: string;
  budget_usd: number;
  created_at: string;
}

export interface Event {
  id: number;
  campaign_id: number;
  name: string;
  event_date: string;
  location: string;
  capacity: number;
  description: string;
}

export interface CampaignWithEvents extends Campaign {
  events: Event[];
}

export interface Submission {
  id: number;
  campaign_id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  submitted_at: string;
  campaign_name: string;
}

// Records every email dispatch event — shown on the Email Log page
export interface EmailLog {
  id: number;
  campaign_id: number;
  campaign_name: string;
  recipient_email: string;
  preview_url: string;
  sent_at: string;
}