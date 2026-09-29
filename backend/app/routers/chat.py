import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.case import Case
from ..models.message import Message
from ..models.alert import Alert
from ..models.chat_session import ChatSession
from ..schemas import (
    ChatMessageCreate, ChatMessageResponse, AIChatRequest, AIChatResponse,
    VoiceEmotionRequest, VoiceEmotionResponse, AISettingsRequest, AISettingsResponse, AIClearChatRequest,
    ChatSessionCreate, ChatSessionResponse, ChatSessionDetailResponse, PatientMindInsightsResponse
)
from ..middleware.auth import get_current_user
from ai.chat_engine import generate_ai_response
from ai.voice_emotion_engine import analyze_vocal_emotion

router = APIRouter(prefix="/api/chat", tags=["chat"])

def generate_session_title(text: str) -> str:
    cleaned = text.strip()
    lower = cleaned.lower()
    for prefix in [
        "hello", "hi", "hey", "namaste", "i feel", "i am feeling", "i am", "mujhe",
        "mera", "please", "can you", "help me with", "i'm feeling", "i need", "kripya"
    ]:
        if lower.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip(" ,.-!?")
            break
    if not cleaned:
        cleaned = text.strip()
    words = cleaned.split()
    if len(words) > 6:
        title = " ".join(words[:6]) + "..."
    else:
        title = " ".join(words)
    title = title.capitalize()
    return title[:48] if title else "Support Conversation"

def generate_session_summary(user_msgs: List[str], distress_score: float, emotion: str) -> str:
    combined = " ".join(user_msgs).lower()
    themes = []
    if any(w in combined for w in ["court", "hearing", "judge", "trial", "lawyer", "police", "fir", "case", "deposition", "advocate"]):
        themes.append("Legal / Court Proceedings Anxiety")
    if any(w in combined for w in ["scared", "fear", "threat", "kill", "attack", "danger", "safe", "threaten", "darr"]):
        themes.append("Safety Concerns & Threat Apprehension (Sec 15A)")
    if any(w in combined for w in ["sleep", "nightmare", "insomnia", "tired", "awake", "neend", "dreams"]):
        themes.append("Sleep Architecture & Insomnia")
    if any(w in combined for w in ["alone", "lonely", "family", "nobody", "friend", "koi nahi", "abandoned"]):
        themes.append("Social Isolation & Alienation")
    if any(w in combined for w in ["breath", "panic", "heart", "chest", "dizzy", "shake", "ghabrahat", "tremor"]):
        themes.append("Acute Somatic Panic / Distress")
    if not themes:
        themes.append("Emotional Processing & Grounding Support")
    
    theme_str = ", ".join(themes)
    return f"Patient mental focus: {theme_str}. Distress level: {distress_score:.0f}/100. Dominant emotion: {emotion}."

def to_session_response(s: ChatSession) -> ChatSessionResponse:
    return ChatSessionResponse(
        id=s.id,
        case_id=s.case_id,
        user_id=s.user_id,
        channel=s.channel or "ai_companion",
        title=s.title or "Conversation Session",
        summary=s.summary,
        dominant_emotion=s.dominant_emotion or "neutral",
        distress_score=s.distress_score or 20.0,
        crisis_flagged=bool(s.crisis_flagged),
        message_count=s.message_count or 0,
        is_active=bool(s.is_active),
        created_at=s.created_at or datetime.utcnow(),
        updated_at=s.updated_at
    )

def to_message_response(m: Message, current_user: Optional[User] = None) -> ChatMessageResponse:
    sender_name = "Sarajeevi AI"
    if m.sender_role == "user":
        sender_name = m.sender.full_name if m.sender else (current_user.full_name if current_user else "Patient")
    elif m.sender_role == "therapist":
        sender_name = m.sender.full_name if m.sender else "Dr. Sarah Jenkins"
    elif m.sender_role == "ai":
        sender_name = "Sarajeevi AI Companion"

    return ChatMessageResponse(
        id=m.id,
        case_id=m.case_id,
        sender_id=m.sender_id,
        sender_name=sender_name,
        sender_role=m.sender_role,
        channel=m.channel,
        session_id=m.session_id,
        content=m.content,
        sentiment_score=m.sentiment_score,
        is_crisis_flagged=bool(m.is_crisis_flagged),
        is_read=bool(m.is_read),
        created_at=m.created_at or datetime.utcnow()
    )

# ============================================================================
# CHAT SESSIONS CRUD & HISTORY ENDPOINTS (ChatGPT / Gemini Style)
# ============================================================================

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    case_id: int,
    channel: Optional[str] = "ai_companion",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_id = case_id
    if target_id > 1000:
        target_id = target_id - 1000
        
    sessions = db.query(ChatSession).filter(
        ChatSession.case_id == target_id,
        ChatSession.channel == channel
    ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).all()
    
    # If no sessions exist yet, check for unassigned messages and create a starter session
    if not sessions:
        unassigned_msgs = db.query(Message).filter(
            Message.case_id == target_id,
            Message.channel == channel,
            Message.session_id == None
        ).order_by(Message.created_at.asc()).all()
        
        starter_session = ChatSession(
            case_id=target_id,
            user_id=current_user.id,
            channel=channel,
            title="Initial Welcome & Orientation",
            dominant_emotion="neutral",
            distress_score=20.0,
            message_count=len(unassigned_msgs) if unassigned_msgs else 1,
            is_active=True
        )
        db.add(starter_session)
        db.commit()
        db.refresh(starter_session)
        
        if unassigned_msgs:
            for m in unassigned_msgs:
                m.session_id = starter_session.id
            db.commit()
        else:
            welcome_msg = Message(
                case_id=target_id,
                sender_id=current_user.id,
                sender_role="ai",
                channel=channel,
                session_id=starter_session.id,
                content=(
                    f"Namaste {current_user.full_name or 'there'}. I am Sanjeevani (संजीवनी), your trauma-informed "
                    "support companion under the National Helpline Against Atrocities (14566) framework. "
                    "I am here with you 24/7. How are you feeling in your mind and body today?"
                ),
                is_read=True
            )
            db.add(welcome_msg)
            db.commit()
            
        sessions = [starter_session]
        
    return [to_session_response(s) for s in sessions]


@router.post("/sessions", response_model=ChatSessionDetailResponse)
def create_chat_session(
    req: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_id = req.case_id
    if target_id > 1000:
        target_id = target_id - 1000
        
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        case = db.query(Case).first()
        
    resolved_case_id = case.id if case else target_id

    new_session = ChatSession(
        case_id=resolved_case_id,
        user_id=current_user.id,
        channel=req.channel or "ai_companion",
        title=req.title or "New Conversation",
        dominant_emotion="neutral",
        distress_score=20.0,
        message_count=1,
        is_active=True
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    patient_display = current_user.full_name or "there"
    welcome_content = (
        f"Namaste {patient_display}. I am Sanjeevani (संजीवनी), your trauma-informed companion "
        "under the National Helpline Against Atrocities (14566) framework. I am here to listen, support, and guide you through calming exercises. "
        "How are you feeling right now?"
    )
    welcome_msg = Message(
        case_id=new_session.case_id,
        sender_id=current_user.id,
        sender_role="ai",
        channel=new_session.channel,
        session_id=new_session.id,
        content=welcome_content,
        is_read=True
    )
    db.add(welcome_msg)
    db.commit()
    db.refresh(welcome_msg)
    
    return ChatSessionDetailResponse(
        session=to_session_response(new_session),
        messages=[to_message_response(welcome_msg, current_user)]
    )


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_chat_session_details(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    messages = db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at.asc()).all()
    
    return ChatSessionDetailResponse(
        session=to_session_response(session),
        messages=[to_message_response(m, current_user) for m in messages]
    )


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
        
    case_id = session.case_id
    channel = session.channel

    # Delete all messages in session
    db.query(Message).filter(Message.session_id == session.id).delete()
    db.delete(session)
    db.commit()

    # Ensure there is always at least one active session remaining
    remaining = db.query(ChatSession).filter(
        ChatSession.case_id == case_id,
        ChatSession.channel == channel
    ).count()

    if remaining == 0:
        fresh_sess = ChatSession(
            case_id=case_id,
            user_id=current_user.id,
            channel=channel,
            title="New Conversation",
            dominant_emotion="neutral",
            distress_score=20.0,
            message_count=1,
            is_active=True
        )
        db.add(fresh_sess)
        db.commit()
        db.refresh(fresh_sess)

        welcome_msg = Message(
            case_id=case_id,
            sender_id=current_user.id,
            sender_role="ai",
            channel=channel,
            session_id=fresh_sess.id,
            content=(
                f"Namaste. I am Sanjeevani, your trauma-informed companion under the "
                "National Helpline Against Atrocities (14566) framework. I am here with you 24/7. "
                "How are you feeling today?"
            ),
            is_read=True
        )
        db.add(welcome_msg)
        db.commit()

    return {"status": "success", "message": f"Chat session {session_id} deleted successfully"}


# ============================================================================
# PATIENT MIND INSIGHTS (Synthesis of Patient's Mental State for Counsellor)
# ============================================================================

@router.get("/patient-mind-insights/{case_id}", response_model=PatientMindInsightsResponse)
def get_patient_mind_insights(
    case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_id = case_id
    if target_id > 1000:
        target_id = target_id - 1000
        
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    patient_name = case.victim.full_name if case.victim else (getattr(case, "victim_name", None) or "Elena Vance")
    
    sessions = db.query(ChatSession).filter(
        ChatSession.case_id == case.id,
        ChatSession.channel == "ai_companion"
    ).order_by(ChatSession.created_at.desc()).all()
    
    total_messages = db.query(Message).filter(
        Message.case_id == case.id,
        Message.channel == "ai_companion"
    ).count()
    
    trajectory = []
    dominant_concerns_set = set()
    latest_distress = 25.0
    
    chronological_sessions = list(reversed(sessions[:10]))
    for s in chronological_sessions:
        d_str = s.created_at.strftime("%d %b %H:%M") if s.created_at else "Recent"
        trajectory.append({
            "session_id": s.id,
            "title": s.title,
            "date": d_str,
            "distress_score": s.distress_score or 20.0,
            "emotion": s.dominant_emotion or "neutral",
            "crisis_flagged": s.crisis_flagged
        })
        if s.distress_score is not None:
            latest_distress = s.distress_score
            
        combined_text = f"{s.title} {s.summary or ''}".lower()
        if any(k in combined_text for k in ["court", "trial", "hearing", "deposition", "judge", "advocate"]):
            dominant_concerns_set.add("Anticipatory Court Hearing & Cross-Examination Dread")
        if any(k in combined_text for k in ["sleep", "insomnia", "nightmare", "night", "awake"]):
            dominant_concerns_set.add("Nighttime REM Fragmentation & Insomnia")
        if any(k in combined_text for k in ["threat", "danger", "scared", "fear", "harm"]):
            dominant_concerns_set.add("Witness Intimidation & Safety Apprehension (PoA Sec 15A)")
        if any(k in combined_text for k in ["panic", "breath", "shake", "chest", "dizzy", "anxiety"]):
            dominant_concerns_set.add("Acute Somatic Hyperarousal & Panic Tremors")
        if any(k in combined_text for k in ["lone", "isolate", "nobody", "alone"]):
            dominant_concerns_set.add("Social Alienation & Community Stigma")
            
    if not dominant_concerns_set:
        dominant_concerns_set = {
            "Anticipatory Court Hearing & Cross-Examination Dread",
            "Nighttime REM Fragmentation & Insomnia",
            "Witness Safety Confidence (PoA Sec 15A)",
            "Situational Hypervigilance"
        }
        
    crisis_sessions = [s for s in sessions if s.crisis_flagged]
    has_crisis = len(crisis_sessions) > 0
    high_distress = latest_distress > 60
    
    if has_crisis:
        mind_summary = (
            f"Clinical AI Analysis indicates {patient_name} is experiencing acute cognitive overload with crisis markers. "
            "Conversational data reveals intense fear of imminent court confrontation, severe somatic hyperventilation, and vulnerability. "
            "The patient actively utilizes the AI companion for emergency grounding and 4-7-8 breathing pacers during late-night distress episodes."
        )
    elif high_distress:
        mind_summary = (
            f"Analysis of {patient_name}'s chatbot conversations indicates elevated psychological tension and hypervigilance. "
            "Dominant recurring cognitive themes focus on courtroom deposition fears and anticipatory dread regarding facing the accused. "
            "The patient responds positively to structured sensory grounding exercises, but sleep architecture remains significantly disturbed."
        )
    else:
        mind_summary = (
            f"{patient_name}'s recent chatbot interactions demonstrate stabilized baseline emotional regulation with mild situational anxiety. "
            "The patient engages well with daily coping strategies and maintains positive rapport with the Sanjeevani companion. "
            "Focus remains on cultivating mental resilience and grounding readiness for upcoming legal milestones."
        )
        
    recommendations = [
        f"Schedule focused pre-deposition rehearsal to desensitize {patient_name} to courtroom confrontation anxiety.",
        "Inquire into sleep disturbance patterns and reinforce nighttime somatic grounding (4-7-8 breathing pacer).",
        "Reassure witness protection measures under PoA Section 15A armed police escort protocol.",
        "Review AI companion crisis grounding logs and emotional trajectory during next scheduled consultation."
    ]
    
    session_responses = [to_session_response(s) for s in sessions[:20]]
    
    return PatientMindInsightsResponse(
        case_id=case.id,
        patient_name=patient_name,
        current_mind_state_summary=mind_summary,
        dominant_concerns=list(dominant_concerns_set)[:4],
        emotional_trajectory=trajectory,
        total_ai_sessions=len(sessions),
        total_ai_messages=total_messages,
        latest_distress_score=latest_distress,
        recent_sessions=session_responses,
        clinical_recommendations=recommendations
    )


# ============================================================================
# INTERACTIVE AI CHAT WITH MULTI-SESSION PERSISTENCE
# ============================================================================

@router.post("/ai", response_model=AIChatResponse)
def chat_with_ai(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case_id = req.case_id
    if case_id > 1000:
        case_id = case_id - 1000
        
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        case = db.query(Case).filter(Case.victim_id == current_user.id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    # Resolve active chat session
    session = None
    if req.session_id:
        session = db.query(ChatSession).filter(ChatSession.id == req.session_id).first()
        
    if not session:
        session = db.query(ChatSession).filter(
            ChatSession.case_id == case.id,
            ChatSession.channel == "ai_companion",
            ChatSession.is_active == True
        ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).first()

    if not session:
        session = ChatSession(
            case_id=case.id,
            user_id=current_user.id,
            channel="ai_companion",
            title=generate_session_title(req.message),
            dominant_emotion="neutral",
            distress_score=20.0,
            message_count=0,
            is_active=True
        )
        db.add(session)
        db.commit()
        db.refresh(session)

    # 1. Save user's message bound to active session
    user_msg = Message(
        case_id=case.id,
        sender_id=current_user.id,
        sender_role="user",
        channel="ai_companion",
        session_id=session.id,
        content=req.message,
        is_read=True
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 1.5 Retrieve recent multi-turn conversation dialogue history scoped to this session
    recent_history_msgs = db.query(Message).filter(
        Message.session_id == session.id,
        Message.id != user_msg.id
    ).order_by(Message.created_at.desc()).limit(12).all()
    recent_history_msgs.reverse()
    
    conversation_history = [
        {"role": "user" if m.sender_role == "user" else "model", "content": m.content}
        for m in recent_history_msgs
    ]

    case_context = {
        "nhaa_docket_no": getattr(case, "nhaa_docket_no", None),
        "legal_stage": getattr(case, "legal_stage", "trial"),
        "threat_level": getattr(case, "threat_level", "Moderate")
    }

    # 2. Generate trauma-informed AI response with voice emotion awareness & multi-turn memory
    counsellor_name = case.counsellor.full_name if case.counsellor else "Dr. Sarah Jenkins"
    ai_eval = generate_ai_response(
        req.message,
        patient_name=current_user.full_name or "there",
        counsellor_name=counsellor_name,
        language=req.language or "en",
        vocal_emotion=req.vocal_emotion,
        conversation_history=conversation_history,
        case_context=case_context
    )

    # 3. Save AI's response bound to active session
    ai_user = db.query(User).filter(User.role == "counsellor").first()
    ai_sender_id = ai_user.id if ai_user else current_user.id

    ai_msg = Message(
        case_id=case.id,
        sender_id=ai_sender_id,
        sender_role="ai",
        channel="ai_companion",
        session_id=session.id,
        content=ai_eval["reply"],
        sentiment_score=ai_eval["sentiment"],
        is_crisis_flagged=ai_eval["crisis_flagged"],
        is_read=True
    )
    db.add(ai_msg)

    # 4. If crisis flagged, trigger immediate Alert in EHR
    if ai_eval["crisis_flagged"]:
        alert = Alert(
            case_id=case.id,
            alert_type="crisis_keywords",
            severity="critical",
            message=f"Acute crisis keywords detected in AI Companion chat from {current_user.full_name}: '{req.message[:70]}...'"
        )
        db.add(alert)
        case.risk_level = "critical"
        session.crisis_flagged = True

    # 5. Update session metadata (title, message count, distress score, summary for counsellor)
    if session.title in ["New Conversation", "New Chat", "Initial Welcome & Orientation"] or not session.title:
        session.title = generate_session_title(req.message)

    user_session_texts = [
        m.content for m in db.query(Message).filter(
            Message.session_id == session.id,
            Message.sender_role == "user"
        ).all()
    ]
    user_session_texts.append(req.message)

    emotion = "neutral"
    if req.vocal_emotion and req.vocal_emotion.get("primary_emotion"):
        emotion = req.vocal_emotion.get("primary_emotion")
    elif ai_eval.get("distress_score", 0) > 60:
        emotion = "anxious"
    elif ai_eval.get("distress_score", 0) > 35:
        emotion = "uneasy"
    else:
        emotion = "calm"

    session.dominant_emotion = emotion
    session.distress_score = float(ai_eval["distress_score"])
    session.message_count = db.query(Message).filter(Message.session_id == session.id).count() + 1
    session.summary = generate_session_summary(user_session_texts, session.distress_score, session.dominant_emotion)
    session.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(ai_msg)
    db.refresh(session)

    user_resp = to_message_response(user_msg, current_user)
    ai_resp = to_message_response(ai_msg, current_user)

    return AIChatResponse(
        user_message=user_resp,
        ai_message=ai_resp,
        session_id=session.id,
        session_title=session.title,
        distress_score=ai_eval["distress_score"],
        crisis_flagged=ai_eval["crisis_flagged"],
        grounding_exercise=ai_eval["grounding_exercise"],
        suggested_actions=ai_eval["suggested_actions"],
        vocal_emotion_detected=ai_eval.get("vocal_emotion_detected")
    )

@router.post("/voice-analyze", response_model=VoiceEmotionResponse)
def analyze_voice(
    req: VoiceEmotionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = analyze_vocal_emotion(
        spoken_text=req.text,
        acoustic_telemetry=req.acoustic_telemetry,
        language=req.language or "en"
    )
    return VoiceEmotionResponse(**analysis)

@router.get("/messages/{case_id}", response_model=List[ChatMessageResponse])
def get_messages(
    case_id: int,
    channel: Optional[str] = None,
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_id = case_id
    if target_id > 1000:
        target_id = target_id - 1000

    query = db.query(Message).filter(Message.case_id == target_id)
    if channel:
        query = query.filter(Message.channel == channel)
        
    if session_id:
        query = query.filter(Message.session_id == session_id)
    elif channel == "ai_companion":
        latest_sess = db.query(ChatSession).filter(
            ChatSession.case_id == target_id,
            ChatSession.channel == "ai_companion"
        ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).first()
        if latest_sess:
            query = query.filter(Message.session_id == latest_sess.id)
    
    messages = query.order_by(Message.created_at.asc()).all()
    
    # If no messages exist yet, seed a warm introductory welcome message
    if not messages and (channel == "ai_companion" or not channel):
        starter_sess = db.query(ChatSession).filter(
            ChatSession.case_id == target_id,
            ChatSession.channel == "ai_companion"
        ).order_by(ChatSession.updated_at.desc(), ChatSession.created_at.desc()).first()

        if not starter_sess:
            starter_sess = ChatSession(
                case_id=target_id,
                user_id=current_user.id,
                channel="ai_companion",
                title="Initial Welcome & Orientation",
                dominant_emotion="neutral",
                distress_score=20.0,
                message_count=1,
                is_active=True
            )
            db.add(starter_sess)
            db.commit()
            db.refresh(starter_sess)

        welcome_content = (
            f"Hello {current_user.full_name or 'there'}! I'm Sarajeevi AI (संजीवनी), your 24/7 trauma-informed support companion. "
            "I'm here to listen, offer calming grounding exercises, and support your well-being. "
            "How are you feeling in your mind and body today?"
        )
        first_msg = Message(
            case_id=target_id,
            sender_id=current_user.id,
            sender_role="ai",
            channel="ai_companion",
            session_id=starter_sess.id,
            content=welcome_content,
            is_read=True
        )
        db.add(first_msg)
        db.commit()
        db.refresh(first_msg)
        messages = [first_msg]
        
    return [to_message_response(m, current_user) for m in messages]

@router.post("/therapist", response_model=ChatMessageResponse)
def send_therapist_message(
    msg: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_id = msg.case_id
    if target_id > 1000:
        target_id = target_id - 1000

    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    sender_role = "therapist" if current_user.role == "counsellor" else "user"

    new_msg = Message(
        case_id=case.id,
        sender_id=current_user.id,
        sender_role=sender_role,
        channel="therapist_direct",
        content=msg.content,
        is_read=False
    )
    db.add(new_msg)
    
    # If patient sent message to therapist, notify clinician via alert if distress indicators exist
    if sender_role == "user":
        db.add(Alert(
            case_id=case.id,
            alert_type="patient_message",
            severity="moderate",
            message=f"New direct message from {current_user.full_name}: '{msg.content[:60]}...'"
        ))

    db.commit()
    db.refresh(new_msg)

    return ChatMessageResponse(
        id=new_msg.id,
        case_id=new_msg.case_id,
        sender_id=new_msg.sender_id,
        sender_name=current_user.full_name or ("Dr. Sarah Jenkins" if sender_role == "therapist" else "Patient"),
        sender_role=new_msg.sender_role,
        channel=new_msg.channel,
        content=new_msg.content,
        sentiment_score=new_msg.sentiment_score,
        is_crisis_flagged=new_msg.is_crisis_flagged,
        is_read=new_msg.is_read,
        created_at=new_msg.created_at
    )

@router.patch("/messages/{message_id}/read")
def mark_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg.is_read = True
    db.commit()
    return {"status": "success", "message_id": message_id}


@router.get("/settings", response_model=AISettingsResponse)
def get_ai_settings(current_user: User = Depends(get_current_user)):
    gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    has_key = bool(gemini_key and len(gemini_key.strip()) > 5)
    engine = "gemini" if has_key else "autonomous"
    model = os.environ.get("DEFAULT_AI_MODEL", "gemini-2.5-flash")
    status = "online" if has_key else "active_autonomous"
    msg = "Connected to Google Gemini Flash API" if has_key else "Operating with Autonomous Multi-Turn Conversational Engine"
    return AISettingsResponse(
        engine=engine,
        model=model,
        has_api_key=has_key,
        status=status,
        message=msg
    )

@router.post("/settings", response_model=AISettingsResponse)
def update_ai_settings(req: AISettingsRequest, current_user: User = Depends(get_current_user)):
    if req.gemini_api_key is not None:
        key = req.gemini_api_key.strip()
        os.environ["GEMINI_API_KEY"] = key
        try:
            with open(".env", "a+", encoding="utf-8") as f:
                f.write(f"\nGEMINI_API_KEY={key}\n")
        except Exception:
            pass
    if req.model:
        os.environ["DEFAULT_AI_MODEL"] = req.model

    gemini_key = os.environ.get("GEMINI_API_KEY") or ""
    has_key = bool(gemini_key and len(gemini_key.strip()) > 5)
    return AISettingsResponse(
        engine="gemini" if has_key else "autonomous",
        model=req.model or "gemini-2.5-flash",
        has_api_key=has_key,
        status="connected" if has_key else "autonomous_mode",
        message="AI Engine settings updated successfully"
    )

@router.post("/clear")
def clear_chat_history(req: AIClearChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cid = req.case_id
    if cid > 1000:
        cid = cid - 1000

    if req.channel == "ai_companion":
        # Create a fresh new session preserving earlier history like ChatGPT/Gemini
        new_sess = ChatSession(
            case_id=cid,
            user_id=current_user.id,
            channel="ai_companion",
            title="New Conversation",
            dominant_emotion="neutral",
            distress_score=20.0,
            message_count=1,
            is_active=True
        )
        db.add(new_sess)
        db.commit()
        db.refresh(new_sess)

        welcome_msg = (
            "Namaste. I am Sanjeevani, your trauma-informed companion under the "
            "National Helpline Against Atrocities (14566) framework. I am here with you 24/7. "
            "How are you feeling today?"
        )
        new_msg = Message(
            case_id=cid,
            sender_id=None,
            sender_role="ai",
            channel="ai_companion",
            session_id=new_sess.id,
            content=welcome_msg,
            is_read=True
        )
        db.add(new_msg)
        db.commit()
        return {"status": "success", "message": "Conversation session reset to new chat", "session_id": new_sess.id}
    else:
        db.query(Message).filter(Message.case_id == cid, Message.channel == req.channel).delete()
        db.commit()
        return {"status": "success", "message": "Conversation session reset to new chat"}
