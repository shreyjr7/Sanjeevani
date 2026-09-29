import uuid
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True, default=lambda: f"sess_{uuid.uuid4().hex[:12]}")
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    channel = Column(String, default="ai_companion")
    title = Column(String, default="New Conversation")
    summary = Column(Text, nullable=True)  # Psychological & mental state summary for the counsellor
    dominant_emotion = Column(String, default="neutral")
    distress_score = Column(Float, default=20.0)
    crisis_flagged = Column(Boolean, default=False)
    message_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    case = relationship("Case")
    user = relationship("User")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
