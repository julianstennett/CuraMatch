"""
POST /api/match
Accepts a PatientProfile, returns ranked list of matching trials.
"""

from fastapi import APIRouter, HTTPException
from models.patient import PatientProfile
from models.trial import Trial
from services.sphinx_search import search_trials

router = APIRouter(prefix="/api/match", tags=["matching"])


@router.post("", response_model=list[Trial])
async def match_trials(profile: PatientProfile):
    # Build keyword string from profile conditions and medications
    keyword_parts = list(profile.conditions) + list(profile.medications)
    keywords = " ".join(keyword_parts).strip() or "type 2 diabetes"

    try:
        hits = search_trials(
            keywords=keywords,
            age=profile.age,
            sex=profile.sex,
            healthy_volunteer=profile.healthy_volunteer,
            limit=25,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    return [Trial(**h) for h in hits]
