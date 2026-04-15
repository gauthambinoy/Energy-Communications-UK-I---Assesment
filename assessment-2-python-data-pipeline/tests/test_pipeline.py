import contextlib
import io
import unittest
from pathlib import Path

import pandas as pd

import pipeline


TASK_DIR = Path(__file__).resolve().parent.parent
RAW_INPUT_PATH = TASK_DIR / 'linkedin_raw_data.csv'


def run_pipeline_quietly():
    """Run the full pipeline without flooding test output with diagnostic prints."""
    with contextlib.redirect_stdout(io.StringIO()):
        return pipeline.run_pipeline(str(RAW_INPUT_PATH))


class PipelineUnitTests(unittest.TestCase):
    def test_clean_names_removes_titles_and_normalises_case(self):
        df = pd.DataFrame(
            {
                'raw_name': [' Dr. CONOR  WALSH ', "JAMES O'BRIEN"],
                'headline': ['', ''],
                'company_name': ['Stripe', 'HubSpot'],
                'location': ['', ''],
                'profile_url': ['', ''],
                'email': ['', ''],
                'connection_count': ['', ''],
                'scraped_at': ['2025-09-12', '2025-09-12'],
            }
        )

        cleaned = pipeline.clean_names(df.copy())

        self.assertEqual(cleaned['raw_name'].tolist(), ['Conor Walsh', "James O'Brien"])

    def test_validate_emails_rejects_phone_numbers_and_personal_domains(self):
        df = pd.DataFrame(
            {
                'email': [
                    '+353 87 123 4567',
                    'aoifebrennan1985@gmail.com',
                    'Michelle.Grant@Workday.com',
                ]
            }
        )

        cleaned = pipeline.validate_emails(df.copy())

        self.assertEqual(cleaned['email'].tolist(), ['', '', 'michelle.grant@workday.com'])

    def test_role_scoring_prefers_broad_ownership_over_specialist_scope(self):
        self.assertGreater(
            pipeline.score_marketing_role('Head of Marketing'),
            pipeline.score_marketing_role('Head of Marketing Automation'),
        )
        self.assertGreater(
            pipeline.score_marketing_role('Head of Marketing'),
            pipeline.score_marketing_role('Digital & Performance Marketing Director'),
        )
        self.assertGreater(
            pipeline.score_marketing_role('Marketing Director'),
            pipeline.score_marketing_role('Director of Demand Generation'),
        )

    def test_validate_output_rejects_duplicate_companies(self):
        invalid_output = pd.DataFrame(
            {
                'company_name': ['AIB', 'AIB'],
                'contact_name': ['Cillian Burke', 'Fionnuala Brennan'],
                'job_title': ['Head of Marketing', 'Marketing Director'],
                'email': ['cillian.burke@aib.ie', ''],
                'linkedin_url': [
                    'https://linkedin.com/in/cillianburke',
                    'https://linkedin.com/in/fionnualabrennan',
                ],
            }
        )

        with self.assertRaisesRegex(ValueError, 'duplicate companies'):
            pipeline.validate_output(invalid_output)


class PipelineIntegrationTests(unittest.TestCase):
    def test_full_pipeline_returns_expected_primary_contacts(self):
        result = run_pipeline_quietly().set_index('company_name')

        self.assertEqual(result.loc['AIB', 'contact_name'], 'Cillian Burke')
        self.assertEqual(result.loc['Primark', 'contact_name'], 'Rachel Murray')
        self.assertEqual(result.loc['Kingspan', 'contact_name'], 'Alan Meehan')
        self.assertEqual(result.loc['Salesforce', 'contact_name'], 'Aoife Brennan')

    def test_full_pipeline_returns_valid_output_contract(self):
        result = run_pipeline_quietly()

        self.assertEqual(list(result.columns), pipeline.EXPECTED_OUTPUT_COLUMNS)
        self.assertEqual(len(result), result['company_name'].nunique())
        self.assertEqual(result['company_name'].tolist(), sorted(result['company_name'].tolist()))


if __name__ == '__main__':
    unittest.main()
