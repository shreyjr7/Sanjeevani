from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    sender_role = Column(String)  # 'user', 'ai', 'therapist'
    channel = Column(String, default="ai_companion")  # 'ai_companion' or 'therapist_direct'
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    content = Column(Text, nullable=False)
    sentiment_score = Column(Float, nullable=True)
    is_crisis_flagged = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case")
    sender = relationship("User")
    session = relationship("ChatSession", back_populates="messages")
