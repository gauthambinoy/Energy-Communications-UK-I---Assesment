"""
Energy Communications — Task 2: LinkedIn Data Cleaning Pipeline
================================================================

A Python data cleaning and processing pipeline that transforms raw LinkedIn
marketing contact data into a clean, one-row-per-company output CSV.

Data Quality Issues Identified:
    - Duplicate profiles: same person scraped on multiple dates (e.g. Sarah Murphy
      on 2025-09-12 and 2025-09-14). Resolved by keeping the latest scrape but
      preserving corporate emails from earlier entries.
    - Name formatting: ALL CAPS ("JAMES O'BRIEN"), extra whitespace ("Sarah   Murphy"),
      title prefixes ("Dr. Conor Walsh"), and mixed case ("ROisIN DALY").
    - Headline noise: job titles mixed with company names ("Head of Marketing at
      Accenture Ireland"), skill lists ("VP Marketing | B2B SaaS | Demand Gen"),
      and HTML entities ("Marketing &amp; Communications Director").
    - Invalid emails: phone numbers in the email field ("+353 87 123 4567"),
      personal emails ("aoifebrennan1985@gmail.com") where the brief requires
      corporate or empty string.
    - Junk rows: LinkedIn Ads placements, placeholder entries with names like
      "-" and "N/A", and non-marketing roles (Software Engineer, CFO, CEO, HR).
    - Company inconsistencies: "SAP Ireland" vs "SAP", missing company names
      that can be extracted from the headline text.

Assumptions & Judgement Calls:
    - "Senior marketing role" is defined as Director-level and above: CMO, VP,
      Director, and Head-of roles. Manager-level roles were excluded as they
      typically do not own company-wide marketing strategy.
    - Personal emails (gmail.com, yahoo.com, etc.) are set to empty string per
      the brief's rule: "empty string if only a personal email was found".
    - When multiple marketing contacts exist for one company, seniority is ranked:
      CMO (tier 1) > VP (tier 2) > Director (tier 3) > Head of (tier 4).

Confidence & Next Steps:
    - High confidence for clear senior roles (CMO, VP, Director). Edge cases like
      "Head of Marketing Automation" required judgement — included as a leadership
      role over a marketing function.
    - With more time: fuzzy matching (fuzzywuzzy) for company name deduplication,
      email domain validation against known company domains, and unit tests for
      each cleaning function.

Usage:
    pip install -r requirements.txt
    python pipeline.py
"""

import pandas as pd
import re
import html


# =============================================================================
# PART A — Data Inspection & Cleaning
# =============================================================================
# This section handles:
#   1. Loading the raw CSV and printing a diagnostic overview
#   2. Removing rows that are not real contacts (ads, placeholders, junk)
# =============================================================================


def load_and_inspect(filepath):
    """
    Load the raw CSV and print a diagnostic summary.

    Prints:
        - Shape (row count x column count)
        - Data types of each column
        - Count of missing values per column
        - First 5 rows as a preview

    Args:
        filepath: path to the raw LinkedIn CSV file

    Returns:
        pandas DataFrame with all raw data loaded
    """
    df = pd.read_csv(filepath)

    print("=" * 60)
    print("INITIAL DATA INSPECTION")
    print("=" * 60)

    # Shape tells us how much data we're working with
    print(f"\nShape: {df.shape[0]} rows x {df.shape[1]} columns")

    # Data types help us spot columns that should be dates, numbers, etc.
    print(f"\nColumn types:\n{df.dtypes}")

    # Missing value counts reveal which columns have gaps we need to handle
    print(f"\nMissing values per column:\n{df.isnull().sum()}")

    # A quick preview to visually spot obvious issues
    print(f"\nSample of first 5 rows:\n{df.head().to_string()}")
    print("=" * 60)

    return df


def remove_junk_rows(df):
    """
    Remove rows that are clearly not real contacts.

    Three categories of junk exist in this dataset:
        1. Fake names — entries like "N/A", "-", or empty strings where a real
           person's name should be. These are artefacts of the scraping tool
           encountering profiles it couldn't parse.
        2. Ad placements — LinkedIn injects sponsored content rows into search
           results. The scraper captured one: "This is a LinkedIn Ads placement".
        3. Sponsored headlines — a secondary check to catch any ad row that
           might have a plausible-looking name but a giveaway headline.

    Args:
        df: raw DataFrame after loading

    Returns:
        DataFrame with junk rows removed
    """
    original_count = len(df)

    # --- 1. Remove rows with fake/missing names ---
    # The CSV contains "N/A" (row 21) and "-" (row 47) as names.
    # These are not real people — just placeholder entries from the scraper.
    junk_names = ['n/a', '-', '']
    df = df[~df['raw_name'].str.strip().str.lower().isin(junk_names)]

    # --- 2. Remove LinkedIn Ads placement ---
    # Row 52 has raw_name = "This is a LinkedIn Ads placement".
    # This is an advertisement that the scraping tool mistakenly captured.
    df = df[~df['raw_name'].str.contains('LinkedIn Ads', case=False, na=False)]

    # --- 3. Remove any row with a "Sponsored Content" headline ---
    # Safety net: catches ad rows even if the name field looks normal.
    df = df[~df['headline'].str.contains('Sponsored Content', case=False, na=False)]

    removed = original_count - len(df)
    print(f"\n[remove_junk_rows] Removed {removed} junk rows. {len(df)} rows remaining.")
    return df

    # =============================================================================
# TEMPORARY TEST — remove later as we add more functions
# =============================================================================

if __name__ == '__main__':
    df = load_and_inspect('linkedin_raw_data.csv')
    df = remove_junk_rows(df)

    print("\nRemaining contacts:")
    for name in df['raw_name'].tolist():
        print(f"  {name}")

    