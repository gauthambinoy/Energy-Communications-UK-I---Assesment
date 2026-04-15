// ============================================================
// Database Setup & Seeding
// This file handles three things:
// 1. Creates a SQLite database file (campaigns.db)
// 2. Creates the three tables (campaigns, events, submissions)
// 3. Reads seed_campaigns.json and inserts the initial data
//
// This runs every time the server starts, but only seeds once
// (it checks if data already exists before inserting).
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SeedData } from './types';

// Create (or open) the database file in the backend folder
// path.join safely builds a file path regardless of operating system
const dbPath = path.join(__dirname, '..', 'campaigns.db');
const db = new Database(dbPath);

// WAL mode = Write-Ahead Logging
// Makes the database faster when reading and writing at the same time
db.pragma('journal_mode = WAL');

// SQLite does NOT enforce foreign key constraints by default — you have to opt in.
// Without this, you could insert a submission with a non-existent campaign_id
// and SQLite would silently accept it, causing data integrity issues.
db.pragma('foreign_keys = ON');

/**
 * Creates the three tables if they don't already exist.
 * IF NOT EXISTS prevents errors when the server restarts —
 * it won't try to create a table that's already there.
 */
function createTables(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      email_subject TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      status TEXT NOT NULL,
      platform TEXT NOT NULL,
      budget_usd INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,
      campaign_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      event_date TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );
  `);
}

/**
 * Reads seed_campaigns.json and inserts campaigns + events into the database.
 * Only runs if the campaigns table is empty (prevents duplicate data on restart).
 */
function seedDatabase(): void {
  // Check if we've already seeded
  const row = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };

  if (row.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  // Read the JSON seed file
  const seedPath = path.join(__dirname, '..', 'seed_campaigns.json');
  const rawData = fs.readFileSync(seedPath, 'utf-8');
  const seedData: SeedData = JSON.parse(rawData);

  // Prepare reusable insert statements (more efficient than building SQL strings)
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (id, name, slug, description, email_subject, cta_text, status, platform, budget_usd, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT INTO events (id, campaign_id, name, event_date, location, capacity, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert all campaigns from the seed file
  for (const c of seedData.campaigns) {
    insertCampaign.run(
      c.id, c.name, c.slug, c.description,
      c.email_subject, c.cta_text, c.status,
      c.platform, c.budget_usd, c.created_at
    );
  }

  // Insert all events from the seed file
  for (const e of seedData.events) {
    insertEvent.run(
      e.id, e.campaign_id, e.name,
      e.event_date, e.location, e.capacity, e.description
    );
  }

  console.log(`Seeded ${seedData.campaigns.length} campaigns and ${seedData.events.length} events`);
}

// Run both functions when this file is imported
createTables();
seedDatabase();

// Export the database connection so other files can use it
export default db;