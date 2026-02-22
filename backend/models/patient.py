from pydantic import BaseModel
from typing import Optional


class PatientIntakeRaw(BaseModel):
    """Free-text patient intake submitted from the frontend."""
    free_text: str

class PatientProfile(BaseModel):
    age: Optional[int] = None
    hba1c: Optional[float] = None
    bmi: Optional[float] = None
    state: Optional[str] = None

    on_insulin: bool = False
    recent_glp1: bool = False
    ckd: bool = False
    pregnant: bool = False
    type1_diabetes: bool = False
    on_metformin: bool = False
    stable_metformin: bool = False