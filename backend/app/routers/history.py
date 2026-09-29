from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.checkin import CheckIn
from ..schemas import CheckInResponse
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])

@router.get("/case/{case_id}", response_model=List[CheckInResponse])
def get_history(case_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(CheckIn).filter(CheckIn.case_id == case_id).order_by(CheckIn.submitted_at.desc()).all()
