// ============================================================
// Landing & Email Dispatch Routes
// Handles two key parts of the campaign flow:
//
//   POST /api/campaigns/:id/send
//     → Sends a campaign email to a given recipient address
//     → Uses Ethereal for testing (preview URL logged to console)
//
//   POST /api/landing/:slug/submit
//     → Receives form submissions from the campaign landing page
//     → Validates all fields and saves to the submissions table
//
// This is the core of the lead capture flow:
//   Send email → recipient clicks link → lands on page → fills form → saved here
// ============================================================

import { Router, Request, Response } from 'express';
import db from '../database';
import { Campaign } from '../types';
import { sendCampaignEmail } from '../services/email';
import { isValidEmail, isBlank } from '../utils';

// Strips any HTML tags from a user-supplied string.
// This prevents stored XSS — if data is ever rendered in a browser,
// tags like <script> won't execute because they were removed at input time.
function sanitise(value: string): string {
  return value.trim().replace(/<[^>]*>/g, '');
}

const router = Router();

/**
 * POST /api/campaigns/:id/send
 * Sends a campaign email to the provided recipient address.
 * Validates the email format and checks that the campaign exists
 * before attempting to send.
 */
router.post('/campaigns/:id/send', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { recipientEmail } = req.body;

    // Validate campaign ID is a number
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ error: 'Campaign ID must be a valid number' });
      return;
    }

    // Validate that an email was provided and is properly formatted
    if (isBlank(recipientEmail)) {
      res.status(400).json({ error: 'Recipient email is required' });
      return;
    }

    if (!isValidEmail(recipientEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Check the campaign actually exists before trying to send
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ?'
    ).get(Number(id)) as Campaign | undefined;

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Send the email and get the Ethereal preview URL
    const previewUrl = await sendCampaignEmail(campaign, recipientEmail);

    res.json({
      message: 'Email sent successfully',
      previewUrl,
    });
  } catch (error) {
    console.error('Error sending campaign email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

/**
 * POST /api/landing/:slug/submit
 * Handles form submissions from the campaign landing page.
 * Validates all required fields, finds the campaign by slug,
 * and saves the submission to the database.
 */
router.post('/landing/:slug/submit', (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { firstName, lastName, email, company } = req.body;

    // Validate all required fields are present and not empty
    if (isBlank(firstName) || isBlank(lastName) || isBlank(email) || isBlank(company)) {
      res.status(400).json({
        error: 'All fields are required: firstName, lastName, email, company',
      });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Find the campaign by its slug (the URL-friendly name)
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE slug = ?'
    ).get(slug) as Campaign | undefined;

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Insert the submission into the database
    const stmt = db.prepare(`
      INSERT INTO submissions (campaign_id, first_name, last_name, email, company)
      VALUES (?, ?, ?, ?, ?)
    `);

    // sanitise() strips HTML tags in addition to trimming whitespace.
    // This prevents malicious input like <script>alert('xss')</script> from
    // being stored in the database and potentially executed later.
    stmt.run(campaign.id, sanitise(firstName), sanitise(lastName), email.trim(), sanitise(company));

    res.status(201).json({ message: 'Submission received — thank you!' });
  } catch (error) {
    console.error('Error saving submission:', error);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

export default router;