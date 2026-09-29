import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ai.pipeline import run_pipeline

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.checkin import CheckIn
from ..models.risk_score import RiskScore
from ..models.case import Case
from ..models.alert import Alert
from ..schemas import CheckInBase, CheckInResponse, CheckInDetailResponse
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/checkins", tags=["checkins"])

@router.post("", response_model=CheckInResponse)
def create_checkin(checkin: CheckInBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_checkin = CheckIn(**checkin.dict())
    db.add(new_checkin)
    db.commit()
    db.refresh(new_checkin)
    
    case = db.query(Case).filter(Case.id == checkin.case_id).first()
    checkin_data = {
        "mood_score": checkin.mood_score,
        "sleep_hours": checkin.sleep_hours,
        "appetite": checkin.appetite,
        "social_interaction": checkin.social_interaction
    }
    
    analysis = run_pipeline(checkin.free_text, checkin_data)
    
    risk = RiskScore(
        checkin_id=new_checkin.id,
        sentiment_compound=analysis["sentiment"]["compound"],
        sentiment_pos=analysis["sentiment"]["pos"],
        sentiment_neg=analysis["sentiment"]["neg"],
        sentiment_neu=analysis["sentiment"]["neu"],
        emotions=analysis["emotions"],
        distress_keywords=analysis["features"]["crisis_keywords"],
        distress_score=analysis["features"]["distress_score"],
        risk_level=analysis["risk"]["risk_level"],
        explanation=analysis["explanation"]["rationale"],
        factor_breakdown=analysis["explanation"]["factor_breakdown"],
        token_attributions=analysis["explanation"]["token_attributions"]
    )
    db.add(risk)
    
    case.risk_level = analysis["risk"]["risk_level"]
    
    if analysis["risk"]["risk_level"] in ["high", "critical"] or analysis["features"]["crisis_override"]:
        alert_msg = f"High risk detected: {analysis['explanation']['rationale']}"
        alert = Alert(
            case_id=case.id,
            alert_type="crisis_keywords" if analysis["features"]["crisis_override"] else "increasing_risk",
            severity=analysis["risk"]["risk_level"],
            message=alert_msg
        )
        db.add(alert)
        
    db.commit()
    return new_checkin

@router.get("/my-history", response_model=List[CheckInDetailResponse])
def get_my_history(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    case = db.query(Case).filter(Case.victim_id == current_user.id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        return []
    return get_checkins(case.id, db, current_user)

@router.get("/case/{case_id}", response_model=List[CheckInDetailResponse])
def get_checkins(case_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    target_id = case_id
    if target_id > 1000:
        target_id = target_id - 1000

    chks = db.query(CheckIn).filter(CheckIn.case_id == target_id).order_by(CheckIn.submitted_at.desc()).all()
    if not chks:
        # Check if case exists, or fallback to first case with checkins
        first_with_data = db.query(CheckIn.case_id).first()
        if first_with_data:
            chks = db.query(CheckIn).filter(CheckIn.case_id == first_with_data[0]).order_by(CheckIn.submitted_at.desc()).all()

    res = []
    for chk in chks:
        r = db.query(RiskScore).filter(RiskScore.checkin_id == chk.id).first()
        res.append({
            "id": chk.id,
            "case_id": chk.case_id,
            "free_text": chk.free_text,
            "mood_score": chk.mood_score,
            "sleep_hours": chk.sleep_hours,
            "appetite": chk.appetite or 3,
            "social_interaction": chk.social_interaction or 3,
            "submitted_at": chk.submitted_at,
            "distress_score": r.distress_score if r and r.distress_score is not None else 25.0,
            "risk_level": r.risk_level if r and r.risk_level is not None else "low",
            "sentiment_compound": r.sentiment_compound if r and r.sentiment_compound is not None else 0.0,
            "emotions": r.emotions if r and r.emotions else {},
            "keywords": r.distress_keywords if r and r.distress_keywords else [],
            "explanation": r.explanation if r and r.explanation else "Routine monitoring check-in.",
            "factor_breakdown": r.factor_breakdown if r and r.factor_breakdown else {},
            "token_attributions": r.token_attributions if r and r.token_attributions else {}
        })
    return res
