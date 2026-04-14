// ============================================================
// Campaign Routes
// Handles all API endpoints related to campaigns:
//   GET /api/campaigns      — fetch all campaigns
//   GET /api/campaigns/:id  — fetch a single campaign with its events
//
// Design decisions:
//   - Campaigns are sorted by creation date (newest first)
//   - Campaign detail includes associated events for convenience
//   - Input validation on route parameters to prevent bad queries
// ============================================================

import { Router, Request, Response } from 'express';
import db from '../database';
import { Campaign, Event, CampaignWithEvents } from '../types';

const router = Router();

/**
 * GET /api/campaigns
 * Returns all campaigns, sorted by most recently created.
 * Used by the frontend homepage to display the full campaign list.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        // Order by created_at DESC so the most recent campaigns appear first
        const campaigns = db.prepare(
            'SELECT * FROM campaigns ORDER BY created_at DESC'
        ).all() as Campaign[];

        res.json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Failed to fetch campaigns' });
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

        // Fetch events linked to this campaign, sorted by date
        const events = db.prepare(
            'SELECT * FROM events WHERE campaign_id = ? ORDER BY event_date ASC'
        ).all(Number(id)) as Event[];

        // Combine into a single response object
        const response: CampaignWithEvents = {
            ...campaign,
            events,
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Failed to fetch campaign' });
    }
});

export default router;