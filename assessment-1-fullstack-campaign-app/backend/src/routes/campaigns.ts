// ============================================================
// Campaign Routes
// Handles all API endpoints related to campaigns:
//   GET /api/campaigns            — fetch all campaigns with their events
//   GET /api/campaigns/slug/:slug — fetch a single campaign by slug
//   GET /api/campaigns/:id        — fetch a single campaign with its events
//
// Design decisions:
//   - Campaigns are sorted by creation date (newest first)
//   - Campaign responses include associated events for convenience
//   - Input validation on route parameters to prevent bad queries
// ============================================================

import { Router, Request, Response } from 'express';
import db from '../database';
import { Campaign, Event, CampaignWithEvents } from '../types';

const router = Router();

function getCampaignEvents(campaignId: number): Event[] {
    return db.prepare(
        'SELECT * FROM events WHERE campaign_id = ? ORDER BY event_date ASC'
    ).all(campaignId) as Event[];
}

function buildCampaignWithEvents(campaign: Campaign): CampaignWithEvents {
    return {
        ...campaign,
        events: getCampaignEvents(campaign.id),
    };
}

/**
 * GET /api/campaigns
 * Returns all campaigns with their associated events, sorted by most recently created.
 * Bundling events here avoids an N+1 request pattern on the frontend homepage.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        // Order by created_at DESC so the most recent campaigns appear first
        const campaigns = db.prepare(
            'SELECT * FROM campaigns ORDER BY created_at DESC'
        ).all() as Campaign[];

        res.json(campaigns.map(buildCampaignWithEvents));
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
});

/**
 * GET /api/campaigns/slug/:slug
 * Returns a single campaign for public landing pages.
 * This lets the landing page load one record instead of downloading the full list.
 */
router.get('/slug/:slug', (req: Request, res: Response) => {
    try {
        const { slug } = req.params;

        if (!slug) {
            res.status(400).json({ error: 'Campaign slug is required' });
            return;
        }

        const campaign = db.prepare(
            'SELECT * FROM campaigns WHERE slug = ?'
        ).get(slug) as Campaign | undefined;

        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }

        res.json(buildCampaignWithEvents(campaign));
    } catch (error) {
        console.error('Error fetching campaign by slug:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

/**
 * GET /api/campaigns/:id
 * Returns a single campaign along with all its associated events.
 * The :id parameter is validated before querying to prevent bad requests.
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate that the ID is a valid number before querying
        if (!id || isNaN(Number(id))) {
            res.status(400).json({ error: 'Campaign ID must be a valid number' });
            return;
        }

        // Look up the campaign by ID
        const campaign = db.prepare(
            'SELECT * FROM campaigns WHERE id = ?'
        ).get(Number(id)) as Campaign | undefined;

        if (!campaign) {
            res.status(404).json({ error: 'Campaign not found' });
            return;
        }

        res.json(buildCampaignWithEvents(campaign));
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

export default router;