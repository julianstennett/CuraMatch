from pydantic import BaseModel
from typing import Optional


class PatientIntakeRaw(BaseModel):
    """Free-text patient intake submitted from the frontend."""
    free_text: str


class PatientProfile(BaseModel):
    """Structured patient profile extracted by Gemini from free text."""
    age: Optional[int] = None
    sex: Optional[str] = None          # "Male" | "Female" | "All"
    conditions: list[str] = []
    medications: list[str] = []
    hba1c: Optional[float] = None      # % – T2D specific
    bmi: Optional[float] = None
    diabetes_duration_years: Optional[int] = None
    healthy_volunteer: bool = False
    additional_notes: Optional[str] = None
