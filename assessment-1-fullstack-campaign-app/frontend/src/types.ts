// ============================================================
// Frontend Type Definitions
// Mirrors the backend types so the frontend knows what shape
// the API data will be in. Keeps both sides in sync.
// ============================================================

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  description: string;
  email_subject: string;
  cta_text: string;
  status: string;
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