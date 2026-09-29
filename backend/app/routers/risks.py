from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.risk_score import RiskScore
from ..models.checkin import CheckIn
from ..schemas import RiskScoreResponse
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/risk", tags=["risk"])

@router.get("/case/{case_id}", response_model=List[RiskScoreResponse])
def get_risk_scores(case_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(RiskScore).join(CheckIn).filter(CheckIn.case_id == case_id).all()

@router.post("/analyze")
def analyze_sandbox(text: str, mood_score: int = 5, sleep_hours: int = 7):
    import sys
    import os
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
    if PROJECT_ROOT not in sys.path:
        sys.path.insert(0, PROJECT_ROOT)
    from ai.pipeline import run_pipeline
    return run_pipeline(text, {"mood_score": mood_score, "sleep_hours": sleep_hours})
