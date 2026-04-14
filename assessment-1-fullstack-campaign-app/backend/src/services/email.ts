// ============================================================
// Email Service
// Handles sending campaign emails using Nodemailer.
//
// How it works:
//   1. On first use, creates a test account on Ethereal Email
//      (a fake SMTP service — emails don't actually get delivered)
//   2. Builds an HTML email with the campaign details
//   3. Sends it via the Ethereal SMTP server
//   4. Logs a preview URL to the console so you can view the email
//
// Why Ethereal? It's a free testing service from the Nodemailer team.
// No signup needed. Perfect for development and assessments like this.
// ============================================================

import nodemailer from 'nodemailer';
import { Campaign } from '../types';

// Store the transporter so we only create one Ethereal account per session
let transporter: nodemailer.Transporter | null = null;

/**
 * Creates (or reuses) a Nodemailer transporter connected to Ethereal.
 * The transporter is the object that actually sends emails.
 * We cache it so we don't create a new Ethereal account on every send.
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
    if (transporter) return transporter;

    // Create a test account on Ethereal (generates fake SMTP credentials)
    const testAccount = await nodemailer.createTestAccount();

    // Build the transporter using those credentials
    transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,  // true for port 465, false for other ports
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    console.log(`Ethereal test account created: ${testAccount.user}`);
    return transporter;
}

/**
 * Builds the HTML content for a campaign email.
 * Includes the campaign name, description, and a call-to-action button
 * that links to the campaign's unique landing page.
 *
 * @param campaign - The campaign to build the email for
 * @param landingPageUrl - The full URL to the campaign landing page
 * @returns HTML string ready to be used as the email body
 */
function buildEmailHtml(campaign: Campaign, landingPageUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; }
        .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .body { padding: 30px; color: #333; line-height: 1.6; }
        .cta-button {
          display: inline-block;
          margin-top: 20px;
          padding: 14px 28px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
        .footer { padding: 20px 30px; font-size: 12px; color: #999; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${campaign.name}</h1>
        </div>
        <div class="body">
          <p>${campaign.description}</p>
          <a href="${landingPageUrl}" class="cta-button">
            ${campaign.cta_text}
          </a>
        </div>
        <div class="footer">
          <p>You're receiving this because you were invited to learn more about this campaign.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Sends a campaign email to the specified recipient.
 * Logs the Ethereal preview URL to the console so the email can be viewed.
 *
 * @param campaign - The campaign to send
 * @param recipientEmail - The email address to send to
 * @returns The Ethereal preview URL where the sent email can be viewed
 */
export async function sendCampaignEmail(
    campaign: Campaign,
    recipientEmail: string
): Promise<string> {
    const transport = await getTransporter();

    // Build the landing page URL using the campaign's slug
    const landingPageUrl = `http://localhost:3000/landing/${campaign.slug}`;

    // Build the HTML email content
    const html = buildEmailHtml(campaign, landingPageUrl);

    // Send the email
    const info = await transport.sendMail({
        from: '"Campaign Manager" <campaigns@energycomms.ie>',
        to: recipientEmail,
        subject: campaign.email_subject,
        html,
    });

    // Get the preview URL so we can verify the email was sent
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`Email sent! Preview URL: ${previewUrl}`);

    return previewUrl as string;
}