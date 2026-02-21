import os
import pandas as pd
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

CSV_PATH = os.getenv("CSV_PATH", "./t2d_trials_us.csv")

_df: pd.DataFrame | None = None


def _clean_age(val) -> int | None:
    """Parse age strings like '18 Years' → 18."""
    if pd.isna(val):
        return None
    s = str(val).strip()
    for part in s.split():
        try:
            return int(part)
        except ValueError:
            continue
    return None


def load_trials() -> pd.DataFrame:
    global _df
    if _df is not None:
        return _df

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"Trial CSV not found at '{CSV_PATH}'. "
            "Set CSV_PATH in .env to point to your t2d_trials_us.csv file."
        )

    df = pd.read_csv(CSV_PATH)

    # Normalise column names (strip whitespace, lowercase)
    df.columns = [c.strip() for c in df.columns]

    rename_map = {
        "NCT_ID": "nct_id",
        "Title": "title",
        "Last_Updated": "last_updated",
        "US_Cities": "us_cities",
        "Eligibility": "eligibility",
        "Min_Age": "min_age",
        "Max_Age": "max_age",
        "Sex": "sex",
        "Healthy_Volunteers": "healthy_volunteers",
        "Phase": "phase",
        "Study_Type": "study_type",
        "Brief_Summary": "brief_summary",
    }
    df = df.rename(columns=rename_map)

    # Parse ages to integers
    df["min_age"] = df["min_age"].apply(_clean_age)
    df["max_age"] = df["max_age"].apply(_clean_age)

    # Fill NaN strings
    for col in ["title", "us_cities", "eligibility", "brief_summary", "phase", "study_type", "sex", "healthy_volunteers"]:
        if col in df.columns:
            df[col] = df[col].fillna("")

    _df = df
    return _df


def get_trial_by_id(nct_id: str) -> dict | None:
    df = load_trials()
    row = df[df["nct_id"] == nct_id]
    if row.empty:
        return None
    return row.iloc[0].to_dict()
