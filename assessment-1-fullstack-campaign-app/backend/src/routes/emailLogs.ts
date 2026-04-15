// ============================================================
// Email Log Route
// GET /api/email-logs
//
// Returns every email dispatch recorded in the email_logs table,
// joined with the campaign name so the frontend can display it
// without making additional requests.
//
// Results are sorted newest-first so the most recent dispatches
// appear at the top of the Email Log page.
// ============================================================

import { Router, Request, Response } from 'express';
import db from '../database';
import { EmailLogWithCampaign } from '../types';

const router = Router();

/**
 * GET /api/email-logs
 * Returns all email dispatch records with their associated campaign names.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const logs = db.prepare(`
            SELECT
                el.id,
                el.campaign_id,
                c.name AS campaign_name,
                el.recipient_email,
                el.preview_url,
                el.sent_at
            FROM email_logs el
            JOIN campaigns c ON c.id = el.campaign_id
            ORDER BY el.sent_at DESC
        `).all() as EmailLogWithCampaign[];

        res.json(logs);
    } catch (error) {
        console.error('Error fetching email logs:', error);
        res.status(500).json({ error: 'Failed to fetch email logs' });
    }
});

export default router;
