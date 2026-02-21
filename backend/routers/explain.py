"""
POST /api/explain
Accepts a trial + patient profile, returns a Gemini-generated explanation.
"""

from fastapi import APIRouter, HTTPException
from models.trial import TrialExplainRequest
from services.gemini import explain_trial_match

router = APIRouter(prefix="/api/explain", tags=["explain"])


@router.post("")
async def explain(body: TrialExplainRequest):
    try:
        result = await explain_trial_match(
            patient_profile=body.patient_profile,
            trial_title=body.title,
            brief_summary=body.brief_summary or "",
            eligibility=body.eligibility or "",
            nct_id=body.nct_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini explanation failed: {e}")
    return result
