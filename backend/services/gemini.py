"""
Gemini service — wraps google-generativeai for two tasks:
  1. parse_patient_intake()  → structured PatientProfile from free text
  2. explain_trial_match()   → plain-English eligibility explanation
"""

import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

from models.patient import PatientProfile

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")
if _api_key:
    genai.configure(api_key=_api_key)

_model = genai.GenerativeModel('gemini-3-flash-preview')

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_json(text: str) -> dict:
    """Pull the first JSON object out of a model response string."""
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON found in model response:\n{text}")
    return json.loads(match.group())


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def parse_patient_intake(free_text: str) -> PatientProfile:
    """
    Ask Gemini to extract a structured patient profile from free-form text.
    Returns a PatientProfile Pydantic model.
    """
    prompt = f"""You are a medical data extraction assistant.
Extract structured information from the patient description below and return ONLY valid JSON.

Patient description:
\"\"\"
{free_text}
\"\"\"

Return a JSON object with these exact keys (use null if unknown):
{{
  "age": <integer or null>,
  "sex": <"Male" | "Female">,
  "conditions": [<list of medical conditions as strings>],
  "medications": [<list of medications as strings>],
  "hba1c": <float>,
  "bmi": <float>,
  "diabetes_duration_years": <integer or null>,
  "healthy_volunteer": <true | false>,
  "additional_notes": <string or null>,

  "state": <2-letter US state code or null>,
  "on_insulin": <true | false>,
  "recent_glp1": <true | false>,
  "ckd": <true | false>,
  "pregnant": <true | false>,
  "type1_diabetes": <true | false>,
  "on_metformin": <true | false>,
  "stable_metformin": <true | false>
}}

Return ONLY the JSON object, no explanation."""

    response = _model.generate_content(prompt)
    data = _extract_json(response.text)
    return PatientProfile(**data)


async def explain_trial_match(
    patient_profile: dict,
    trial_title: str,
    brief_summary: str,
    eligibility: str,
    nct_id: str,
) -> dict:
    """
    Ask Gemini to explain how well this trial matches the patient,
    listing pros/cons and a plain-English eligibility assessment.
    """
    prompt = f"""You are a clinical trial eligibility advisor helping patients understand if a trial is right for them.

PATIENT PROFILE:
{json.dumps(patient_profile, indent=2)}

CLINICAL TRIAL: {nct_id}
Title: {trial_title}

Brief Summary:
{brief_summary}

Eligibility Criteria:
{eligibility}

Please provide:
1. A plain-English summary of what this trial is studying (2-3 sentences).
2. An assessment of whether this patient LIKELY QUALIFIES, MIGHT QUALIFY, or LIKELY DOES NOT QUALIFY.
3. Key reasons the patient may qualify (bullet points).
4. Key potential barriers to eligibility (bullet points).
5. A recommended next step for the patient.

Format your response as JSON:
{{
  "trial_summary": "<string>",
  "eligibility_verdict": "LIKELY QUALIFIES" | "MIGHT QUALIFY" | "LIKELY DOES NOT QUALIFY",
  "qualifying_factors": ["<string>", ...],
  "potential_barriers": ["<string>", ...],
  "next_step": "<string>"
}}

Return ONLY the JSON."""

    response = _model.generate_content(prompt)
    data = _extract_json(response.text)
    return data


async def generate_search_keywords(patient_profile: dict) -> str:
    """Distill a patient profile into search keywords for the trial index."""
    prompt = f"""Given this patient profile, generate a short list of medical search keywords
(conditions, treatments, biomarkers) suitable for searching a clinical trial database.
Return ONLY a plain space-separated string of keywords, no JSON, no explanation.

Patient profile:
{json.dumps(patient_profile, indent=2)}"""

    response = _model.generate_content(prompt)
    return response.text.strip()
