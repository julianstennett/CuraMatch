"""
CareCompass-AI — FastAPI backend
Run with:  uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers import intake, matching, explain
from services.sphinx_search import _get_index   # pre-warm index on startup

app = FastAPI(
    title="CareCompass-AI",
    description="Clinical trial matching for Type 2 Diabetes patients",
    version="1.0.0",
)

# Allow the React dev server (and production) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(intake.router)
app.include_router(matching.router)
app.include_router(explain.router)


@app.on_event("startup")
async def startup_event():
    """Pre-warm the Whoosh index so first request isn't slow."""
    try:
        _get_index()
        print("✅  Whoosh index ready.")
    except FileNotFoundError as e:
        print(f"⚠️  {e}")


@app.get("/")
def root():
    return {"message": "CareCompass-AI API is running 🩺"}


@app.get("/health")
def health():
    return {"status": "ok"}
