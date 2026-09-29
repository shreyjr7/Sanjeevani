from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: str
    role: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    emergency_contact: Optional[str] = None
    bio: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CaseBase(BaseModel):
    victim_id: int
    status: str = "active"
    risk_level: str = "low"
    assigned_counsellor_id: Optional[int] = None

class CaseResponse(CaseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    victim_name: Optional[str] = None
    counsellor_name: Optional[str] = None
    checkins_count: Optional[int] = 0
    average_mood: Optional[float] = None
    latest_risk_score: Optional[float] = None
    days_monitored: Optional[int] = 30
    victim_age: Optional[int] = None
    victim_gender: Optional[str] = None
    victim_phone: Optional[str] = None
    victim_emergency_contact: Optional[str] = None
    victim_bio: Optional[str] = None
    primary_flaw: Optional[str] = None
    flaw_severity: Optional[str] = None
    
    # NHAA 14566 Atrocity Attributes
    nhaa_docket_no: Optional[str] = None
    case_category: Optional[str] = None
    legal_stage: Optional[str] = None
    fir_number: Optional[str] = None
    police_station: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    threat_level: Optional[str] = None
    court_next_hearing: Optional[str] = None
    predictive_crisis_risk_7d: Optional[int] = 35
    compensation_status: Optional[str] = None
    witness_protection_status: Optional[str] = None
    touchpoints: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        from_attributes = True

class CheckInBase(BaseModel):
    case_id: int
    free_text: str
    mood_score: float = 5.0
    sleep_hours: float = 7.0
    appetite: float = 3.0
    social_interaction: float = 3.0

class CheckInResponse(CheckInBase):
    id: int
    submitted_at: datetime
    class Config:
        from_attributes = True

class CheckInDetailResponse(CheckInBase):
    id: int
    submitted_at: datetime
    distress_score: Optional[float] = 25.0
    risk_level: Optional[str] = "low"
    sentiment_compound: Optional[float] = 0.0
    emotions: Optional[Dict[str, float]] = None
    keywords: Optional[List[str]] = None
    explanation: Optional[str] = None
    factor_breakdown: Optional[Dict[str, Any]] = None
    token_attributions: Optional[Dict[str, Any]] = None
    class Config:
        from_attributes = True

class RiskScoreResponse(BaseModel):
    id: int
    checkin_id: int
    sentiment_compound: float
    sentiment_pos: float
    sentiment_neg: float
    sentiment_neu: float
    emotions: Dict[str, float]
    distress_keywords: List[str]
    distress_score: float
    risk_level: str
    explanation: str
    factor_breakdown: Dict[str, Any]
    token_attributions: Dict[str, Any]
    computed_at: datetime
    class Config:
        from_attributes = True

class AlertBase(BaseModel):
    case_id: int
    alert_type: str
    severity: str
    message: str
    target_agency: Optional[str] = "counsellor"
    action_required: Optional[str] = None

class AlertResponse(AlertBase):
    id: int
    is_read: bool
    is_resolved: bool
    created_at: datetime
    class Config:
        from_attributes = True

class InterventionBase(BaseModel):
    case_id: int
    counsellor_id: int
    intervention_type: str
    notes: str
    scheduled_at: datetime
    status: str = "pending"

class InterventionResponse(InterventionBase):
    id: int
    outcome: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class CaseUpdate(BaseModel):
    status: Optional[str] = None
    risk_level: Optional[str] = None
    assigned_counsellor_id: Optional[int] = None

class ClinicalNoteCreate(BaseModel):
    note: str
    note_type: Optional[str] = "Clinical Note"

class ClinicalNoteResponse(BaseModel):
    id: int
    case_id: int
    author_name: str
    note_type: str
    note: str
    created_at: datetime

class ChatMessageCreate(BaseModel):
    case_id: int
    content: str
    channel: Optional[str] = "ai_companion" # 'ai_companion' or 'therapist_direct'

class ChatMessageResponse(BaseModel):
    id: int
    case_id: int
    sender_id: Optional[int] = None
    sender_name: str
    sender_role: str # 'user', 'ai', 'therapist'
    channel: str # 'ai_companion' or 'therapist_direct'
    session_id: Optional[str] = None
    content: str
    sentiment_score: Optional[float] = None
    is_crisis_flagged: bool = False
    is_read: bool = False
    created_at: datetime
    class Config:
        from_attributes = True

class ChatSessionCreate(BaseModel):
    case_id: int
    title: Optional[str] = "New Conversation"
    channel: Optional[str] = "ai_companion"

class ChatSessionResponse(BaseModel):
    id: str
    case_id: int
    user_id: Optional[int] = None
    channel: str = "ai_companion"
    title: str
    summary: Optional[str] = None
    dominant_emotion: Optional[str] = "neutral"
    distress_score: Optional[float] = 20.0
    crisis_flagged: bool = False
    message_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class ChatSessionDetailResponse(BaseModel):
    session: ChatSessionResponse
    messages: List[ChatMessageResponse]

class PatientMindInsightsResponse(BaseModel):
    case_id: int
    patient_name: str
    current_mind_state_summary: str
    dominant_concerns: List[str]
    emotional_trajectory: List[Dict[str, Any]]
    total_ai_sessions: int
    total_ai_messages: int
    latest_distress_score: float
    recent_sessions: List[ChatSessionResponse]
    clinical_recommendations: List[str]

class AIChatRequest(BaseModel):
    case_id: int
    message: str
    language: Optional[str] = "en"
    session_id: Optional[str] = None
    vocal_emotion: Optional[Dict[str, Any]] = None

class AIChatResponse(BaseModel):
    user_message: ChatMessageResponse
    ai_message: ChatMessageResponse
    session_id: Optional[str] = None
    session_title: Optional[str] = None
    distress_score: float
    crisis_flagged: bool
    grounding_exercise: Optional[str] = None
    suggested_actions: List[str] = []
    vocal_emotion_detected: Optional[Dict[str, Any]] = None

class VoiceEmotionRequest(BaseModel):
    case_id: Optional[int] = 1
    text: str
    acoustic_telemetry: Optional[Dict[str, Any]] = None
    language: Optional[str] = "en"

class VoiceEmotionResponse(BaseModel):
    primary_emotion: str
    emotion_label: str
    badge: str
    color: str
    confidence: float
    vocal_distress_score: float
    emotion_distribution: Dict[str, float]
    biomarkers: Dict[str, Any]
    clinical_interpretation: str
    recommended_pacing: str
    adaptive_opening: str

class AISettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"

class AISettingsResponse(BaseModel):
    engine: str # "gemini" or "autonomous"
    model: str
    has_api_key: bool
    status: str
    message: Optional[str] = None

class AIClearChatRequest(BaseModel):
    case_id: int
    channel: Optional[str] = "ai_companion"

class IVRSCallSimulateRequest(BaseModel):
    case_id: int
    spoken_response: str
    language: Optional[str] = "en"
    acoustic_telemetry: Optional[Dict[str, Any]] = None

class IVRSCallSimulateResponse(BaseModel):
    call_id: str
    case_id: int
    timestamp: datetime
    prompt_played: str
    victim_transcript: str
    vocal_stress_level: str
    vocal_distress_score: float
    detected_emotion: str
    threat_flag: bool
    escalation_triggered: bool
    recommended_action: str

class InterAgencyAlertRequest(BaseModel):
    case_id: int
    target_agency: str # "counsellor", "district_magistrate", "police_sp"
    severity: str # "critical", "high", "moderate"
    message: str
    action_required: str

class GovernanceStatsResponse(BaseModel):
    level: str # "district", "state", "national"
    scope_name: str
    total_monitored_victims: int
    critical_distress_cases: int
    witnesses_under_protection: int
    relief_compensation_disbursed_inr: str
    relief_compensation_pending_inr: str
    predictive_7d_crisis_surges: int
    priority_use_cases: Dict[str, int]
    legal_lifecycle_distribution: Dict[str, int]
    inter_agency_coordination_index: float

class StateListResponse(BaseModel):
    states: List[str]

class DistrictListResponse(BaseModel):
    districts: List[str]
    state: Optional[str] = None

