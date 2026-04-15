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
# PART A.2 — Name Cleaning
# =============================================================================
# The raw_name column has several issues that need to be resolved:
#   - Excess whitespace: "Sarah   Murphy" should be "Sarah Murphy"
#   - ALL CAPS: "JAMES O'BRIEN" should be "James O'Brien"
#   - Mixed case: "ROisIN DALY" should be "Roisin Daly"
#   - Title prefixes: "Dr. Conor Walsh" should be "Conor Walsh"
#
# The cleaning order matters:
#   1. Strip outer whitespace first (so regex anchors work correctly)
#   2. Remove title prefixes (before collapsing spaces, so "Dr. " doesn't
#      leave a leading space)
#   3. Collapse internal whitespace (after prefix removal)
#   4. Apply title case last (operates on the fully cleaned string)
# =============================================================================


def clean_names(df):
    """
    Clean the raw_name column: strip whitespace, remove titles, fix casing.

    Cleaning steps (in order):
        1. Strip leading and trailing whitespace from each name
        2. Remove honorific prefixes (Dr., Mr., Mrs., Ms., Prof.)
           — e.g. "Dr. Conor Walsh" becomes "Conor Walsh"
        3. Collapse multiple internal spaces into a single space
           — e.g. "Sarah   Murphy" becomes "Sarah Murphy"
        4. Convert to title case for consistent formatting
           — e.g. "JAMES O'BRIEN" becomes "James O'Brien"
           — e.g. "ROisIN DALY" becomes "Roisin Daly"

    Args:
        df: DataFrame after junk row removal

    Returns:
        DataFrame with cleaned names in the raw_name column
    """
    # --- Step 1: Strip outer whitespace ---
    # Some names have leading/trailing spaces from the scraping tool.
    df['raw_name'] = df['raw_name'].str.strip()

    # --- Step 2: Remove title prefixes ---
    # "Dr. Conor Walsh" → "Conor Walsh"
    # The regex matches: start of string (^), then Dr/Mr/Mrs/Ms/Prof,
    # optionally followed by a period (\.?), then any trailing spaces (\s*).
    # This removes the title and any space after it in one pass.
    df['raw_name'] = df['raw_name'].str.replace(
        r'^(Dr|Mr|Mrs|Ms|Prof)\.?\s*', '', regex=True
    )

    # --- Step 3: Collapse multiple spaces into one ---
    # "Sarah   Murphy" → "Sarah Murphy"
    # "CLAIRE  O'SULLIVAN" → "CLAIRE O'SULLIVAN"
    # \s+ matches one or more whitespace characters (spaces, tabs, etc.)
    df['raw_name'] = df['raw_name'].str.replace(r'\s+', ' ', regex=True)

    # --- Step 4: Apply title case ---
    # "JAMES O'BRIEN" → "James O'Brien"
    # "ROisIN DALY" → "Roisin Daly"
    # Python's .title() capitalises the first letter of each word,
    # which correctly handles Irish names like O'Brien (the B stays capital
    # because the apostrophe acts as a word boundary).
    df['raw_name'] = df['raw_name'].str.title()

    # --- Step 5: Final strip as a safety net ---
    df['raw_name'] = df['raw_name'].str.strip()

    print(f"\n[clean_names] Names cleaned. Sample:")
    for name in df['raw_name'].head(10).tolist():
        print(f"  {name}")

    return df


# =============================================================================
# PART A.3 — Headline / Job Title Extraction
# =============================================================================
# LinkedIn headlines are NOT clean job titles. They contain a mix of:
#   - Job title + company: "Head of Marketing at Accenture Ireland"
#   - Job title + skills: "VP Marketing | B2B SaaS | Demand Generation"
#   - Job title + company via dash: "Marketing Director - Salesforce EMEA"
#   - HTML entities: "Marketing &amp; Communications Director"
#   - Pronoun tags: "Marketing Director (she/her)"
#
# Strategy: decode HTML first, then peel off noise layer by layer.
# We split on common separators (" at ", " - ", " | ") and keep only the
# first segment — which is almost always the actual job title.
#
# Important: "Director, Marketing Operations" uses a comma as part of the
# title itself, so we must NOT split on commas.
# =============================================================================


def clean_headlines(df):
    """
    Extract a clean job title from the messy headline field.

    The headline column contains raw LinkedIn headlines that mix job titles
    with company names, skill lists, pronouns, and HTML artefacts. This
    function extracts just the job title portion.

    Processing order:
        1. Decode HTML entities ("&amp;" → "&")
        2. Remove pronoun tags like "(she/her)"
        3. Split on " at " to remove company names
        4. Split on " - " to remove company/region suffixes
        5. Split on " | " to remove skill lists and buzzwords

    Args:
        df: DataFrame after name cleaning

    Returns:
        DataFrame with a new 'job_title' column containing clean titles
    """

    def extract_title(headline):
        """
        Process a single headline string and return just the job title.

        Args:
            headline: raw headline string from LinkedIn (may contain HTML,
                      company names, skill tags, pronoun labels, etc.)

        Returns:
            Cleaned job title string, or empty string if headline is missing
        """
        # Handle missing headlines gracefully
        if pd.isna(headline):
            return ''

        # --- Step 1: Decode HTML entities ---
        # The scraper captured "&amp;" instead of "&" because LinkedIn's
        # HTML source uses encoded entities.
        # "Marketing &amp; Communications Director" → "Marketing & Communications Director"
        title = html.unescape(headline)

        # --- Step 2: Remove pronoun labels ---
        # Some people add "(she/her)", "(he/him)", or "(they/them)" to their
        # headline. These are not part of the job title.
        # "Marketing Director (she/her)" → "Marketing Director"
        title = re.sub(
            r'\(she/her\)|\(he/him\)|\(they/them\)',
            '', title, flags=re.IGNORECASE
        )

        # --- Step 3: Split on " at " → remove company name ---
        # "Head of Marketing at Accenture Ireland" → "Head of Marketing"
        # "VP of Marketing at LinkedIn" → "VP of Marketing"
        # We take the FIRST part (everything before " at ").
        if ' at ' in title:
            title = title.split(' at ')[0]

        # --- Step 4: Split on " - " → remove company/region suffix ---
        # "Marketing Director - Salesforce EMEA" → "Marketing Director"
        # "Head of Marketing - EMEA" → "Head of Marketing"
        # "Head of Marketing - Primark" → "Head of Marketing"
        if ' - ' in title:
            title = title.split(' - ')[0]

        # --- Step 5: Split on " | " → remove skill lists ---
        # "VP Marketing | B2B SaaS | Demand Gen | HubSpot" → "VP Marketing"
        # "Head of Content Marketing | B2B | SaaS" → "Head of Content Marketing"
        # "Digital Marketing Manager | SEO | PPC | Content" → "Digital Marketing Manager"
        if ' | ' in title:
            title = title.split(' | ')[0]

        # Final cleanup: strip any leftover whitespace
        title = title.strip()

        return title

    # Apply the extraction function to every row in the headline column.
    # The result goes into a new column called 'job_title'.
    df['job_title'] = df['headline'].apply(extract_title)

    # Print a before/after comparison so we can visually verify the extraction
    print(f"\n[clean_headlines] Job titles extracted. Before → After:")
    for _, row in df.head(15).iterrows():
        print(f"  '{row['headline']}'")
        print(f"      → '{row['job_title']}'")

    return df


# =============================================================================
# TEMPORARY TEST — will be replaced with the full pipeline later
# =============================================================================

if __name__ == '__main__':
    df = load_and_inspect('linkedin_raw_data.csv')
    df = remove_junk_rows(df)
    df = clean_names(df)
    df = clean_headlines(df)

    # Verify: print cleaned name + extracted job title side by side
    print("\n" + "=" * 60)
    print("CLEANED NAMES + EXTRACTED TITLES")
    print("=" * 60)
    for _, row in df.iterrows():
        print(f"  {row['raw_name']:30s} | {row['job_title']}")

    