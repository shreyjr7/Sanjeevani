from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    free_text = Column(Text)
    mood_score = Column(Integer)
    sleep_hours = Column(Integer)
    appetite = Column(Integer)
    social_interaction = Column(Integer)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case")
