"""
POST /api/match
Accepts a PatientProfile, returns ranked list of matching trials.
"""

from fastapi import APIRouter, HTTPException
import numpy as np
from models.patient import PatientProfile
from models.trial import Trial
from services.sphinx_search import search_trials
from services.score_generator import scoreData

router = APIRouter(prefix="/api/match", tags=["matching"])


@router.post("", response_model=list[Trial])
async def match_trials(profile: PatientProfile):
    # call the scorer with the request data (use dict() so scorer's .get() works)
    annotated = scoreData(profile.dict(), sample_size=50)

    # map CSV-style keys to Trial model keys expected by the response_model
    out = []
    def _to_int(v):
        try:
            if v is None or (isinstance(v, float) and np.isnan(v)):
                return None
            return int(float(v))
        except Exception:
            return None

    def _to_str(v):
        return None if v is None else str(v)

    for r in annotated:
        nct = r.get("NCT_ID") or r.get("nct_id") or r.get("Nct_ID") or ""
        title = r.get("Title") or r.get("title") or r.get("Brief_Summary") or ""
        if not title:
            # fallback to NCT_ID if no descriptive title
            title = nct or "Unknown Trial"

        out.append({
            "nct_id": _to_str(nct),
            "title": _to_str(title),
            "last_updated": _to_str(r.get("Last_Updated") or r.get("last_updated")),
            "us_cities": _to_str(r.get("US_Cities") or r.get("us_cities")),
            "eligibility": _to_str(r.get("Eligibility") or r.get("eligibility")),
            "min_age": _to_int(r.get("Min_Age") or r.get("min_age")),
            "max_age": _to_int(r.get("Max_Age") or r.get("max_age")),
            "sex": _to_str(r.get("Sex") or r.get("sex")),
            "healthy_volunteers": _to_str(r.get("Healthy_Volunteers") or r.get("healthy_volunteers")),
            "phase": _to_str(r.get("Phase") or r.get("phase")),
            "study_type": _to_str(r.get("Study_Type") or r.get("study_type")),
            "brief_summary": _to_str(r.get("Brief_Summary") or r.get("brief_summary")),
            "match_score": float(r.get("match_raw_score") or r.get("match_score") or 0.0),
            "confidence": r.get("match_confidence"),
            "probability": float(r.get("match_probability") or 0.0)
        })
    return out