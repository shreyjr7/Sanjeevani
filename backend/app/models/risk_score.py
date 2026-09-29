from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("checkins.id"))
    sentiment_compound = Column(Float)
    sentiment_pos = Column(Float)
    sentiment_neg = Column(Float)
    sentiment_neu = Column(Float)
    emotions = Column(JSON)
    distress_keywords = Column(JSON)
    distress_score = Column(Float)
    risk_level = Column(String)
    explanation = Column(Text)
    factor_breakdown = Column(JSON)
    token_attributions = Column(JSON)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())

    checkin = relationship("CheckIn")
