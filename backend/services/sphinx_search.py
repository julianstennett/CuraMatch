"""
Whoosh-based full-text search index built from t2d_trials_us.csv.

On first call to `search_trials()` the index is built (or reused if it
already exists on disk).  Subsequent calls hit the on-disk index directly.
"""

import os
import math
from whoosh import index
from whoosh.fields import Schema, TEXT, ID, STORED, NUMERIC
from whoosh.qparser import MultifieldParser, OrGroup
from whoosh.query import And, NumericRange, Every
from whoosh import scoring

from services.trials_fetcher import load_trials

INDEX_DIR = os.getenv("WHOOSH_INDEX_DIR", "./whoosh_index")

_schema = Schema(
    nct_id=ID(stored=True, unique=True),
    title=TEXT(stored=True),
    brief_summary=TEXT(stored=True),
    eligibility=TEXT(stored=True),
    us_cities=TEXT(stored=True),
    phase=ID(stored=True),
    study_type=ID(stored=True),
    sex=ID(stored=True),
    healthy_volunteers=ID(stored=True),
    last_updated=ID(stored=True),
    min_age=NUMERIC(stored=True, numtype=int),
    max_age=NUMERIC(stored=True, numtype=int),
)


def _build_index() -> index.FileIndex:
    os.makedirs(INDEX_DIR, exist_ok=True)
    idx = index.create_in(INDEX_DIR, _schema)
    writer = idx.writer()

    df = load_trials()
    for _, row in df.iterrows():
        writer.add_document(
            nct_id=str(row.get("nct_id", "")),
            title=str(row.get("title", "")),
            brief_summary=str(row.get("brief_summary", "")),
            eligibility=str(row.get("eligibility", "")),
            us_cities=str(row.get("us_cities", "")),
            phase=str(row.get("phase", "")),
            study_type=str(row.get("study_type", "")),
            sex=str(row.get("sex", "")),
            healthy_volunteers=str(row.get("healthy_volunteers", "")),
            last_updated=str(row.get("last_updated", "")),
            min_age=int(row["min_age"]) if row.get("min_age") and not math.isnan(float(row["min_age"])) else 0,
            max_age=int(row["max_age"]) if row.get("max_age") and not math.isnan(float(row["max_age"])) else 120,
        )
    writer.commit()
    return idx


def _get_index() -> index.FileIndex:
    if index.exists_in(INDEX_DIR):
        return index.open_dir(INDEX_DIR)
    return _build_index()


def rebuild_index() -> dict:
    """Force a full rebuild of the search index."""
    import shutil
    if os.path.exists(INDEX_DIR):
        shutil.rmtree(INDEX_DIR)
    _build_index()
    return {"status": "index rebuilt"}


def search_trials(
    keywords: str = "",
    age: int | None = None,
    sex: str | None = None,
    healthy_volunteer: bool = False,
    limit: int = 20,
) -> list[dict]:
    idx = _get_index()

    with idx.searcher(weighting=scoring.BM25F()) as searcher:
        # --- build query ---
        filters = []

        # Age range filter
        if age is not None:
            filters.append(NumericRange("min_age", None, age))
            filters.append(NumericRange("max_age", age, None))

        # Keyword full-text query
        if keywords.strip():
            parser = MultifieldParser(
                ["title", "brief_summary", "eligibility"],
                schema=_schema,
                group=OrGroup,
            )
            text_q = parser.parse(keywords)
        else:
            text_q = Every()

        final_q = And([text_q] + filters) if filters else text_q

        # Fetch extra to account for post-filtering
        results = searcher.search(final_q, limit=limit * 3)

        # Sex post-filter — handles CSV values like "Male", "Female", "All", ""
        sex_filter = sex.strip().lower() if sex and sex.lower() not in ("all", "") else None

        hits = []
        for r in results:
            trial_sex = (r["sex"] or "").strip().lower()
            if sex_filter and trial_sex not in ("all", "", sex_filter):
                continue
            hits.append({
                "nct_id": r["nct_id"],
                "title": r["title"],
                "brief_summary": r["brief_summary"],
                "eligibility": r["eligibility"],
                "us_cities": r["us_cities"],
                "phase": r["phase"],
                "study_type": r["study_type"],
                "sex": r["sex"],
                "healthy_volunteers": r["healthy_volunteers"],
                "last_updated": r["last_updated"],
                "min_age": r["min_age"],
                "max_age": r["max_age"],
                "match_score": r.score,
            })
            if len(hits) >= limit:
                break

        return hits