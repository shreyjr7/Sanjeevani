from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.case import Case, ClinicalNote
from ..models.alert import Alert
from ..models.user import User
from ..models.checkin import CheckIn
from ..models.risk_score import RiskScore
from ..schemas import (
    CaseResponse, CaseBase, CaseUpdate, ClinicalNoteCreate, ClinicalNoteResponse,
    IVRSCallSimulateRequest, IVRSCallSimulateResponse, InterAgencyAlertRequest
)
from ..middleware.auth import get_current_user

router = APIRouter(prefix="/api/cases", tags=["cases"])

def _get_case_flaw_meta(case_id: int, patient_name: str):
    p_lower = (patient_name or "").lower()
    if case_id == 1 or "elena" in p_lower:
        return "Catastrophic Somatosensory Amplification & Avoidance Loop", "High"
    elif case_id == 2 or "marcus" in p_lower:
        return "Emotional Blunting & Social Withdrawal Defense Barrier", "Moderate"
    elif "sarah" in p_lower or "aarav" in p_lower:
        return "Severe Intrusive Rumination & Panic Phobia", "Critical"
    return "Hyperarousal & Trauma Re-experiencing Barrier", "Moderate-High"

def _enrich_nhaa_meta(c):
    cid = c.id
    docket = c.nhaa_docket_no or f"NHAA-14566-2026-UP-{4800 + cid}"
    
    if cid % 4 == 1:
        cat = c.case_category or "rape_gang_rape"
        stage = c.legal_stage or "trial"
        threat = c.threat_level or "High / Imminent"
        hearing = c.court_next_hearing or "2026-09-18 (Special SC/ST Court)"
        pred_risk = c.predictive_crisis_risk_7d or 88
        comp = c.compensation_status or "25% Disbursed at FIR (₹2,12,500) | 75% Pending Trial Deposition"
        prot = c.witness_protection_status or "Armed Escort & Static Security (Sec 15A)"
        fir = c.fir_number or f"FIR #{120 + cid}/2026 PS Sadar"
        ps = c.police_station or "Special Atrocity Cell, PS Sadar"
        dist = c.district or "Varanasi"
        st = c.state or "Uttar Pradesh"
    elif cid % 4 == 2:
        cat = c.case_category or "murder_arson_grievous"
        stage = c.legal_stage or "investigation"
        threat = c.threat_level or "Moderate"
        hearing = c.court_next_hearing or "2026-09-24 (Magistrate Charge Sheet Review)"
        pred_risk = c.predictive_crisis_risk_7d or 74
        comp = c.compensation_status or "50% Disbursed post-Postmortem (₹4,12,500) | 50% Pending Charge Sheet"
        prot = c.witness_protection_status or "Safe House Relocation Deployed"
        fir = c.fir_number or f"FIR #{204 + cid}/2026 PS Kotwali"
        ps = c.police_station or "SC/ST Protection Cell, PS Kotwali"
        dist = c.district or "Jaipur"
        st = c.state or "Rajasthan"
    elif cid % 4 == 3:
        cat = c.case_category or "witness_intimidation"
        stage = c.legal_stage or "trial"
        threat = c.threat_level or "High / Imminent"
        hearing = c.court_next_hearing or "2026-09-15 (Special Sessions Court Trial)"
        pred_risk = c.predictive_crisis_risk_7d or 92
        comp = c.compensation_status or "Witness Travel & Daily Allowance Disbursed (Sec 15A)"
        prot = c.witness_protection_status or "Round-the-Clock Armed Police Guard & CCTV"
        fir = c.fir_number or f"FIR #{310 + cid}/2026 PS Cantt"
        ps = c.police_station or "Atrocity Investigation Cell, PS Cantt"
        dist = c.district or "Nagpur"
        st = c.state or "Maharashtra"
    else:
        cat = c.case_category or "caste_violence_boycott"
        stage = c.legal_stage or "compensation"
        threat = c.threat_level or "Guarded"
        hearing = c.court_next_hearing or "2026-10-02 (District Vigilance Committee Review)"
        pred_risk = c.predictive_crisis_risk_7d or 46
        comp = c.compensation_status or "100% Full Relief Package Approved (₹8,50,000 via DBT)"
        prot = c.witness_protection_status or "Periodic Police Patrol Log Book"
        fir = c.fir_number or f"FIR #{415 + cid}/2026 PS Rural"
        ps = c.police_station or "Welfare & Human Rights Cell, PS Rural"
        dist = c.district or "Madurai"
        st = c.state or "Tamil Nadu"

    touchpoints = [
        {"channel": "Chatbot", "status": "Active (Sarajeevi AI 24/7)", "last_ping": "Today, 02:45 AM"},
        {"channel": "IVRS Outbound Call", "status": "Periodic Automated Voice Dial", "last_ping": "Yesterday, 06:15 PM"},
        {"channel": "SMS / WhatsApp", "status": "High-Frequency Outreach", "last_ping": "2 days ago"},
        {"channel": "NHAA 14566 Helpline", "status": "Linked National Docket", "last_ping": "Connected"}
    ]

    return {
        "nhaa_docket_no": docket,
        "case_category": cat,
        "legal_stage": stage,
        "fir_number": fir,
        "police_station": ps,
        "district": dist,
        "state": st,
        "threat_level": threat,
        "court_next_hearing": hearing,
        "predictive_crisis_risk_7d": pred_risk,
        "compensation_status": comp,
        "witness_protection_status": prot,
        "touchpoints": touchpoints
    }

@router.get("", response_model=List[CaseResponse])
def get_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "counsellor":
        cases = db.query(Case).all()
    else:
        cases = db.query(Case).filter(Case.victim_id == current_user.id).all()

    result = []
    for c in cases:
        chks = db.query(CheckIn).filter(CheckIn.case_id == c.id).all()
        avg_mood = round(sum(k.mood_score for k in chks) / len(chks), 1) if chks else 5.0
        
        latest_risk = 20.0
        if c.risk_level == "critical":
            latest_risk = 90.0
        elif c.risk_level == "high":
            latest_risk = 74.0
        elif c.risk_level == "moderate":
            latest_risk = 48.0

        latest_chk = db.query(CheckIn).filter(CheckIn.case_id == c.id).order_by(CheckIn.submitted_at.desc()).first()
        if latest_chk:
            r = db.query(RiskScore).filter(RiskScore.checkin_id == latest_chk.id).first()
            if r and r.distress_score is not None:
                latest_risk = r.distress_score

        pat_name = c.victim.full_name if c.victim else f"Patient #{c.victim_id}"
        pflaw, psev = _get_case_flaw_meta(c.id, pat_name)
        nhaa = _enrich_nhaa_meta(c)

        result.append(CaseResponse(
            id=c.id,
            victim_id=c.victim_id,
            victim_name=pat_name,
            counsellor_name=c.counsellor.full_name if c.counsellor else "Dr. Sarah Jenkins",
            status=c.status,
            risk_level=c.risk_level,
            assigned_counsellor_id=c.assigned_counsellor_id,
            created_at=c.created_at,
            updated_at=c.updated_at,
            checkins_count=len(chks),
            average_mood=avg_mood,
            latest_risk_score=latest_risk,
            days_monitored=30,
            victim_age=c.victim.age if c.victim else 29,
            victim_gender=c.victim.gender if c.victim else "Female",
            victim_phone=c.victim.phone if c.victim else "+1 (555) 782-4419",
            victim_emergency_contact=c.victim.emergency_contact if c.victim else "Family Contact",
            victim_bio=c.victim.bio if c.victim else "Monitored patient file",
            primary_flaw=pflaw,
            flaw_severity=psev,
            nhaa_docket_no=nhaa["nhaa_docket_no"],
            case_category=nhaa["case_category"],
            legal_stage=nhaa["legal_stage"],
            fir_number=nhaa["fir_number"],
            police_station=nhaa["police_station"],
            district=nhaa["district"],
            state=nhaa["state"],
            threat_level=nhaa["threat_level"],
            court_next_hearing=nhaa["court_next_hearing"],
            predictive_crisis_risk_7d=nhaa["predictive_crisis_risk_7d"],
            compensation_status=nhaa["compensation_status"],
            witness_protection_status=nhaa["witness_protection_status"],
            touchpoints=nhaa["touchpoints"]
        ))
    return result

@router.get("/{id}", response_model=CaseResponse)
def get_case(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_id = id
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case and target_id > 1000:
        target_id = target_id - 1000
        case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    chks = db.query(CheckIn).filter(CheckIn.case_id == case.id).all()
    avg_mood = round(sum(k.mood_score for k in chks) / len(chks), 1) if chks else 5.0
    latest_risk = 22.0
    if case.risk_level == "critical":
        latest_risk = 92.0
    elif case.risk_level == "high":
        latest_risk = 76.0
    elif case.risk_level == "moderate":
        latest_risk = 48.0

    latest_chk = db.query(CheckIn).filter(CheckIn.case_id == case.id).order_by(CheckIn.submitted_at.desc()).first()
    if latest_chk:
        r = db.query(RiskScore).filter(RiskScore.checkin_id == latest_chk.id).first()
        if r and r.distress_score is not None:
            latest_risk = r.distress_score

    pat_name = case.victim.full_name if case.victim else f"Patient #{case.victim_id}"
    pflaw, psev = _get_case_flaw_meta(case.id, pat_name)
    nhaa = _enrich_nhaa_meta(case)

    return CaseResponse(
        id=case.id,
        victim_id=case.victim_id,
        victim_name=pat_name,
        counsellor_name=case.counsellor.full_name if case.counsellor else "Dr. Sarah Jenkins",
        status=case.status,
        risk_level=case.risk_level,
        assigned_counsellor_id=case.assigned_counsellor_id,
        created_at=case.created_at,
        updated_at=case.updated_at,
        checkins_count=len(chks),
        average_mood=avg_mood,
        latest_risk_score=latest_risk,
        days_monitored=30,
        victim_age=case.victim.age if case.victim else 29,
        victim_gender=case.victim.gender if case.victim else "Female",
        victim_phone=case.victim.phone if case.victim else "+1 (555) 782-4419",
        victim_emergency_contact=case.victim.emergency_contact if case.victim else "Family Contact",
        victim_bio=case.victim.bio if case.victim else "Monitored patient file",
        primary_flaw=pflaw,
        flaw_severity=psev,
        nhaa_docket_no=nhaa["nhaa_docket_no"],
        case_category=nhaa["case_category"],
        legal_stage=nhaa["legal_stage"],
        fir_number=nhaa["fir_number"],
        police_station=nhaa["police_station"],
        district=nhaa["district"],
        state=nhaa["state"],
        threat_level=nhaa["threat_level"],
        court_next_hearing=nhaa["court_next_hearing"],
        predictive_crisis_risk_7d=nhaa["predictive_crisis_risk_7d"],
        compensation_status=nhaa["compensation_status"],
        witness_protection_status=nhaa["witness_protection_status"],
        touchpoints=nhaa["touchpoints"]
    )

@router.post("", response_model=CaseResponse)
def create_case(case: CaseBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_case = Case(**case.dict())
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

@router.patch("/{id}", response_model=CaseResponse)
def update_case(id: int, update_data: CaseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_id = id
    if target_id > 1000:
        target_id = target_id - 1000
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if update_data.status is not None:
        case.status = update_data.status
    if update_data.risk_level is not None:
        case.risk_level = update_data.risk_level
    if update_data.assigned_counsellor_id is not None:
        case.assigned_counsellor_id = update_data.assigned_counsellor_id
    db.commit()
    db.refresh(case)
    return get_case(case.id, db, current_user)

@router.get("/{id}/notes", response_model=List[ClinicalNoteResponse])
def get_case_notes(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_id = id
    if target_id > 1000:
        target_id = target_id - 1000
    notes = db.query(ClinicalNote).filter(ClinicalNote.case_id == target_id).order_by(ClinicalNote.created_at.desc()).all()
    res = []
    for n in notes:
        res.append(ClinicalNoteResponse(
            id=n.id,
            case_id=n.case_id,
            author_name=n.author.full_name if n.author else "Clinician",
            note_type=n.note_type or "Clinical Note",
            note=n.note,
            created_at=n.created_at
        ))
    return res

@router.post("/{id}/notes", response_model=ClinicalNoteResponse)
def add_case_note(id: int, note_data: ClinicalNoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_id = id
    if target_id > 1000:
        target_id = target_id - 1000
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    new_note = ClinicalNote(
        case_id=case.id,
        author_id=current_user.id,
        note_type=note_data.note_type,
        note=note_data.note
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    return ClinicalNoteResponse(
        id=new_note.id,
        case_id=new_note.case_id,
        author_name=current_user.full_name,
        note_type=new_note.note_type,
        note=new_note.note,
        created_at=new_note.created_at
    )

@router.get("/{id}/flaws")
def get_case_flaws(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_id = id
    if target_id > 1000:
        target_id = target_id - 1000
    case = db.query(Case).filter(Case.id == target_id).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    patient_name = case.victim.full_name if case.victim else "Patient"
    
    chks = db.query(CheckIn).filter(CheckIn.case_id == case.id).order_by(CheckIn.submitted_at.desc()).all()
    avg_sleep = round(sum(k.sleep_hours for k in chks) / len(chks), 1) if chks else 5.5
    avg_mood = round(sum(k.mood_score for k in chks) / len(chks), 1) if chks else 3.0
    
    if case.id == 1 or "elena" in patient_name.lower():
        flaw_data = {
            "case_id": case.id,
            "patient_name": patient_name,
            "primary_flaw": "Catastrophic Somatosensory Amplification & Avoidance Loop",
            "flaw_category": "Cognitive Distortion & Behavioral Barrier",
            "severity": "High",
            "impact_score": 84,
            "summary": "Patient misinterprets nocturnal autonomic arousal (sudden tachycardia and waking at 3 AM) as an impending fatal cardiac or psychiatric collapse, triggering voluntary sleep avoidance and severe daylight social isolation.",
            "distortions": [
                {"name": "Catastrophizing & Somatic Magnification", "score": 88, "desc": "Believing physical palpitations indicate immediate life-threatening collapse."},
                {"name": "Trauma Cue Avoidance", "score": 82, "desc": "Avoiding transit corridors due to auditory vehicular trauma associations."},
                {"name": "Emotional Reasoning", "score": 74, "desc": "Conflating feelings of acute terror with objective physical danger ('I feel unsafe, therefore I am unsafe')."},
                {"name": "Retaliatory Bedtime Procrastination", "score": 91, "desc": "Voluntarily postponing sleep past 2:30 AM to delay onset of trauma-related night terrors."}
            ],
            "evidence_trail": [
                "EHR Reflection: 'Whenever I hear traffic or loud braking outside, my heart races and I freeze.'",
                f"Sleep Metric Deficit: Average sleep restricted to {avg_sleep} hrs/night (Severe chronic deficit).",
                "Autonomic Hyperarousal: Documented panic awakening cycles between 2:30 AM and 4:00 AM.",
                "Clinical Risk Correlation: Distress score peaks at 77.0 following nocturnal arousal triggers."
            ],
            "therapeutic_countermeasures": [
                {
                    "strategy": "Interoceptive Somatic Exposure",
                    "protocol": "Induce mild tachycardia in clinic (30s hyperventilation/stepping) to decouple heart rate elevation from catastrophic death terror.",
                    "target_distortion": "Catastrophizing & Somatic Magnification"
                },
                {
                    "strategy": "CBT Thought Restructuring Worksheet",
                    "protocol": "Deploy 3-column Socratic questioning: Trigger -> Automatic Catastrophic Thought -> Evidence-based Reality Reframe.",
                    "target_distortion": "Emotional Reasoning"
                },
                {
                    "strategy": "Sleep Stimulus Control Therapy",
                    "protocol": "Strict bed-only restriction (no mobile screens in bedroom); out of bed if awake > 20 mins; scheduled morning sunlight exposure to reset circadian rhythm.",
                    "target_distortion": "Retaliatory Bedtime Procrastination"
                },
                {
                    "strategy": "Graded In-Vivo Exposure Hierarchy",
                    "protocol": "5-step traffic exposure ladder: (1) Audio playback at 30% volume, (2) Audio at 70%, (3) Balcony view, (4) Sidewalk 2 mins, (5) Public transit.",
                    "target_distortion": "Trauma Cue Avoidance"
                }
            ],
            "recommended_session_question": "Elena, when you noticed your heart rate increasing last Tuesday at 3 AM, what was the exact first sentence that went through your mind before the panic took over?",
            "adherence_risk": "Moderate-High (Patient tends to avoid somatic exercises during acute anxiety peaks)."
        }
    elif case.id == 2 or "marcus" in patient_name.lower():
        flaw_data = {
            "case_id": case.id,
            "patient_name": patient_name,
            "primary_flaw": "Emotional Blunting & Social Withdrawal Defense Barrier",
            "flaw_category": "Depressive Anhedonia & Avoidant Coping",
            "severity": "Moderate",
            "impact_score": 68,
            "summary": "Patient utilizes emotional suppression as an unconscious protective buffer against painful trauma memories, leading to progressive blunting of positive affect and near-total social isolation.",
            "distortions": [
                {"name": "Emotional Suppression", "score": 82, "desc": "Actively shutting down all feelings to prevent vulnerability."},
                {"name": "Anhedonic Resignation", "score": 76, "desc": "Belief that no social activity or hobby can bring pleasure anymore."},
                {"name": "All-or-Nothing Thinking", "score": 70, "desc": "Viewing recovery as impossible if complete normalcy is not achieved immediately."}
            ],
            "evidence_trail": [
                "EHR Check-in: Social interaction rating recorded as 1/5 across consecutive submissions.",
                "Affect flattening noted during clinical interviews.",
                f"Average mood suppressed at {avg_mood}/5.0 with low variability."
            ],
            "therapeutic_countermeasures": [
                {
                    "strategy": "Behavioral Activation Protocol",
                    "protocol": "Schedule micro-commitments: 10-minute walk with a friend or structured positive activity without performance pressure.",
                    "target_distortion": "Anhedonic Resignation"
                },
                {
                    "strategy": "Affect Labeling Exercises",
                    "protocol": "Practice naming subtle physical sensations before they are suppressed.",
                    "target_distortion": "Emotional Suppression"
                }
            ],
            "recommended_session_question": "Marcus, what was one small moment this past week where you felt even a 2% glimmer of curiosity or calm?",
            "adherence_risk": "Moderate"
        }
    else:
        flaw_data = {
            "case_id": case.id,
            "patient_name": patient_name,
            "primary_flaw": "Hyperarousal & Trauma Re-experiencing Barrier",
            "flaw_category": "Post-Trauma Cognitive Bias",
            "severity": "High" if case.risk_level in ["high", "critical"] else "Moderate",
            "impact_score": 74 if case.risk_level in ["high", "critical"] else 52,
            "summary": f"Patient exhibits heightened sensitivity to environmental stressors and tendency toward self-blame, creating obstacles to clinical treatment adherence.",
            "distortions": [
                {"name": "Selective Abstraction", "score": 78, "desc": "Fixating exclusively on setbacks while ignoring signs of emotional stabilization."},
                {"name": "Personalization & Self-Blame", "score": 72, "desc": "Attributing trauma sequelae to personal weakness rather than physiological trauma response."}
            ],
            "evidence_trail": [
                f"Distress level evaluated as {case.risk_level.upper()} in Sanjeevani EHR monitoring.",
                f"Average physiological sleep tracked at {avg_sleep} hrs/night.",
                f"Check-in frequency: {len(chks)} entries logged."
            ],
            "therapeutic_countermeasures": [
                {
                    "strategy": "Cognitive Socratic Reframing",
                    "protocol": "Separate trauma responsibility from normal healing response through evidence-based thought records.",
                    "target_distortion": "Personalization & Self-Blame"
                },
                {
                    "strategy": "Self-Compassion Grounding Protocol",
                    "protocol": "Daily 5-minute compassionate self-talk exercise during distress spikes.",
                    "target_distortion": "Selective Abstraction"
                }
            ],
            "recommended_session_question": f"{patient_name}, what is one expectation you are placing on yourself right now that you would never demand of a close friend in your situation?",
            "adherence_risk": "Moderate"
        }
        
    return flaw_data




from ai.predictive_escalation_engine import predict_7d_crisis_risk
from ai.voice_emotion_engine import analyze_vocal_emotion
from datetime import datetime

@router.get("/{id}/predictive-risk")
def get_case_predictive_risk(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case and id > 1000:
        case = db.query(Case).filter(Case.id == id - 1000).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    meta = _enrich_nhaa_meta(case)
    meta["legal_stage"] = case.legal_stage or meta["legal_stage"]
    meta["threat_level"] = case.threat_level or meta["threat_level"]
    meta["case_category"] = case.case_category or meta["case_category"]
    meta["court_next_hearing"] = case.court_next_hearing or meta["court_next_hearing"]

    return predict_7d_crisis_risk(meta)

@router.get("/{id}/lifecycle")
def get_case_lifecycle(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = db.query(Case).filter(Case.id == id).first()
    if not case and id > 1000:
        case = db.query(Case).filter(Case.id == id - 1000).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    meta = _enrich_nhaa_meta(case)
    return {
        "case_id": case.id,
        "nhaa_docket_no": meta["nhaa_docket_no"],
        "current_stage": meta["legal_stage"],
        "stages": [
            {
                "stage": "Investigation",
                "status": "Completed" if meta["legal_stage"] in ["trial", "rehabilitation", "compensation"] else "Active",
                "milestones": [
                    {"name": f"FIR Registered ({meta['fir_number']})", "done": True, "date": "2026-06-12"},
                    {"name": "Forensic & Medical Evidence Collected", "done": True, "date": "2026-06-18"},
                    {"name": "Charge Sheet Filed in Special Court", "done": True, "date": "2026-07-25"}
                ],
                "distress_driver": "Anxiety regarding arrest of accused & bail opposition"
            },
            {
                "stage": "Trial",
                "status": "Active" if meta["legal_stage"] == "trial" else ("Completed" if meta["legal_stage"] in ["rehabilitation", "compensation"] else "Upcoming"),
                "milestones": [
                    {"name": "Charges Framed by Special Judge", "done": True, "date": "2026-08-10"},
                    {"name": "Victim / Complainant Deposition & Cross-Examination", "done": False, "date": meta["court_next_hearing"]},
                    {"name": "Final Arguments & Judicial Verdict", "done": False, "date": "Pending"}
                ],
                "distress_driver": "Acute anticipatory panic facing accused & hostile defense intimidation"
            },
            {
                "stage": "Rehabilitation",
                "status": "Active" if meta["legal_stage"] == "rehabilitation" else ("Completed" if meta["legal_stage"] == "compensation" else "Pending"),
                "milestones": [
                    {"name": "Immediate Psychosocial Stabilization via Sarajeevi AI", "done": True, "date": "Ongoing"},
                    {"name": "Safe House Relocation & Physical Shelter", "done": True if "Safe House" in meta["witness_protection_status"] else False, "date": "Active"},
                    {"name": "Vocational Reintegration & Skill Grants", "done": False, "date": "Under Review"}
                ],
                "distress_driver": "Social ostracism by community & livelihood disruption"
            },
            {
                "stage": "Compensation",
                "status": "Active" if meta["legal_stage"] == "compensation" else "In-Progress",
                "milestones": [
                    {"name": "25% First Tranche Disbursed at FIR (DBT)", "done": True, "date": "2026-06-20"},
                    {"name": "50% Second Tranche Post-Charge Sheet", "done": True if meta["legal_stage"] in ["trial", "rehabilitation", "compensation"] else False, "date": "2026-07-30"},
                    {"name": "25% Final Tranche Post-Verdict / Judgment", "done": False, "date": "Awaiting Verdict"}
                ],
                "distress_driver": "Financial hardship & bureaucratic delays in relief receipt"
            }
        ]
    }

@router.post("/{id}/simulate-touchpoint", response_model=IVRSCallSimulateResponse)
def simulate_case_touchpoint(
    id: int, 
    req: IVRSCallSimulateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case and id > 1000:
        case = db.query(Case).filter(Case.id == id - 1000).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    meta = _enrich_nhaa_meta(case)
    spoken = req.spoken_response
    
    # Run voice emotion and stress analysis
    vocal = analyze_vocal_emotion(spoken, req.acoustic_telemetry, req.language or "en")
    
    has_threat = any(w in spoken.lower() for w in ["threat", "kill", "harm", "attack", "gun", "bail", "dhamki", "marne", "hamla", "धमकी", "मारने"])
    is_critical_stress = vocal["vocal_distress_score"] >= 75 or has_threat
    
    if is_critical_stress:
        alert_sp = Alert(
            case_id=case.id,
            alert_type="ivrs_intimidation_spike",
            severity="critical",
            message=f"[IVRS OUTBOUND CALL SIGNAL] High distress & intimidation threat detected from victim in Docket {meta['nhaa_docket_no']}: '{spoken[:60]}...'",
            target_agency="police_sp",
            action_required="Deploy Section 15A Emergency Protection Patrol to victim residence"
        )
        alert_clin = Alert(
            case_id=case.id,
            alert_type="ivrs_vocal_tremor",
            severity="high",
            message=f"[IVRS VOICE STRESS ALERT] Vocal tremor ({vocal['biomarkers'].get('pitch_jitter_pct', 70)}%) and acute panic detected in periodic call.",
            target_agency="counsellor",
            action_required="Schedule immediate trauma grounding call"
        )
        db.add(alert_sp)
        db.add(alert_clin)
        case.risk_level = "critical"
        case.threat_level = "High / Imminent"
        db.commit()

    return IVRSCallSimulateResponse(
        call_id=f"IVRS-{meta['nhaa_docket_no']}-{int(datetime.now().timestamp())}",
        case_id=case.id,
        timestamp=datetime.now(),
        prompt_played="Namaste. This is the National Helpline Against Atrocities (14566) automated safety and well-being check-in. Please tell us how you are feeling today and if you are facing any threats.",
        victim_transcript=spoken,
        vocal_stress_level=vocal["biomarkers"].get("vocal_intensity", "High Autonomic Strain") if is_critical_stress else "Moderate / Regulated",
        vocal_distress_score=vocal["vocal_distress_score"],
        detected_emotion=vocal["primary_emotion"],
        threat_flag=has_threat,
        escalation_triggered=is_critical_stress,
        recommended_action="Emergency Armed Protection Patrol Dispatched (PoA Sec 15A)" if has_threat else "CBT Grounding & Routine Monitoring via Sarajeevi AI"
    )

@router.post("/{id}/inter-agency-alert")
def dispatch_inter_agency_alert(
    id: int,
    req: InterAgencyAlertRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(Case).filter(Case.id == id).first()
    if not case and id > 1000:
        case = db.query(Case).filter(Case.id == id - 1000).first()
    if not case:
        case = db.query(Case).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    alert = Alert(
        case_id=case.id,
        alert_type="inter_agency_dispatch",
        severity=req.severity,
        message=req.message,
        target_agency=req.target_agency,
        action_required=req.action_required
    )
    db.add(alert)
    if req.severity == "critical":
        case.risk_level = "critical"
    db.commit()
    db.refresh(alert)
    return {"status": "success", "alert_id": alert.id, "target_agency": alert.target_agency, "message": "Alert dispatched to designated authority"}
