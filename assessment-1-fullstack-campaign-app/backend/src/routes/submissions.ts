// ============================================================
// Submission Routes
// Handles endpoints for viewing and exporting form submissions:
//
//   GET /api/submissions
//     → Returns all submissions with the campaign name included
//     → Used by the frontend submissions dashboard
//
//   GET /api/submissions/export
//     → Returns all submissions as a downloadable CSV file
//     → Sets proper headers so the browser triggers a file download
//
// Design note: the export endpoint must come BEFORE any /:id route
// in Express, otherwise "export" would be treated as an ID parameter.
// ============================================================

import { Router, Request, Response } from 'express';
import db from '../database';
import { SubmissionWithCampaign } from '../types';
import { formatDate } from '../utils';

const router = Router();

/**
 * GET /api/submissions
 * Returns all submissions joined with the campaign name.
 * Sorted by newest first so recent leads appear at the top.
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        // JOIN submissions with campaigns to include the campaign name
        // This avoids the frontend needing to make a second request
        const submissions = db.prepare(`
      SELECT
        submissions.*,
        campaigns.name as campaign_name
      FROM submissions
      JOIN campaigns ON submissions.campaign_id = campaigns.id
      ORDER BY submissions.submitted_at DESC
    `).all() as SubmissionWithCampaign[];

        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

/**
 * GET /api/submissions/export
 * Exports all submissions as a CSV file.
 * The browser will download this as "submissions.csv" because of the
 * Content-Disposition header we set.
 */
router.get('/export', (_req: Request, res: Response) => {
    try {
        const submissions = db.prepare(`
      SELECT
        submissions.first_name,
        submissions.last_name,
        submissions.email,
        submissions.company,
        campaigns.name as campaign_name,
        submissions.submitted_at
      FROM submissions
      JOIN campaigns ON submissions.campaign_id = campaigns.id
      ORDER BY submissions.submitted_at DESC
    `).all() as SubmissionWithCampaign[];

        // Build the CSV content line by line
        // Start with the header row
        const csvHeader = 'First Name,Last Name,Email,Company,Campaign,Submitted At';

        // Map each submission to a CSV row
        // Wrap fields in quotes to handle commas in values (e.g. "Acme, Inc.")
        const csvRows = submissions.map((s) =>
            `"${s.first_name}","${s.last_name}","${s.email}","${s.company}","${s.campaign_name}","${formatDate(s.submitted_at)}"`
        );

        // Combine header + rows with newlines
        const csvContent = [csvHeader, ...csvRows].join('\n');

        // Set headers that tell the browser "this is a file download, not a page"
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
        res.send(csvContent);
    } catch (error) {
        console.error('Error exporting submissions:', error);
        res.status(500).json({ error: 'Failed to export submissions' });
    }
});

export default router;