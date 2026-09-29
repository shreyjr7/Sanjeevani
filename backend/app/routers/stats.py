from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.case import Case
from ..models.alert import Alert
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])

@router.get("/dashboard")
def get_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_cases = db.query(Case).count()
    active_alerts = db.query(Alert).filter(Alert.is_resolved == False).count()
    critical_cases = db.query(Case).filter(Case.risk_level == "critical").count()
    return {
        "total_cases": total_cases,
        "active_alerts": active_alerts,
        "critical_cases": critical_cases
    }
