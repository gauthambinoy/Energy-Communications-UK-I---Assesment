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
    - When multiple marketing contacts exist for one company, broad company-wide
      marketing ownership is preferred over narrower specialist leadership.
      Final selection is deterministic: role score > corporate email present >
      latest scrape date > alphabetical fallback.

Confidence & Next Steps:
    - High confidence for clear senior roles (CMO, VP, Head of Marketing,
      Marketing Director). Functional specialist roles are kept only when they
      are the strongest senior marketing contact available for a company.
    - With more time: company-domain validation for emails and broader fuzzy
      matching for company-name variants across larger datasets.

Usage:
    pip install -r requirements.txt
    python pipeline.py
"""

import pandas as pd
import re
import html


RAW_INPUT_PATH = 'linkedin_raw_data.csv'
OUTPUT_PATH = 'marketing_contacts_clean.csv'
EXPECTED_OUTPUT_COLUMNS = [
    'company_name', 'contact_name', 'job_title', 'email', 'linkedin_url'
]
ALLOWED_UPPERCASE_COMPANIES = {'AIB', 'CRH', 'SAP'}
PERSONAL_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'mail.com', 'protonmail.com', 'live.com',
}
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
LINKEDIN_PROFILE_REGEX = re.compile(r'^https://linkedin\.com/in/[^/\s]+/?$')


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

    # --- 1. Remove rows where name is completely missing (NaN) ---
    # pandas automatically converts "N/A" in CSV to NaN when reading.
    # Row 21 had raw_name = "N/A" which became NaN. Drop these first.
    df = df[df['raw_name'].notna()]

    # --- 2. Remove rows with fake/placeholder names ---
    # The CSV contains "-" (row 47) as a name and possibly empty strings.
    # These are not real people — just placeholder entries from the scraper.
    junk_names = ['-', '']
    df = df[~df['raw_name'].str.strip().str.lower().isin(junk_names)]

    # --- 3. Remove LinkedIn Ads placement ---
    # Row 52 has raw_name = "This is a LinkedIn Ads placement".
    # This is an advertisement that the scraping tool mistakenly captured.
    df = df[~df['raw_name'].str.contains('LinkedIn Ads', case=False, na=False)]

    # --- 4. Remove any row with a "Sponsored Content" headline ---
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
# PART A.4 — Company Name Standardisation
# =============================================================================
# Two problems exist in the company_name column:
#
#   1. Missing values — 6 rows have no company at all, but the headline often
#      reveals it. Example: Patrick Nolan's company is blank, but his headline
#      says "VP of Marketing at LinkedIn". We extract "LinkedIn" from there.
#
#   2. Variant spellings — the same company appears under different names:
#        "SAP Ireland" and "SAP" → same company
#        "Google Ireland" and "Google" → same company
#        "LinkedIn Ireland" and "LinkedIn" → same company
#      If we don't merge these, the final output would have duplicate companies.
#
# We handle (1) first so the extraction can feed into (2).
# =============================================================================


def standardise_companies(df):
    """
    Fill missing company names from headlines and map variants to canonical names.

    Two-pass approach:
        Pass 1 — Fill blanks: if company_name is empty but the headline contains
                 " at Company" or " - Company", extract the company portion.
        Pass 2 — Normalise: map known variant names to a single canonical form
                 so "SAP Ireland" and "SAP" are treated as the same company.

    Args:
        df: DataFrame after headline cleaning

    Returns:
        DataFrame with standardised company names
    """

    # --- Pass 1: Fill missing company names from the headline ---
    # Some rows have a blank company_name, but the headline contains it.
    # Example: headline = "VP of Marketing at LinkedIn" → company = "LinkedIn"
    # Example: headline = "CTO at CRH" → company = "CRH"
    def extract_company_from_headline(row):
        # If the company already exists and is not blank, keep it as-is
        if pd.notna(row['company_name']) and str(row['company_name']).strip() != '':
            return row['company_name'].strip()

        headline = str(row['headline']) if pd.notna(row['headline']) else ''

        # Try " at " first — "VP of Marketing at LinkedIn" → take "LinkedIn"
        if ' at ' in headline:
            return headline.split(' at ')[-1].strip()

        # Try " - " second — "Sales Director - Total Produce" → take "Total Produce"
        if ' - ' in headline:
            return headline.split(' - ')[-1].strip()

        # Could not extract — return whatever was there (may still be NaN)
        return row['company_name']

    df['company_name'] = df.apply(extract_company_from_headline, axis=1)

    # --- Pass 2: Map variant names to canonical form ---
    # These mappings were identified by inspecting the unique company names
    # in the dataset and grouping those that refer to the same organisation.
    COMPANY_MAP = {
        'Google Ireland': 'Google',
        'Meta Ireland': 'Meta',
        'LinkedIn Ireland': 'LinkedIn',
        'SAP Ireland': 'SAP',
        'Oracle Ireland': 'Oracle',
    }

    df['company_name'] = df['company_name'].replace(COMPANY_MAP)

    # --- Final cleanup: strip whitespace from all company names ---
    df['company_name'] = df['company_name'].str.strip()

    print(f"\n[standardise_companies] {df['company_name'].nunique()} unique companies.")
    print(f"  Companies: {sorted(df['company_name'].dropna().unique())}")

    return df


# =============================================================================
# PART A.5 — Email Validation
# =============================================================================
# The email column contains three types of bad data:
#
#   1. Phone numbers — Aoife Brennan's "email" is "+353 87 123 4567".
#      The scraping tool put it in the wrong column.
#
#   2. Personal emails — "aoifebrennan1985@gmail.com" is a personal address.
#      The brief explicitly says: "email should be empty string if not available
#      or if only a personal email was found."
#
#   3. Missing/empty values — many rows have no email. These become "".
#
# Strategy: validate against an email regex, then check the domain against
# a list of known personal email providers.
# =============================================================================


def validate_emails(df):
    """
    Validate email format and reject phone numbers and personal emails.

    Validation rules:
        1. Must match a standard email regex (letters@domain.tld)
           — rejects phone numbers, random text, etc.
        2. Domain must not be a personal email provider (gmail, yahoo, etc.)
           — the brief says to use empty string for personal emails
        3. Missing or invalid values are set to empty string (not NaN)

    Args:
        df: DataFrame after company standardisation

    Returns:
        DataFrame with validated emails (invalid ones set to empty string)
    """
    def clean_email(email):
        """Validate a single email value. Returns cleaned email or empty string."""
        # Handle missing values
        if pd.isna(email) or str(email).strip() == '':
            return ''

        email = str(email).strip()

        # Check against email format — rejects "+353 87 123 4567" etc.
        if not EMAIL_REGEX.match(email):
            return ''

        # Check if it's a personal email — rejects "aoifebrennan1985@gmail.com"
        domain = email.split('@')[1].lower()
        if domain in PERSONAL_EMAIL_DOMAINS:
            return ''

        # Valid corporate email — normalise to lowercase
        return email.lower()

    df['email'] = df['email'].apply(clean_email)

    valid_count = (df['email'] != '').sum()
    print(f"\n[validate_emails] {valid_count} valid corporate emails found.")

    return df


# =============================================================================
# PART A.6 — Deduplication
# =============================================================================
# The LinkedIn data was scraped on multiple dates. The same person can appear
# two or three times with slightly different data:
#
#   Sarah Murphy    | Accenture  | 2025-09-12
#   Sarah Murphy    | Accenture  | 2025-09-14    ← duplicate scrape
#
#   Aoife Brennan   | Salesforce | 2025-09-12
#   Aoife Brennan   | Salesforce | 2025-09-16    ← duplicate
#   Aoife Brennan   | Salesforce | 2025-09-18    ← duplicate (has gmail)
#
# Strategy:
#   1. Group rows by (normalised name + normalised company)
#   2. Sort each group by scraped_at descending (latest first)
#   3. Keep the latest row (most up-to-date profile info)
#   4. BUT if the latest row lost its email, check earlier rows for one
#      — this "email merging" prevents us from losing useful contact data
# =============================================================================


def deduplicate(df):
    """
    Remove duplicate profiles where the same person was scraped multiple times.

    Deduplication logic:
        1. Create normalised keys (lowercase name + company) for matching
        2. Sort by scrape date descending so the freshest data comes first
        3. For each person+company group, keep the latest row
        4. If the latest row has no email but an earlier row does, preserve
           the earlier email (avoids losing useful contact information)

    Args:
        df: DataFrame after email validation

    Returns:
        DataFrame with one row per unique person+company combination
    """
    # --- Step 1: Create normalised keys for matching ---
    # We compare in lowercase so "JAMES O'BRIEN" matches "James O'Brien"
    df['_name_key'] = df['raw_name'].str.lower().str.strip()
    df['_company_key'] = df['company_name'].str.lower().str.strip()

    # --- Step 2: Sort by scrape date descending (latest first) ---
    df = df.sort_values('scraped_at', ascending=False)

    # --- Step 3: For each group, pick the best row ---
    def pick_best_row(group):
        """
        From a group of duplicate rows (same person + company), select
        the most recent one. If it has no email, try to recover one from
        an earlier scrape.
        """
        # First row is the latest because we sorted descending
        best = group.iloc[0].copy()

        # If the latest row has no email, check older rows for one.
        # This handles cases where an earlier scrape captured the email
        # but the latest scrape did not.
        if best['email'] == '' or pd.isna(best['email']):
            for _, row in group.iloc[1:].iterrows():
                if row['email'] != '' and pd.notna(row['email']):
                    best['email'] = row['email']
                    break  # Use the first valid email found

        return best

    before = len(df)
    df = df.groupby(['_name_key', '_company_key'], sort=False).apply(
        pick_best_row
    ).reset_index(drop=True)
    after = len(df)

    # --- Step 4: Clean up temporary columns ---
    # After groupby, these columns may or may not still exist depending on
    # the pandas version. Drop them only if they are present.
    for col in ['_name_key', '_company_key']:
        if col in df.columns:
            df = df.drop(columns=[col])

    print(f"\n[deduplicate] Removed {before - after} duplicates. {after} unique contacts remaining.")

    return df


# =============================================================================
# PART B — Filtering & Role Classification
# =============================================================================
# At this point we have 51 clean, deduplicated contacts. But many are NOT
# senior marketing people. We need to:
#
#   1. Remove anyone who is clearly not in marketing:
#      - Mike Johnson → Software Engineer (tech role)
#      - Brendan Hayes → Chief Financial Officer (finance role)
#      - Declan Moore → CTO (tech role)
#      - Niall Sweeney → Chief Executive Officer (general management)
#      - Amy Walsh → Talent Acquisition Specialist (HR role)
#      - Rachel Murphy → HR Business Partner (HR role)
#      - Barry Connolly → Sales Director (sales, not marketing)
#
#   2. Remove marketing people who are not senior enough:
#      - The brief asks for "the primary marketing decision-maker" — CMO,
#        VP Marketing, Head of Marketing, Marketing Director, or equivalent.
#      - Manager-level roles (Marketing Manager, Brand Manager) are excluded
#        because they typically report to someone more senior.
#
#   3. Pick ONE person per company — the most senior marketing contact.
#
# Seniority tiers (1 = highest, 4 = lowest that still qualifies):
#   Tier 1: CMO / Chief Marketing Officer — the top marketing executive
#   Tier 2: VP Marketing / VP of Marketing — senior leadership level
#   Tier 3: Marketing Director / Director of Marketing — mid-senior
#   Tier 4: Head of Marketing / Head of Growth & Marketing — functional lead
# =============================================================================


# The brief asks for the primary marketing decision-maker.
# The title score below is intentionally more granular than the original
# tier model so we can separate broad company-wide ownership from narrower
# specialist leadership roles.
ROLE_RULES = [
    {'keyword': 'chief marketing officer', 'band': 'CMO', 'score': 100},
    {'keyword': 'cmo', 'band': 'CMO', 'score': 100},
    {'keyword': 'vp of marketing', 'band': 'VP', 'score': 95},
    {'keyword': 'vp marketing emea', 'band': 'VP', 'score': 94},
    {'keyword': 'vp marketing', 'band': 'VP', 'score': 93},
    {'keyword': 'vp brand and marketing', 'band': 'VP', 'score': 92},
    {'keyword': 'vp marketing and partnerships', 'band': 'VP', 'score': 90},
    {'keyword': 'head of marketing and brand', 'band': 'Head', 'score': 86},
    {'keyword': 'head of growth and marketing', 'band': 'Head', 'score': 85},
    {
        'keyword': 'head of marketing and sustainability comms',
        'band': 'Head',
        'score': 84,
    },
    {'keyword': 'head of marketing', 'band': 'Head', 'score': 83},
    {
        'keyword': 'marketing and communications director',
        'band': 'Director',
        'score': 82,
    },
    {'keyword': 'director of marketing', 'band': 'Director', 'score': 81},
    {'keyword': 'marketing director', 'band': 'Director', 'score': 80},
    {'keyword': 'head of b2b marketing', 'band': 'Functional Head', 'score': 78},
    {'keyword': 'head of content marketing', 'band': 'Functional Head', 'score': 77},
    {'keyword': 'head of digital marketing', 'band': 'Functional Head', 'score': 76},
    {
        'keyword': 'digital and performance marketing director',
        'band': 'Functional Director',
        'score': 75,
    },
    {
        'keyword': 'director of demand generation',
        'band': 'Functional Director',
        'score': 74,
    },
    {
        'keyword': 'director marketing operations',
        'band': 'Functional Director',
        'score': 73,
    },
    {
        'keyword': 'head of marketing automation',
        'band': 'Functional Head',
        'score': 72,
    },
]


def normalise_role_text(title):
    """Normalise a job title so role matching is robust to punctuation variants."""
    title = html.unescape(str(title)).lower().strip()
    title = title.replace('&', ' and ')
    title = re.sub(r'[^a-z0-9]+', ' ', title)
    return re.sub(r'\s+', ' ', title).strip()


def get_role_profile(title):
    """Return the first matching role rule for a title, or None if not eligible."""
    if not title or pd.isna(title):
        return None

    normalised_title = normalise_role_text(title)
    for rule in ROLE_RULES:
        if rule['keyword'] in normalised_title:
            return rule

    return None


def classify_marketing_role(title):
    """
    Classify a job title into a broad marketing band.

    The band is used for reporting only. Selection uses the more granular
    numeric role score returned by score_marketing_role().

    Args:
        title: cleaned job title string (from clean_headlines)

    Returns:
        Role band string if the title is a recognised senior marketing role,
        otherwise None.
    """
    profile = get_role_profile(title)
    if not profile:
        return None
    return profile['band']


def score_marketing_role(title):
    """Return a numeric role score used to rank contacts within the same company."""
    profile = get_role_profile(title)
    if not profile:
        return None
    return profile['score']


def filter_senior_marketing(df):
    """
    Keep only contacts who hold a senior marketing role.

    Applies the role rules to every row's job_title. Rows that do not map to
    a recognised senior marketing role are removed.

    This filters out:
        - Non-marketing roles (Software Engineer, CFO, CEO, HR, Sales)
        - Junior marketing roles (Marketing Manager, Marketing Coordinator)
        - Marketing-adjacent but not decision-maker roles (Marketing Lead)

    Args:
        df: DataFrame after deduplication

    Returns:
        DataFrame containing only senior marketing contacts, with
        'role_band' and 'role_score' columns for downstream selection.
    """
    df = df.copy()
    df['role_band'] = df['job_title'].apply(classify_marketing_role)
    df['role_score'] = df['job_title'].apply(score_marketing_role)

    before = len(df)

    # Keep only rows that matched an eligible senior marketing role.
    df = df[df['role_score'].notna()].copy()

    after = len(df)

    print(f"\n[filter_senior_marketing] Kept {after} senior marketing contacts "
          f"(removed {before - after} non-senior/non-marketing roles).")
    print("  Remaining contacts by score:")
    for _, row in df.sort_values(['role_score', 'company_name'], ascending=[False, True]).iterrows():
        print(f"    {int(row['role_score']):>3} ({row['role_band']}): "
              f"{row['raw_name']:25s} — {row['job_title']} ({row['company_name']})")

    return df


def select_most_senior_per_company(df):
    """
    For each company, keep only the primary marketing contact.

    Selection is deterministic and follows the brief's intent:
        1. Highest role_score wins
        2. If scores tie, prefer a row with a corporate email
        3. If still tied, prefer the most recent scrape
        4. Final fallback is alphabetical by contact name

    Args:
        df: DataFrame after filtering to senior marketing roles

    Returns:
        DataFrame with exactly one row per company
    """
    df = df.copy()
    df['has_corporate_email'] = df['email'].fillna('').ne('')
    df['scraped_at_dt'] = pd.to_datetime(df['scraped_at'], errors='coerce')

    # Sort within each company so drop_duplicates keeps the strongest contact.
    df = df.sort_values(
        by=['company_name', 'role_score', 'has_corporate_email', 'scraped_at_dt', 'raw_name'],
        ascending=[True, False, False, False, True],
    )

    before = len(df)

    # Keep the first row per company after deterministic ranking.
    df = df.drop_duplicates(subset='company_name', keep='first')

    after = len(df)

    print(f"\n[select_most_senior_per_company] Selected {after} contacts "
          f"(1 per company, removed {before - after} less-senior duplicates).")
    print("  Final selection:")
    for _, row in df.sort_values('company_name').iterrows():
        print(f"    {row['company_name']:22s} → {row['raw_name']:25s} "
              f"(Score {int(row['role_score'])}: {row['job_title']})")

    df = df.drop(columns=['has_corporate_email', 'scraped_at_dt'])

    return df


def normalise_linkedin_url(url):
    """Ensure a LinkedIn profile URL is either full-format or empty."""
    if pd.isna(url) or str(url).strip() == '':
        return ''

    url = str(url).strip()
    if not url.startswith('http'):
        url = 'https://' + url
    return url


# =============================================================================
# PART C — Final Output Formatting
# =============================================================================
# The brief requires a CSV with exactly these 5 columns:
#
#   company_name   — properly cased, not all caps, not all lower
#   contact_name   — properly cased
#   job_title      — clean title (already done by clean_headlines)
#   email          — corporate email or empty string (not NaN)
#   linkedin_url   — full https:// URL or empty string
#
# Additional formatting rules:
#   - All NaN values → empty string (interviewers must be able to open the
#     CSV in Excel without seeing "NaN" in cells)
#   - LinkedIn URLs must start with "https://" — one row had "linkedin.com/..."
#     without the scheme, which would make the link unclickable
#   - Sort alphabetically by company_name so the output is easy to scan
# =============================================================================


def format_output(df):
    """
    Build the final output DataFrame with exactly the 5 required columns.

    Formatting applied:
        - company_name: title case, stripped whitespace
        - contact_name: taken from cleaned raw_name (already title-cased)
        - job_title: taken as-is from clean_headlines output
        - email: empty string if missing or NaN
        - linkedin_url: normalised to https:// prefix, empty string if missing

    Args:
        df: DataFrame after seniority selection (one row per company)

    Returns:
        Clean DataFrame with exactly 5 columns, sorted by company_name
    """
    result = pd.DataFrame()

    # company_name — apply title case first, then fix known brand names
    # that have non-standard capitalisation (acronyms, camelCase brands).
    # .str.title() would give us "Aib", "Crh", "Hubspot" etc. which are wrong.
    result['company_name'] = df['company_name'].str.strip().str.title()

    # Correct brand names that title case gets wrong
    BRAND_NAME_FIXES = {
        'Aib': 'AIB',
        'Crh': 'CRH',
        'Sap': 'SAP',
        'Hubspot': 'HubSpot',
        'Tiktok': 'TikTok',
        'Linkedin': 'LinkedIn',
        'Smurfit Kappa': 'Smurfit Kappa',   # already correct, kept for clarity
        'Flutter Entertainment': 'Flutter Entertainment',
    }
    result['company_name'] = result['company_name'].replace(BRAND_NAME_FIXES)

    # contact_name — already cleaned and title-cased in clean_names()
    result['contact_name'] = df['raw_name'].str.strip()

    # job_title — already extracted in clean_headlines()
    result['job_title'] = df['job_title'].str.strip()

    # email — replace NaN with empty string so the CSV has "" not "NaN"
    result['email'] = df['email'].fillna('').astype(str)

    # linkedin_url — normalise to full https:// URL or empty string
    result['linkedin_url'] = df['profile_url'].apply(normalise_linkedin_url)

    # Sort alphabetically by company name for a clean, scannable output
    result = result.sort_values('company_name').reset_index(drop=True)

    return result


def is_reasonably_cased_name(value, allow_uppercase=False):
    """Check that output names are readable and not obviously unformatted."""
    if pd.isna(value):
        return False

    value = str(value).strip()
    if value == '':
        return False
    if value.islower():
        return False
    if value.isupper() and not allow_uppercase:
        return False
    return True


def is_valid_output_email(email):
    """Output emails must be either empty or a valid non-personal address."""
    if pd.isna(email) or str(email).strip() == '':
        return True

    email = str(email).strip().lower()
    if not EMAIL_REGEX.match(email):
        return False

    domain = email.split('@')[1]
    return domain not in PERSONAL_EMAIL_DOMAINS


def validate_output(df):
    """
    Validate the final CSV contract before writing it to disk.

    The goal is to fail fast if a future code change breaks any of the
    assessment's explicit output requirements.
    """
    if list(df.columns) != EXPECTED_OUTPUT_COLUMNS:
        raise ValueError(
            'Final output columns do not match the required schema: '
            f'{EXPECTED_OUTPUT_COLUMNS}'
        )

    if df.isnull().any().any():
        raise ValueError('Final output contains NaN values. Use empty strings instead.')

    if df['company_name'].duplicated().any():
        duplicates = sorted(df.loc[df['company_name'].duplicated(), 'company_name'].unique())
        raise ValueError(f'Final output contains duplicate companies: {duplicates}')

    invalid_companies = [
        value for value in df['company_name']
        if not is_reasonably_cased_name(
            value, allow_uppercase=value in ALLOWED_UPPERCASE_COMPANIES
        )
    ]
    if invalid_companies:
        raise ValueError(f'Final output contains badly cased company names: {invalid_companies}')

    invalid_contacts = [
        value for value in df['contact_name']
        if not is_reasonably_cased_name(value)
    ]
    if invalid_contacts:
        raise ValueError(f'Final output contains badly cased contact names: {invalid_contacts}')

    if (df['job_title'].str.strip() == '').any():
        raise ValueError('Final output contains empty job titles.')

    invalid_emails = [email for email in df['email'] if not is_valid_output_email(email)]
    if invalid_emails:
        raise ValueError(f'Final output contains invalid emails: {invalid_emails}')

    invalid_urls = [
        url for url in df['linkedin_url']
        if url != '' and not LINKEDIN_PROFILE_REGEX.match(url)
    ]
    if invalid_urls:
        raise ValueError(f'Final output contains invalid LinkedIn URLs: {invalid_urls}')

    expected_order = sorted(df['company_name'].tolist())
    if df['company_name'].tolist() != expected_order:
        raise ValueError('Final output is not sorted alphabetically by company_name.')


def run_pipeline(input_path=RAW_INPUT_PATH):
    """Run the full pipeline and return a validated output DataFrame."""
    df = load_and_inspect(input_path)
    df = remove_junk_rows(df)
    df = clean_names(df)
    df = clean_headlines(df)
    df = standardise_companies(df)
    df = validate_emails(df)
    df = deduplicate(df)
    df = filter_senior_marketing(df)
    df = select_most_senior_per_company(df)

    result = format_output(df)
    validate_output(result)
    return result


# =============================================================================
# MAIN — Full pipeline entry point
# =============================================================================
# Orchestrates the entire pipeline in order:
#   Part A: Load → Remove junk → Clean names → Extract titles →
#           Standardise companies → Validate emails → Deduplicate
#   Part B: Filter senior marketing roles → Select one per company
#   Part C: Format output → Save CSV
# =============================================================================


def main():
    """
    Run the full LinkedIn data cleaning pipeline end to end.

    Reads RAW_INPUT_PATH from the current directory and writes OUTPUT_PATH
    to the same directory.
    """
    print("Starting LinkedIn data cleaning pipeline...\n")

    result = run_pipeline(RAW_INPUT_PATH)
    result.to_csv(OUTPUT_PATH, index=False)

    # Print a final summary table so we can do a quick visual sanity check
    print(f"\n{'=' * 70}")
    print(f"PIPELINE COMPLETE — {len(result)} companies written to {OUTPUT_PATH}")
    print(f"{'=' * 70}")
    print(result.to_string(index=False))
    print(f"\nSaved: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
