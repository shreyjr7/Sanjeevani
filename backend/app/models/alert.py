from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    alert_type = Column(String)
    severity = Column(String)
    message = Column(String)
    target_agency = Column(String, default="counsellor") # counsellor, district_magistrate, police_sp
    action_required = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case")
