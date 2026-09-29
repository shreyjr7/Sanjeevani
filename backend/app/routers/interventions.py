from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.intervention import Intervention
from ..schemas import InterventionBase, InterventionResponse
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/interventions", tags=["interventions"])

@router.post("", response_model=InterventionResponse)
def create_intervention(intervention: InterventionBase, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_int = Intervention(**intervention.dict())
    db.add(new_int)
    db.commit()
    db.refresh(new_int)
    return new_int

@router.get("/case/{case_id}", response_model=List[InterventionResponse])
def get_interventions(case_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Intervention).filter(Intervention.case_id == case_id).all()
