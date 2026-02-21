# CareCompass AI 🩺

> Clinical trial matching for Type 2 Diabetes patients, powered by Gemini AI + Whoosh full-text search.

## Project Structure

```
carecompass-ai/
├── backend/
│   ├── models/
│   │   ├── patient.py       ← Pydantic models for patient profiles
│   │   └── trial.py         ← Pydantic models for trial data
│   ├── routers/
│   │   ├── intake.py        ← POST /api/intake   (free text → profile)
│   │   ├── matching.py      ← POST /api/match    (profile → trials)
│   │   └── explain.py       ← POST /api/explain  (trial + profile → AI explanation)
│   ├── services/
│   │   ├── gemini.py        ← Google Gemini API wrapper
│   │   ├── sphinx_search.py ← Whoosh full-text index & search
│   │   └── trials_fetcher.py← CSV loader & cache
│   ├── t2d_trials_us.csv    ← ⚠️ Place your CSV here
│   ├── .env                 ← API keys (see below)
│   ├── main.py              ← FastAPI app entry point
│   └── requirements.txt
│
└── frontend/my-app/
    ├── src/
    │   ├── components/
    │   │   ├── ExplainPanel.jsx   ← Gemini eligibility explanation
    │   │   ├── PatientIntake.jsx  ← Free-text intake form
    │   │   ├── TrialCard.jsx      ← Individual trial display
    │   │   └── TrialResults.jsx   ← Results list + profile pills
    │   ├── services/
    │   │   └── api.js             ← Fetch wrappers for all endpoints
    │   ├── App.jsx
    │   ├── App.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend

# Copy your CSV into the backend directory
cp /path/to/t2d_trials_us.csv .

# Set up environment
cp .env .env.local
# Edit .env — add your GEMINI_API_KEY

# Install dependencies
pip install -r requirements.txt

# Run
uvicorn main:app --reload --port 8000
```

The Whoosh index is built automatically on first startup from the CSV.

**API docs:** http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend/my-app
npm install
npm run dev
```

Open http://localhost:5173

---

## Environment Variables (backend/.env)

| Variable          | Description                                |
|-------------------|--------------------------------------------|
| `GEMINI_API_KEY`  | Your Google Gemini API key                 |
| `CSV_PATH`        | Path to `t2d_trials_us.csv` (default: `./t2d_trials_us.csv`) |
| `WHOOSH_INDEX_DIR`| Where to store the search index (default: `./whoosh_index`) |

Get a Gemini API key at: https://aistudio.google.com/app/apikey

---

## API Endpoints

| Method | Path           | Description                              |
|--------|----------------|------------------------------------------|
| `POST` | `/api/intake`  | Parse free-text patient description      |
| `POST` | `/api/match`   | Match trials to a patient profile        |
| `POST` | `/api/explain` | Get AI explanation for a trial + patient |
| `GET`  | `/health`      | Health check                             |
| `GET`  | `/docs`        | Interactive Swagger UI                   |

---

## CSV Format Expected

The CSV (`t2d_trials_us.csv`) must have these columns:

```
NCT_ID, Title, Last_Updated, US_Cities, Eligibility,
Min_Age, Max_Age, Sex, Healthy_Volunteers, Phase,
Study_Type, Brief_Summary
```

---

## How It Works

1. **Patient types** a free-text description of their medical situation
2. **Gemini AI** extracts a structured profile (age, sex, conditions, HbA1c, etc.)
3. **Whoosh** performs BM25 full-text search over the trial CSV, filtered by age/sex
4. **Results** are ranked and displayed with key metadata
5. **Per-trial AI explanation** — clicking "Explain this trial" sends the trial + profile back to Gemini for a plain-English eligibility assessment

---

*For informational use only. Always consult your physician.*
