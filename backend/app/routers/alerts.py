from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.alert import Alert
from ..schemas import AlertResponse
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Alert).all()

@router.patch("/{id}", response_model=AlertResponse)
def update_alert(id: int, is_read: bool = None, is_resolved: bool = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if is_read is not None:
        alert.is_read = is_read
    if is_resolved is not None:
        alert.is_resolved = is_resolved
    db.commit()
    db.refresh(alert)
    return alert
