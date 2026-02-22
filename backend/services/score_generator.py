from typing import Tuple, Dict, Any, List
import math
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import pandas as pd
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "..", "t2d_trials_us.csv")

# --- configuration / weights (unchanged) ---
structured_weights = {
    "age": 15,
    "hba1c": 25,
    "bmi": 10,
    "medication": 15,
    "geography": 10
}
assert sum(structured_weights.values()) == 75, "Structured weights must sum to 60"
semantic_weight = 25
assert sum(structured_weights.values()) + semantic_weight == 100, \
    "Total scoring must equal 100"

age_partial_margin = 3.0     # years
hba1c_partial_margin = 0.5   # percentage points
bmi_partial_margin = 2.0     # BMI units

# --- neighbor states map (unchanged) ---
NEIGHBOR_STATES = {
    "AL": ["FL", "GA", "MS", "TN"],
    "AZ": ["CA", "NV", "UT", "NM", "CO"],
    "AR": ["MO", "TN", "MS", "LA", "TX", "OK"],
    "CA": ["OR", "NV", "AZ"],
    "CO": ["WY", "NE", "KS", "OK", "NM", "AZ", "UT"],
    "CT": ["NY", "MA", "RI"],
    "DE": ["MD", "NJ", "PA"],
    "FL": ["GA", "AL"],
    "GA": ["FL", "AL", "TN", "SC", "NC"],
    "ID": ["WA", "OR", "NV", "UT", "WY", "MT"],
    "IL": ["WI", "IA", "MO", "KY", "IN"],
    "IN": ["MI", "OH", "KY", "IL"],
    "IA": ["MN", "SD", "NE", "MO", "IL", "WI"],
    "KS": ["NE", "MO", "OK", "CO"],
    "KY": ["IL", "IN", "OH", "WV", "VA", "TN", "MO"],
    "LA": ["TX", "AR", "MS"],
    "ME": ["NH"],
    "MD": ["VA", "WV", "PA", "DE"],
    "MA": ["NY", "VT", "NH", "CT", "RI"],
    "MI": ["OH", "IN", "WI"],
    "MN": ["ND", "SD", "IA", "WI"],
    "MS": ["LA", "AR", "TN", "AL"],
    "MO": ["IA", "IL", "KY", "TN", "AR", "OK", "KS", "NE"],
    "MT": ["ID", "WY", "SD", "ND"],
    "NE": ["SD", "IA", "MO", "KS", "CO", "WY"],
    "NV": ["OR", "ID", "UT", "AZ", "CA"],
    "NH": ["ME", "MA", "VT"],
    "NJ": ["NY", "PA", "DE"],
    "NM": ["AZ", "UT", "CO", "OK", "TX"],
    "NY": ["PA", "NJ", "CT", "MA", "VT"],
    "NC": ["VA", "TN", "GA", "SC"],
    "ND": ["MT", "SD", "MN"],
    "OH": ["PA", "WV", "KY", "IN", "MI"],
    "OK": ["CO", "KS", "MO", "AR", "TX", "NM"],
    "OR": ["WA", "ID", "NV", "CA"],
    "PA": ["NY", "NJ", "DE", "MD", "WV", "OH"],
    "RI": ["CT", "MA"],
    "SC": ["NC", "GA"],
    "SD": ["ND", "MN", "IA", "NE", "WY", "MT"],
    "TN": ["KY", "VA", "NC", "GA", "AL", "MS", "AR", "MO"],
    "TX": ["NM", "OK", "AR", "LA"],
    "UT": ["ID", "WY", "CO", "NM", "AZ", "NV"],
    "VT": ["NY", "NH", "MA"],
    "VA": ["NC", "TN", "KY", "WV", "MD"],
    "WA": ["OR", "ID"],
    "WV": ["OH", "PA", "MD", "VA", "KY"],
    "WI": ["MN", "IA", "IL", "MI"],
    "WY": ["MT", "SD", "NE", "CO", "UT", "ID"],
    "AK": [],
    "HI": []
}

# --- helper conversion utilities ---
def _safe_float(x):
    """Convert a trial cell (which may be str/None/number) to float or None."""
    if x is None:
        return None
    try:
        return float(x)
    except Exception:
        # sometimes values like "18 Years" or "N/A" show up; strip non-numeric
        import re
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", str(x))
        return float(m.group(1)) if m else None

def _get_trial_bool(trial: Dict[str,Any], key: str) -> bool:
    """
    Accepts boolean-like trial cell values (True/False, 'True'/'true'/'YES', 1/0).
    """
    v = trial.get(key)
    if v is None:
        return False
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return bool(v)
    s = str(v).strip().lower()
    return s in ("true","t","yes","y","1")

def calculate_bmi(weight_lbs: float, height_inches: float) -> float:
    """
    BMI formula for US units:
    BMI = (weight in pounds / height in inches^2) * 703
    """
    if height_inches <= 0:
        return None
    bmi = (weight_lbs / (height_inches ** 2)) * 703
    return round(bmi, 1)

# --- HARD EXCLUSION MAP using CSV column names ---
exclusion_map = {
    "Exclude_Insulin": ("on_insulin", "Trial excludes insulin users."),
    "Exclude_GLP1": ("recent_glp1", "Trial excludes recent GLP-1 users."),
    "Exclude_CKD": ("ckd", "Trial excludes CKD patients."),
    "Exclude_Pancreatitis": ("pancreatitis", "Trial excludes pancreatitis history."),
    "Exclude_Recent_CV_Event": ("recent_cv_event", "Trial excludes recent CV events."),
    # note: your CSV didn't include Exclude_Malignancy column explicitly — handle via Exclusion_Flags if present
    "Exclude_Pregnancy": ("pregnant", "Trial excludes pregnancy."),
    "Exclude_Type1": ("type1_diabetes", "Trial excludes patients with Type 1 diabetes.")
}

def check_hard_exclusion(patient: Dict[str,Any], trial: Dict[str,Any]) -> Tuple[bool, List[str]]:
    """
    Returns (is_excluded, [reasons])
    Uses the CSV column names. Missing trial flags are treated as False (no exclusion).
    """
    reasons = []
    # direct mapped exclusions
    for trial_flag, (patient_flag, message) in exclusion_map.items():
        if _get_trial_bool(trial, trial_flag) and bool(patient.get(patient_flag)):
            reasons.append(message)

    # additional: if trial has an Exclusion_Flags dict with clinician-detected flags, respect them
    ef = trial.get("Exclusion_Flags")
    if isinstance(ef, dict):
        # e.g. {"exclude_malignancy": True, ...}
        # map common keys to patient flags if present
        extra_map = {
            "exclude_malignancy": ("recent_malignancy", "Trial excludes malignancy.")
        }
        for tflag, (pflag, msg) in extra_map.items():
            if ef.get(tflag) and patient.get(pflag):
                reasons.append(msg)

    return (True, reasons) if reasons else (False, [])

# --- geographic score uses your CSV 'States' and 'Remote_Allowed' columns ---
def compute_geographic_score(patient: Dict[str,Any], trial: Dict[str,Any]) -> Tuple[float,str]:
    """
    Returns (score out of 10, status string). Missing trial States or Remote_Allowed -> neutral/10 if remote or unknown->0.
    """
    patient_state = patient.get("state")
    if not patient_state:
        return 0.0, "unknown"

    patient_state = str(patient_state).strip().upper()
    if len(patient_state) == 2 and patient_state not in NEIGHBOR_STATES:
        # might be a full name - attempt common mapping? For now treat as invalid
        return 0.0, "invalid_state"

    trial_states_raw = trial.get("States") or trial.get("states") or []
    # normalize
    trial_states = [str(s).strip().upper() for s in trial_states_raw if s]
    if patient_state in trial_states:
        return 10.0, "in_state"
    if _get_trial_bool(trial, "Remote_Allowed"):
        return 10.0, "remote"
    # neighbor check
    if any(state in NEIGHBOR_STATES.get(patient_state, []) for state in trial_states):
        return 8.0, "neighbor"
    # no useful info -> treat as neutral 0 (not near)
    return 0.0, "far"

# --- numeric scoring (robust for one-sided bounds and None) ---
def compute_numeric_score(value: float, min_val, max_val, weight: float, margin: float) -> Tuple[float,str]:
    """
    value: patient's numeric value (float)
    min_val, max_val: trial bounds (None or numeric)
    weight: maximum weight to award
    margin: tolerance distance outside bound that yields partial credit
    Returns (score_contribution, status) where status in {'full','partial','fail'}
    Missing bounds are treated as "no restriction" on that side.
    """
    # if patient's value is missing treat it as neutral -> award full weight (do not penalize for missing patient data)
    if value is None:
        return weight, "full"

    min_f = _safe_float(min_val)
    max_f = _safe_float(max_val)

    # if both bounds missing -> full
    if min_f is None and max_f is None:
        return weight * 0.5, "partial"

    # if only min bound present
    if min_f is not None and max_f is None:
        if value >= min_f:
            return weight, "full"
        distance = min_f - value
        if distance <= margin:
            ratio = max(0.0, 1.0 - (distance / margin))
            return weight * ratio, "partial"
        return 0.0, "fail"

    # if only max bound present
    if min_f is None and max_f is not None:
        if value <= max_f:
            return weight, "full"
        distance = value - max_f
        if distance <= margin:
            ratio = max(0.0, 1.0 - (distance / margin))
            return weight * ratio, "partial"
        return 0.0, "fail"

    # both present
    if min_f <= value <= max_f:
        return weight, "full"
    # compute distance outside
    if value < min_f:
        distance = min_f - value
    else:
        distance = value - max_f

    if distance <= margin:
        ratio = max(0.0, 1.0 - (distance / margin))
        return weight * ratio, "partial"
    return 0.0, "fail"

# --- structured score using CSV column names ---
def compute_structured_score(patient: Dict[str,Any], trial: Dict[str,Any]) -> Tuple[float, Dict[str,str]]:
    """
    Expect trial keys: Min_Age, Max_Age, Min_HbA1c, Max_HbA1c, Min_BMI, Max_BMI,
    Require_Metformin (bool), plus geography fields.
    Returns (score out of 60, details dict)
    """
    score = 0.0
    details: Dict[str,str] = {}

    # AGE (trial column names: Min_Age, Max_Age) -> patient['age']
    age_score, age_status = compute_numeric_score(
        _safe_float(patient.get("age")),
        trial.get("Min_Age"),
        trial.get("Max_Age"),
        structured_weights["age"],
        age_partial_margin
    )
    score += age_score
    details["age"] = age_status

    # HBA1C (Min_HbA1c, Max_HbA1c)
    hba1c_score, hba1c_status = compute_numeric_score(
        _safe_float(patient.get("hba1c")),
        trial.get("Min_HbA1c"),
        trial.get("Max_HbA1c"),
        structured_weights["hba1c"],
        hba1c_partial_margin
    )
    score += hba1c_score
    details["hba1c"] = hba1c_status

    # BMI (Min_BMI, Max_BMI)
    bmi_score, bmi_status = compute_numeric_score(
        _safe_float(patient.get("bmi")),
        trial.get("Min_BMI"),
        trial.get("Max_BMI"),
        structured_weights["bmi"],
        bmi_partial_margin
    )
    score += bmi_score
    details["bmi"] = bmi_status

    # Medication (Require_Metformin column)
    if _get_trial_bool(trial, "Require_Metformin"):
        if patient.get("stable_metformin"):
            score += structured_weights["medication"]
            details["medication"] = "full"
        elif patient.get("on_metformin"):
            score += structured_weights["medication"] / 2.0
            details["medication"] = "partial"
        else:
            details["medication"] = "fail"
    else:
        # no metformin requirement -> award full medication weight
        score += structured_weights["medication"]
        details["medication"] = "full"

    # Geography (States list + Remote_Allowed)
    geo_score, geo_status = compute_geographic_score(patient, trial)
    # geo_score is on a 0-10 scale, but structured_weights["geography"] expects 10
    # keep consistent: geo_score already out of 10, add directly
    score += geo_score
    details["geography"] = geo_status

    return score, details

# --- semantic scoring (unchanged) ---
def compute_semantic_score(patient_embedding, trial_embedding) -> float:
    """
    patient_embedding and trial_embedding: list/np arrays or None
    Returns float in [0, semantic_weight]
    """
    if patient_embedding is None or trial_embedding is None:
        return 0.0
    pe = np.array(patient_embedding).reshape(1, -1)
    te = np.array(trial_embedding).reshape(1, -1)
    if pe.shape[1] != te.shape[1]:
        return 0.0
    if np.linalg.norm(pe) == 0 or np.linalg.norm(te) == 0:
        return 0.0
    cos_sim = cosine_similarity(pe, te)[0][0]
    normalized = (cos_sim + 1.0) / 2.0   # map -1..1 to 0..1
    return float(normalized * semantic_weight)

def score_to_probability(raw_score: float) -> float:
    """
    Convert raw score (0–100) into probability (0–1)
    using logistic transformation.
    """
    center = 50.0   # score that equals 50% probability
    scale = 12.0    # controls steepness

    z = (raw_score - center) / scale
    prob = 1.0 / (1.0 + math.exp(-z))

    return round(prob, 3)

# --- explanation builder and scaling to 1-10 ---
def generate_explanation_and_scale(patient: Dict[str,Any],
                                   trial: Dict[str,Any],
                                   structured_score: float,
                                   details: Dict[str,str],
                                   semantic_score: float) -> Dict[str,Any]:
    """
    structured_score: 0..60
    semantic_score: 0..40
    returns a dict with raw_score (0..100), score_10 (0.0 if excluded else 1.0..10.0),
    met/partial/failed lists, confidence string.
    """
    raw = structured_score + semantic_score
    raw = max(0.0, min(100.0, raw))  # clamp
    probability = score_to_probability(raw)

    # linear map 0..100 -> 1.0..10.0 (non-excluded). Caller will set excluded separately.
    score_10 = 1.0 + (raw / 100.0) * 9.0
    # round to nearest tenth
    score_10 = round(score_10, 1)

    met, partial, failed = [], [], []
    for k, v in details.items():
        if v == "full":
            met.append(k)
        elif v == "partial":
            partial.append(k)
        else:
            failed.append(k)

    if raw >= 80:
        confidence = "High"
    elif raw >= 50:
        confidence = "Moderate"
    else:
        confidence = "Low"

    return {
        "raw_score": round(raw, 2),
        "score_10": score_10,
        "probability": probability,
        "met": met,
        "partial": partial,
        "failed": failed,
        "confidence": confidence
    }

# --- match + ranking functions (entry points) ---
def match_patient_to_trial(patient: Dict[str,Any], trial: Dict[str,Any]) -> Dict[str,Any]:
    """
    patient: dict with patient fields (age,hba1c,bmi,state, on_insulin, recent_glp1, etc.)
    trial: dict matching your CSV columns (Min_HbA1c, Exclude_Insulin, States, Remote_Allowed, trial_embedding, ...)

    Returns: explanation dict including status and score_10 (0.0 if Excluded)
    """
    # check hard exclusions
    excluded, reasons = check_hard_exclusion(patient, trial)
    if excluded:
        return {
            "final_score": 0.0,
            "score_10": 0.0,
            "probability": 0.0,
            "status": "Excluded",
            "reasons": reasons,
            "met": [],
            "partial": [],
            "failed": [],
            "confidence": "Not Eligible",
            "raw_score": 0.0
        }
    # --- HARD AGE EXCLUSION ---
    patient_age = _safe_float(patient.get("age"))
    trial_min_age = _safe_float(trial.get("Min_Age"))
    trial_max_age = _safe_float(trial.get("Max_Age"))

    if patient_age is not None:
        if trial_min_age is not None and patient_age < trial_min_age:
            return {
                "final_score": 0.0,
                "score_10": 0.0,
                "probability": 0.0,
                "status": "Excluded",
                "reasons": [f"Patient age below minimum ({trial_min_age})."],
                "met": [],
                "partial": [],
                "failed": ["age"],
                "confidence": "Not Eligible",
                "raw_score": 0.0
            }

        if trial_max_age is not None and patient_age > trial_max_age:
            return {
                "final_score": 0.0,
                "score_10": 0.0,
                "probability": 0.0,
                "status": "Excluded",
                "reasons": [f"Patient age above maximum ({trial_max_age})."],
                "met": [],
                "partial": [],
                "failed": ["age"],
                "confidence": "Not Eligible",
                "raw_score": 0.0
            }
    # --- HARD HbA1c EXCLUSION ---
    patient_hba1c = _safe_float(patient.get("hba1c"))
    trial_min_hba1c = _safe_float(trial.get("Min_HbA1c"))
    trial_max_hba1c = _safe_float(trial.get("Max_HbA1c"))

    if patient_hba1c is not None:

        if trial_min_hba1c is not None and patient_hba1c < trial_min_hba1c:
            return {
                "final_score": 0.0,
                "score_10": 0.0,
                "probability": 0.0,
                "status": "Excluded",
                "reasons": [f"HbA1c below minimum ({trial_min_hba1c})."],
                "met": [],
                "partial": [],
                "failed": ["hba1c"],
                "confidence": "Not Eligible",
                "raw_score": 0.0
            }

        if trial_max_hba1c is not None and patient_hba1c > trial_max_hba1c:
            return {
                "final_score": 0.0,
                "score_10": 0.0,
                "probability": 0.0,
                "status": "Excluded",
                "reasons": [f"HbA1c above maximum ({trial_max_hba1c})."],
                "met": [],
                "partial": [],
                "failed": ["hba1c"],
                "confidence": "Not Eligible",
                "raw_score": 0.0
            }

    # compute structured score
    structured_score, details = compute_structured_score(patient, trial)

    # semantic score: expect trial embedding stored in column "trial_embedding" (or "trial_text_for_embedding" if not computed)
    semantic_score = compute_semantic_score(patient.get("patient_embedding"), trial.get("trial_embedding"))

    explanation = generate_explanation_and_scale(patient, trial, structured_score, details, semantic_score)

    # keep consistent external field name
    explanation.update({
        "status": "Matched",
        "final_score": explanation["raw_score"]
    })
    return explanation

def rank_trials(patient: Dict[str,Any], trials: List[Dict[str,Any]]) -> List[Dict[str,Any]]:
    """
    trials: list of trial dicts (each must include title/nct_id and optional trial_embedding)
    Returns sorted list (best -> worst) of explanation dicts with titles included.
    """
    results = []
    for trial in trials:
        res = match_patient_to_trial(patient, trial)
        # attach minimal trial meta
        res["title"] = trial.get("Title") or trial.get("title") or trial.get("NCT_ID")
        res["nct_id"] = trial.get("NCT_ID")
        results.append(res)
    # sort by score_10 (excluded will have 0.0 and be last)
    return sorted(results, key=lambda x: x.get("probability", 0.0), reverse=True)


def annotate_and_rank_df(patient: Dict[str,Any], df_in: pd.DataFrame) -> List[Dict[str,Any]]:
    """
    Annotate a DataFrame of trials with match results for `patient`.
    Returns a list of dict records (JSON-serializable) sorted by highest raw match score.

    Appends the following fields (prefixed with `match_`) to each trial row:
      - match_raw_score (0..100)
      - match_score_10 (1.0..10.0 or 0.0 when excluded)
      - match_probability (0..1)
      - match_confidence (High/Moderate/Low/Not Eligible)
      - match_status (Matched/Excluded)
      - match_reasons (list)
      - match_met (list)
      - match_partial (list)
      - match_failed (list)
      - match_final_score (same as raw_score)

    The returned list is sorted by `match_raw_score` descending (best first).
    """
    annotated = []

    # iterate rows and compute match for each trial
    for _, row in df_in.iterrows():
        trial = row.to_dict()
        # ensure plain dict (no pandas Series inside)
        explanation = match_patient_to_trial(patient, trial)

        # Prepare prefixed fields to merge onto the trial row
        merged = dict(trial)  # copy original trial fields

        merged_fields = {
            "match_raw_score": float(explanation.get("raw_score", 0.0)),
            "match_score_10": float(explanation.get("score_10", 0.0)),
            "match_probability": float(explanation.get("probability", 0.0)),
            "match_confidence": explanation.get("confidence", ""),
            "match_status": explanation.get("status", ""),
            "match_reasons": explanation.get("reasons", []),
            "match_met": explanation.get("met", []),
            "match_partial": explanation.get("partial", []),
            "match_failed": explanation.get("failed", []),
            "match_final_score": float(explanation.get("final_score", explanation.get("raw_score", 0.0)))
        }

        merged.update(merged_fields)
        annotated.append(merged)

    # convert to DataFrame for sorting and normalization, then back to records
    ann_df = pd.DataFrame(annotated)
    if "match_raw_score" in ann_df.columns:
        ann_df = ann_df.sort_values(by="match_raw_score", ascending=False)
    # convert numpy types to native python where possible via to_dict
    records = ann_df.to_dict(orient="records")
    return records

def build_patient_summary(p: dict) -> str:
    """
    Converts structured patient JSON into a natural language string for embedding.
    """
    # Core vitals
    summary = f"Patient is {p.get('age', 'unknown')} years old with an HbA1c of {p.get('hba1c', 'unknown')}% "
    summary += f"and a BMI of {p.get('bmi', 'unknown')}. "

    # Medication status
    meds = []
    if p.get('on_metformin'): meds.append("on metformin")
    if p.get('stable_metformin'): meds.append("stable on metformin")
    if p.get('on_insulin'): meds.append("using insulin")

    if meds:
        summary += "Current treatments include: " + ", ".join(meds) + ". "
    else:
        summary += "Currently not on diabetes medication. "

    # Comorbidities/Exclusions
    conditions = []
    if p.get('ckd'): conditions.append("chronic kidney disease")
    if p.get('pancreatitis'): conditions.append("history of pancreatitis")
    if p.get('type1_diabetes'): conditions.append("Type 1 Diabetes")

    if conditions:
        summary += "Medical history includes " + ", ".join(conditions) + "."
    else:
        summary += "No history of CKD, pancreatitis, or Type 1 diabetes."

    return summary

df = pd.read_csv(
    CSV_PATH,
    parse_dates=["Last_Updated"]
)

df = df.sort_values(by="Last_Updated", ascending=False)

if not df.empty:
    df['Last_Updated'] = pd.to_datetime(df['Last_Updated'], errors='coerce')
    df = df.sort_values(by="Last_Updated", ascending=False)
    print(f"\nSuccess! Found {len(df)} trials.")
else:
    print("\nNo US trials found in this batch.")

# 1. Load the model (this will download ~80MB on the first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

print("Generating trial embeddings...")

def get_local_embedding(text: str):
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()

df_sample = df.sample(10)
# Ensure we have a text column to embed. Some CSV exports may not include
# a precomputed `trial_text_for_embedding` column; build a fallback from
# available descriptive fields (Title, Brief_Summary, Eligibility, US_Cities).
if "trial_text_for_embedding" not in df.columns:
    df["trial_text_for_embedding"] = (
        df.get("Title", "").fillna("") + 
        ". " + df.get("Brief_Summary", "").fillna("") + 
        " " + df.get("Eligibility", "").fillna("") + 
        " " + df.get("US_Cities", "").fillna("")
    )

df_sample = df.sample(10)
texts = df_sample["trial_text_for_embedding"].tolist()
embeddings = model.encode(texts, convert_to_numpy=True, batch_size=16)
df_sample["trial_embedding"] = embeddings.tolist()
trials_list = df_sample.to_dict(orient='records')

print("Trial embeddings complete.\n")

# Example for your demo
def scoreData(patient, sample_size: int = 10):
    """
    Build a patient embedding, annotate a sampled set of trials with match
    results, and return a single JSON-serializable list of annotated rows
    sorted by highest match score.

    By default this samples `sample_size` rows from the CSV (to avoid
    embedding the entire dataset on every run). If you want full-data
    annotation, pass `sample_size=len(df)` (not recommended for first runs).
    """
    patient_text = build_patient_summary(patient)
    patient["patient_embedding"] = get_local_embedding(patient_text)
    print("Patient summary:", patient_text)

    # Sample from the main dataframe (df). Ensure sampled rows have embeddings.
    sample_df = df.sample(n=min(sample_size, len(df))).copy()

    if "trial_embedding" not in sample_df.columns or sample_df["trial_embedding"].isnull().any().any():
        texts = sample_df["trial_text_for_embedding"].fillna("").tolist()
        emb = model.encode(texts, convert_to_numpy=True, batch_size=16)
        sample_df["trial_embedding"] = emb.tolist()

    # Annotate and rank the sampled DataFrame; returns list of dicts sorted by match_raw_score desc
    annotated = annotate_and_rank_df(patient, sample_df)

    # Print a brief table of top matches for quick debugging
    print(f"{'Rank':<5} | {'Raw':<6} | {'Prob':<6} | {'Conf':<8} | {'Title'}")
    print("-" * 90)
    for i, row in enumerate(annotated[:10], 1):
        title = (row.get("Title") or row.get("title") or row.get("NCT_ID") or "Unknown")
        raw = row.get("match_raw_score", 0.0)
        prob = row.get("match_probability", 0.0)
        conf = row.get("match_confidence", "")
        print(f"{i:<5} | {raw:<6.1f} | {prob:<6.2f} | {conf:<8} | {title[:60]}")
    print("-" * 90)

    return annotated