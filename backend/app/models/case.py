from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    victim_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String, default="active")
    risk_level = Column(String, default="low")
    assigned_counsellor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # NHAA 14566 Atrocity Governance & Distress Prediction Attributes
    nhaa_docket_no = Column(String, nullable=True, index=True)
    case_category = Column(String, nullable=True, default="caste_violence_boycott") # rape_gang_rape, murder_arson_grievous, witness_intimidation, caste_violence_boycott
    legal_stage = Column(String, nullable=True, default="investigation") # investigation, trial, rehabilitation, compensation
    fir_number = Column(String, nullable=True)
    police_station = Column(String, nullable=True)
    district = Column(String, nullable=True, default="Varanasi")
    state = Column(String, nullable=True, default="Uttar Pradesh")
    threat_level = Column(String, nullable=True, default="Moderate") # High / Imminent, Moderate, Guarded
    court_next_hearing = Column(String, nullable=True)
    predictive_crisis_risk_7d = Column(Integer, nullable=True, default=35)
    compensation_status = Column(String, nullable=True, default="Pending FIR Verification")
    witness_protection_status = Column(String, nullable=True, default="Under Threat Assessment")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    victim = relationship("User", foreign_keys=[victim_id])
    counsellor = relationship("User", foreign_keys=[assigned_counsellor_id])

class ClinicalNote(Base):
    __tablename__ = "clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    author_id = Column(Integer, ForeignKey("users.id"))
    note_type = Column(String, default="Clinical Note")
    note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    case = relationship("Case")
    author = relationship("User")

