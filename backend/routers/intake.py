"""
POST /api/intake
Accepts free-text patient description, returns structured PatientProfile.
"""

from fastapi import APIRouter, HTTPException
from models.patient import PatientIntakeRaw, PatientProfile
from services.gemini import parse_patient_intake

router = APIRouter(prefix="/api/intake", tags=["intake"])


@router.post("", response_model=PatientProfile)
async def intake(body: PatientIntakeRaw):
    if not body.free_text.strip():
        raise HTTPException(status_code=400, detail="free_text cannot be empty.")
    try:
        profile = await parse_patient_intake(body.free_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini parsing failed: {e}")
    return profile
