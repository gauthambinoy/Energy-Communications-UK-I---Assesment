# Task 2 — Python Data Cleaning Pipeline

This task builds a clean outreach-ready contact list from a raw LinkedIn scrape. The goal is not just to clean strings, but to identify the primary senior marketing contact for each company and output a CSV that a non-technical user can use directly.

## Files

- `linkedin_raw_data.csv`: raw input provided for the assessment
- `pipeline.py`: end-to-end cleaning, filtering, ranking, and export logic
- `marketing_contacts_clean.csv`: final one-row-per-company output
- `tests/test_pipeline.py`: focused regression tests for the key business rules

## How To Run

1. Create and activate a virtual environment.
2. Install dependencies.
3. Run the pipeline.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python pipeline.py
```

The script reads `linkedin_raw_data.csv` and writes `marketing_contacts_clean.csv` in the same folder.

## How To Run Tests

```bash
python -m unittest discover -s tests -v
```

## What The Pipeline Does

The pipeline runs in four stages.

1. Inspect the raw CSV.
2. Clean names, titles, companies, emails, and duplicates.
3. Keep only senior marketing contacts.
4. Select one primary contact per company and validate the final output before saving.

## Main Data Quality Issues Found

- Duplicate profiles across multiple scrape dates for the same person and company.
- Names with titles, inconsistent spacing, and broken casing.
- LinkedIn headlines that mix job title, company name, and skill tags in one field.
- Missing or inconsistent company names, including Ireland variants.
- Invalid emails, phone numbers in the email field, and personal email addresses.
- Junk rows such as ad placements, placeholders, and non-marketing roles.

## Cleaning Decisions

- Names are stripped, de-titled, de-duplicated, and converted to readable case.
- Job titles are extracted from the raw headline rather than copied directly.
- Company names are standardised so known variants map to one canonical company.
- Personal emails are cleared to an empty string because the brief asks for corporate email or blank.
- Duplicate profile rows keep the freshest scrape, but preserve an older corporate email if the latest scrape lost it.

## Role Classification And Company Selection

The brief asks for the primary marketing decision-maker, so selection is more precise than a simple Director-vs-Head rule.

- CMO and Chief Marketing Officer rank highest.
- VP-level marketing roles rank next.
- Broad company-wide marketing ownership, such as `Head of Marketing`, is preferred over narrower specialist leadership.
- Specialist roles such as content, digital, demand generation, marketing operations, and marketing automation are kept only when they are the strongest senior marketing contacts available for a company.

Final company selection is deterministic:

1. Highest role score wins.
2. If scores tie, prefer a contact with a corporate email.
3. If still tied, prefer the most recent scrape date.
4. Final fallback is alphabetical by contact name.

## Output Contract

The final CSV contains exactly these columns:

- `company_name`
- `contact_name`
- `job_title`
- `email`
- `linkedin_url`

The pipeline validates the final dataframe before writing it. It will fail if the schema changes, if company rows are duplicated, if emails are invalid, if LinkedIn URLs are malformed, or if names are clearly badly cased.

## Commentary

The most common issues in the raw file were duplicate profiles, messy headlines, and invalid contact data. The hardest part was not the text cleaning itself, but deciding who the primary marketing owner is when a company has multiple senior marketing contacts with different scopes. I am confident in the clear CMO, VP, and `Head of Marketing` selections, and more cautious in cases where only specialist marketing leaders were available. With more time, I would add company-domain email checks and a wider set of company-name matching rules for noisier datasets.
