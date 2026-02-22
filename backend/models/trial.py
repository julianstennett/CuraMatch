from pydantic import BaseModel
from typing import Optional


class Trial(BaseModel):
    nct_id: str
    title: str
    last_updated: Optional[str] = None
    us_cities: Optional[str] = None
    eligibility: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    sex: Optional[str] = None
    healthy_volunteers: Optional[str] = None
    phase: Optional[str] = None
    study_type: Optional[str] = None
    brief_summary: Optional[str] = None
    match_score: Optional[float] = None
    confidence: Optional[str] = None
    probability: Optional[float] = None


class TrialExplainRequest(BaseModel):
    nct_id: str
    title: str
    brief_summary: Optional[str] = None
    eligibility: Optional[str] = None
    patient_profile: dict
