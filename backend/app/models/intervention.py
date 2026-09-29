from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    counsellor_id = Column(Integer, ForeignKey("users.id"))
    intervention_type = Column(String)
    notes = Column(Text)
    scheduled_at = Column(DateTime(timezone=True))
    status = Column(String, default="pending")
    outcome = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case")
    counsellor = relationship("User")
