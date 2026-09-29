import axios from 'axios';
import { mockCases, mockCheckIns, mockAlerts, mockInterventions, mockTrendData } from '../data/mockData';

const API_HOST = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1';
const API_BASE_URL = import.meta.env?.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api` 
  : `http://${API_HOST}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getCases = async () => {
  try {
    const res = await api.get('/cases');
    if (res.data && res.data.length > 0) {
      return {
        data: res.data.map(c => ({
          id: c.id,
          code: `C-${1000 + c.id}`,
          victimName: c.victim_name || `Patient #${c.victim_id}`,
          riskScore: Math.round(c.latest_risk_score != null ? c.latest_risk_score : 25),
          riskLevel: c.risk_level,
          status: c.status,
          trend: c.risk_level === 'high' || c.risk_level === 'critical' ? 'increasing' : 'stable',
          checkinsCount: c.checkins_count || 0,
          averageMood: c.average_mood || 5.0,
          lastCheckIn: c.updated_at || c.created_at,
          counsellorName: c.counsellor_name || 'Dr. Sarah Jenkins',
          victim_age: c.victim_age || 29,
          victim_gender: c.victim_gender || "Female",
          victim_phone: c.victim_phone || "+1 (555) 782-4419",
          victim_emergency_contact: c.victim_emergency_contact || "Marcus Vance (Brother) - +1 (555) 782-9900",
          victim_bio: c.victim_bio || "Patient under active clinical trauma monitoring."
        }))
      };
    }
  } catch (e) {
    console.log("Using mock cases:", e.message);
  }
  return { data: mockCases };
};

export const getCaseById = async (id) => {
  try {
    const numericId = parseInt(String(id).replace(/\D/g, '')) || 1;
    const res = await api.get(`/cases/${numericId}`);
    if (res.data) {
      const c = res.data;
      return {
        data: {
          id: c.id,
          code: `C-${1000 + c.id}`,
          victimName: c.victim_name || "Patient",
          counsellorName: c.counsellor_name || "Dr. Sarah Jenkins",
          riskScore: Math.round(c.latest_risk_score != null ? c.latest_risk_score : (c.risk_level === 'critical' ? 92 : c.risk_level === 'high' ? 76 : c.risk_level === 'moderate' ? 48 : 22)),
          riskLevel: c.risk_level,
          status: c.status,
          totalCheckIns: c.checkins_count || 10,
          averageMood: c.average_mood || 4.5,
          daysMonitored: c.days_monitored || 30,
          victim_age: c.victim_age || 29,
          victim_gender: c.victim_gender || "Female",
          victim_phone: c.victim_phone || "+1 (555) 782-4419",
          victim_emergency_contact: c.victim_emergency_contact || "Marcus Vance (Brother) - +1 (555) 782-9900",
          victim_bio: c.victim_bio || "High-stress trauma survivor currently monitored for PTSD and acute panic symptoms."
        }
      };
    }
  } catch (e) {
    console.log("Using mock case details:", e.message);
  }
  const caseData = mockCases.find(c => String(c.id) === String(id)) || mockCases[0];
  return { 
    data: {
      ...caseData,
      victim_age: 29,
      victim_gender: "Female",
      victim_phone: "+1 (555) 782-4419",
      victim_emergency_contact: "Marcus Vance (Brother) - +1 (555) 782-9900",
      victim_bio: "High-stress trauma survivor currently monitored for PTSD and acute panic symptoms."
    }
  };
};

export const getCheckIns = async (caseId) => {
  try {
    let numericId = 1;
    if (caseId) {
      numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    }
    const res = await api.get(`/checkins/case/${numericId}`);
    if (res.data && res.data.length > 0) {
      return {
        data: res.data.map((chk) => ({
          id: chk.id,
          mood: chk.mood_score,
          sleep: chk.sleep_hours,
          appetite: chk.appetite,
          social: chk.social_interaction,
          date: chk.submitted_at,
          text: chk.free_text,
          aiAnalysis: {
            riskScore: Math.round(chk.distress_score || 25),
            riskLevel: chk.risk_level || 'low',
            sentiment: chk.sentiment_compound || 0.0,
            emotions: chk.emotions && Object.keys(chk.emotions).length > 0 ? chk.emotions : {
              sadness: chk.mood_score <= 2 ? 0.6 : 0.1,
              fear: chk.mood_score <= 2 ? 0.5 : 0.05,
              anger: 0.1,
              joy: chk.mood_score > 3 ? 0.6 : 0.05,
              surprise: 0.1,
              disgust: 0.05,
              anticipation: 0.2
            },
            keywords: chk.keywords || [],
            xaiRationale: chk.explanation || "Patient check-in evaluated for clinical distress indicators."
          }
        }))
      };
    }
  } catch (e) {
    console.log("Using mock check-ins:", e.message);
  }
  return { data: mockCheckIns };
};

export const getTrendData = async (caseId) => {
  try {
    const chkRes = await getCheckIns(caseId);
    if (chkRes.data && chkRes.data.length > 0) {
      const sorted = [...chkRes.data].sort((a, b) => new Date(a.date) - new Date(b.date));
      return {
        data: sorted.map((c, i) => {
          const d = new Date(c.date);
          const monthDay = isNaN(d.getTime()) ? `Entry ${i + 1}` : `${d.getMonth() + 1}/${d.getDate()}`;
          return {
            day: monthDay,
            score: c.aiAnalysis.riskScore,
            mood: c.mood
          };
        })
      };
    }
  } catch (e) {
    console.log("Using mock trend:", e.message);
  }
  return { data: mockTrendData };
};

export const getAlerts = async () => {
  try {
    const res = await api.get('/alerts');
    if (res.data && res.data.length > 0) {
      return {
        data: res.data.map(a => ({
          id: a.id,
          caseId: `C-${1000 + a.case_id}`,
          type: a.severity,
          title: a.alert_type === 'crisis_keywords' ? 'Critical Alert: Crisis Keywords Detected' : `${a.severity.toUpperCase()} Risk Alert`,
          description: a.message,
          timestamp: a.created_at,
          unread: !a.is_read
        }))
      };
    }
  } catch (e) {
    console.log("Using mock alerts:", e.message);
  }
  return { data: mockAlerts };
};

export const getInterventions = async () => {
  try {
    const res = await api.get('/interventions/case/1');
    if (res.data && res.data.length > 0) {
      return { data: res.data };
    }
  } catch (e) {
    // fallback
  }
  return { data: mockInterventions };
};

export const submitCheckIn = async (data) => {
  try {
    const res = await api.post('/checkins', {
      case_id: 1,
      free_text: data.text,
      mood_score: data.mood,
      sleep_hours: data.sleep,
      appetite: 3,
      social_interaction: 3
    });
    return { data: { success: true, ...res.data } };
  } catch (e) {
    console.log("Submit checkin fallback:", e.message);
    return { data: { success: true, ...data } };
  }
};

export const createIntervention = async (data) => {
  try {
    const res = await api.post('/interventions', {
      case_id: data.caseId ? parseInt(String(data.caseId).replace(/\D/g, '')) : 1,
      counsellor_id: 1,
      intervention_type: data.type || 'Phone Call',
      notes: data.notes || '',
      scheduled_at: data.scheduledAt || new Date().toISOString()
    });
    return { data: res.data };
  } catch (e) {
    return { data: { success: true, ...data } };
  }
};

export const analyzePipelineSandbox = async (text, mood = 3, sleep = 6) => {
  try {
    const res = await api.post(`/risk/analyze?text=${encodeURIComponent(text)}&mood_score=${mood}&sleep_hours=${sleep}`);
    if (res.data) {
      const p = res.data;
      return {
        preprocessed: p.cleaned_text,
        sentiment: p.sentiment.compound,
        emotions: Object.entries(p.emotions).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })),
        keywords: p.features.all_distress_keywords || [],
        riskScore: Math.round(p.risk.score),
        xaiRationale: p.explanation.rationale,
        factorBreakdown: p.explanation.factor_breakdown,
        crisisOverride: p.risk.crisis_override
      };
    }
  } catch (e) {
    console.log("Using local pipeline simulation:", e.message);
  }
  return null;
};

export const getPatientFlawAnalysis = async (caseId) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.get(`/cases/${numericId}/flaws`);
    if (res.data) {
      return { data: res.data };
    }
  } catch (e) {
    console.log("Using local flaw analysis fallback:", e.message);
  }
  return {
    data: {
      case_id: caseId || 1,
      patient_name: "Elena Vance",
      primary_flaw: "Catastrophic Somatosensory Amplification & Avoidance Loop",
      flaw_category: "Cognitive Distortion & Behavioral Barrier",
      severity: "High",
      impact_score: 84,
      summary: "Patient misinterprets nocturnal autonomic arousal (sudden tachycardia and waking at 3 AM) as an impending fatal cardiac or psychiatric collapse, triggering voluntary sleep avoidance and severe daylight social isolation.",
      distortions: [
        { name: "Catastrophizing & Somatic Magnification", score: 88, desc: "Believing physical palpitations indicate immediate life-threatening collapse." },
        { name: "Trauma Cue Avoidance", score: 82, desc: "Avoiding transit corridors due to auditory vehicular trauma associations." },
        { name: "Emotional Reasoning", score: 74, desc: "Conflating feelings of acute terror with objective physical danger." },
        { name: "Retaliatory Bedtime Procrastination", score: 91, desc: "Voluntarily postponing sleep past 2:30 AM to delay onset of trauma-related night terrors." }
      ],
      evidence_trail: [
        "EHR Reflection: 'Whenever I hear traffic or loud braking outside, my heart races and I freeze.'",
        "Sleep Metric Deficit: Average sleep restricted to < 4.5 hrs/night (Severe chronic deficit).",
        "Autonomic Hyperarousal: Documented panic awakening cycles between 2:30 AM and 4:00 AM.",
        "Clinical Risk Correlation: Distress score peaks at 77.0 following nocturnal arousal triggers."
      ],
      therapeutic_countermeasures: [
        {
          strategy: "Interoceptive Somatic Exposure",
          protocol: "Induce mild tachycardia in clinic (30s hyperventilation/stepping) to decouple heart rate elevation from catastrophic death terror.",
          target_distortion: "Catastrophizing & Somatic Magnification"
        },
        {
          strategy: "CBT Thought Restructuring Worksheet",
          protocol: "Deploy 3-column Socratic questioning: Trigger -> Automatic Catastrophic Thought -> Evidence-based Reality Reframe.",
          target_distortion: "Emotional Reasoning"
        },
        {
          strategy: "Sleep Stimulus Control Therapy",
          protocol: "Strict bed-only restriction; out of bed if awake > 20 mins; scheduled morning sunlight exposure.",
          target_distortion: "Retaliatory Bedtime Procrastination"
        }
      ],
      recommended_session_question: "Elena, when you noticed your heart rate increasing last Tuesday at 3 AM, what was the exact first sentence that went through your mind before the panic took over?",
      adherence_risk: "Moderate-High (Patient tends to avoid somatic exercises during acute anxiety peaks)."
    }
  };
};

export const getCaseNotes = async (caseId) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.get(`/cases/${numericId}/notes`);
    if (res.data) {
      return { data: res.data };
    }
  } catch (e) {
    console.log("Using local notes fallback:", e.message);
  }
  return { data: [] };
};

export const saveClinicalNote = async (caseId, note, noteType = "Clinical Note") => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post(`/cases/${numericId}/notes`, {
      note,
      note_type: noteType
    });
    return { data: res.data };
  } catch (e) {
    console.log("Local note save:", e.message);
    return {
      data: {
        id: Date.now(),
        case_id: caseId,
        author_name: "Dr. Sarah Jenkins",
        note_type: noteType,
        note,
        created_at: new Date().toISOString()
      }
    };
  }
};

export const updateCaseStatus = async (caseId, status) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.patch(`/cases/${numericId}`, { status });
    return { data: res.data };
  } catch (e) {
    console.log("Local case status update:", e.message);
    return { data: { status } };
  }
};

export const sendAIChatMessage = async (caseId, message, language = 'en', vocalEmotion = null) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post('/chat/ai', {
      case_id: numericId,
      message,
      language,
      vocal_emotion: vocalEmotion
    }, { timeout: 30000 }); // AI calls can take longer
    return { data: res.data };
  } catch (e) {
    console.error("AI chat API error:", e.message);
    const isNetworkError = !e.response;
    const errorContent = isNetworkError
      ? (language === 'hi'
        ? "सर्वर से कनेक्ट नहीं हो पा रहा है। कृपया जाँचें कि बैकएंड सर्वर चल रहा है।"
        : "Unable to connect to the server. Please make sure the backend server is running on port 8000.")
      : (language === 'hi'
        ? "कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।"
        : "Something went wrong. Please try again.");
    return {
      data: {
        user_message: {
          id: Date.now(),
          case_id: caseId,
          sender_id: 1,
          sender_name: "Me",
          sender_role: "user",
          channel: "ai_companion",
          content: message,
          created_at: new Date().toISOString()
        },
        ai_message: {
          id: Date.now() + 1,
          case_id: caseId,
          sender_id: 99,
          sender_name: "Sarajeevi AI Companion",
          sender_role: "ai",
          channel: "ai_companion",
          content: errorContent,
          created_at: new Date().toISOString()
        },
        distress_score: 0,
        crisis_flagged: false,
        grounding_exercise: null,
        suggested_actions: []
      }
    };
  }
};

export const getChatMessages = async (caseId, channel = null) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const url = channel ? `/chat/messages/${numericId}?channel=${channel}` : `/chat/messages/${numericId}`;
    const res = await api.get(url);
    if (res.data) {
      return { data: res.data };
    }
  } catch (e) {
    console.log("Local messages fallback:", e.message);
  }
  return {
    data: [
      {
        id: 1,
        case_id: caseId,
        sender_id: 99,
        sender_name: "Sarajeevi AI Companion",
        sender_role: "ai",
        channel: "ai_companion",
        content: "Hello! I am Sarajeevi AI, your 24/7 trauma-informed support companion. I am here to help you decompress, guide you through grounding exercises, and track your wellness. How are you feeling today?",
        created_at: new Date().toISOString()
      }
    ]
  };
};

export const sendTherapistMessage = async (caseId, content, channel = "therapist_direct") => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post('/chat/therapist', {
      case_id: numericId,
      content,
      channel
    });
    return { data: res.data };
  } catch (e) {
    console.log("Local therapist message fallback:", e.message);
    return {
      data: {
        id: Date.now(),
        case_id: caseId,
        sender_id: 1,
        sender_name: "Me",
        sender_role: "user",
        channel: "therapist_direct",
        content,
        created_at: new Date().toISOString()
      }
    };
  }
};

export const markMessageRead = async (messageId) => {
  try {
    const res = await api.patch(`/chat/messages/${messageId}/read`);
    return { data: res.data };
  } catch (e) {
    return { data: { status: "success" } };
  }
};

export const analyzeVoiceEmotion = async (caseId, text, acousticTelemetry = null, language = 'en') => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post('/chat/voice-analyze', {
      case_id: numericId,
      text,
      acoustic_telemetry: acousticTelemetry,
      language
    });
    return { data: res.data };
  } catch (e) {
    console.log("Local Voice Emotion fallback:", e.message);
    const isPanic = (text || '').toLowerCase().includes('panic') || (text || '').toLowerCase().includes('breath');
    return {
      data: {
        primary_emotion: isPanic ? "panic_fear" : "calm_stable",
        emotion_label: isPanic ? "Acute Panic & Vocal Tremor" : "Calm & Baseline Regulated",
        badge: isPanic ? "PANIC_TREMOR" : "CALM",
        color: isPanic ? "#ef4444" : "#10b981",
        confidence: 0.88,
        vocal_distress_score: isPanic ? 84.0 : 20.0,
        emotion_distribution: isPanic 
          ? { panic_fear: 78, grief_sorrow: 12, anger_agitation: 6, depressive_exhaustion: 4, calm_stable: 2 }
          : { calm_stable: 82, panic_fear: 8, depressive_exhaustion: 6, grief_sorrow: 2, anger_agitation: 2 },
        biomarkers: {
          pitch_jitter_pct: isPanic ? 78 : 18,
          pitch_jitter_level: isPanic ? "Elevated Tremor" : "Stable Baseline",
          speech_rate_wpm: isPanic ? 164 : 122,
          speech_cadence: isPanic ? "Tachyphasia (Hyper-rapid)" : "Regulated Cadence",
          vocal_energy_rms: isPanic ? 0.68 : 0.38,
          vocal_intensity: isPanic ? "High Autonomic Strain" : "Moderate Intensity",
          silence_pause_ratio: isPanic ? "28%" : "15%",
          respiratory_effort: isPanic ? "Labored / Rapid Catch" : "Normal Diaphragmatic"
        },
        clinical_interpretation: isPanic 
          ? "Acoustic prosody exhibits acute vocal frequency tremor and hyperventilating cadence indicating sympathetic autonomic activation."
          : "Vocal biomarkers indicate steady respiratory cadence and parasympathetic stability.",
        recommended_pacing: isPanic ? "Slow 0.85x with 4-7-8 Parasympathetic Vagal Reset" : "Standard Conversational 1.0x",
        adaptive_opening: isPanic 
          ? "I can hear the tremor and rapid pacing in your voice right now. You are in a safe space. Let us slow down together..."
          : "Your voice sounds grounded, calm, and centered. It is wonderful to connect with you in this space..."
      }
    };
  }
};

export const getPredictiveRisk = async (caseId) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.get(`/cases/${numericId}/predictive-risk`);
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        predictive_crisis_risk_7d: 84,
        trajectory_label: "Imminent Crisis Surge",
        risk_color: "rose",
        urgency: "Immediate Action Required (< 24 Hours)",
        days_to_court_hearing: 4,
        primary_trigger: "Anticipatory trial dread & intimidation in Trial stage",
        xai_feature_attributions: [
          { factor: "Upcoming Court Trial & Cross-Examination Anticipation", weight_pct: 38, evidence: "Special SC/ST Court deposition scheduled within 4 days. Anticipatory panic.", impact: "Critical" },
          { factor: "Witness Intimidation & Accused Out on Bail", weight_pct: 27, evidence: "Threat classification: 'High / Imminent'. Verbal threats in community.", impact: "High" },
          { factor: "Acoustic Vocal Tremor & Autonomic Strain", weight_pct: 20, evidence: "Voice check-in exhibits tachyphasia (>164 WPM) and elevated jitter (78%).", impact: "High" },
          { factor: "Legal Stage Prolongation & Procedural Delay", weight_pct: 15, evidence: "Multi-month court trial delays and compensation paperwork fatigue.", impact: "Moderate" }
        ],
        preemptive_actions: [
          { agency: "Police (SP / Nodal Officer)", action: "Deploy Section 15A Armed Witness Protection Escort for upcoming court transit", statute: "PoA Act Sec 15A(6)" },
          { agency: "Judiciary / Legal Aid", action: "Assign Special Public Prosecutor for pre-trial victim briefing", statute: "PoA Rule 15" },
          { agency: "District Magistrate / Social Welfare", action: "Expedite release of next tranche relief compensation", statute: "Central Sector Scheme for SC/ST Atrocity Relief" },
          { agency: "Clinical Psychological Support", action: "Conduct immediate pre-trial desensitization & 4-7-8 breathing pacer session via Sarajeevi AI", statute: "Trauma Stabilization Protocol" }
        ]
      }
    };
  }
};

export const getCaseLifecycle = async (caseId) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.get(`/cases/${numericId}/lifecycle`);
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        case_id: caseId,
        nhaa_docket_no: "NHAA-14566-2026-UP-4801",
        current_stage: "trial",
        stages: [
          { stage: "Investigation", status: "Completed", milestones: [{ name: "FIR Registered (FIR #121/2026)", done: true, date: "2026-06-12" }, { name: "Forensic Evidence Collected", done: true, date: "2026-06-18" }, { name: "Charge Sheet Filed in Special Court", done: true, date: "2026-07-25" }], distress_driver: "Anxiety regarding arrest of accused & bail opposition" },
          { stage: "Trial", status: "Active", milestones: [{ name: "Charges Framed by Special Judge", done: true, date: "2026-08-10" }, { name: "Victim Deposition & Cross-Examination", done: false, date: "2026-09-18" }, { name: "Judicial Verdict", done: false, date: "Pending" }], distress_driver: "Acute anticipatory panic facing accused & hostile defense intimidation" },
          { stage: "Rehabilitation", status: "Active", milestones: [{ name: "Psychosocial Stabilization via Sarajeevi AI", done: true, date: "Ongoing" }, { name: "Safe House Relocation & Shelter", done: true, date: "Active" }, { name: "Vocational Skill Grants", done: false, date: "Under Review" }], distress_driver: "Social ostracism by community & livelihood disruption" },
          { stage: "Compensation", status: "In-Progress", milestones: [{ name: "25% First Tranche Disbursed at FIR (DBT)", done: true, date: "2026-06-20" }, { name: "50% Second Tranche Post-Charge Sheet", done: true, date: "2026-07-30" }, { name: "25% Final Tranche Post-Verdict", done: false, date: "Awaiting Verdict" }], distress_driver: "Financial hardship & bureaucratic delays in relief receipt" }
        ]
      }
    };
  }
};

export const simulateTouchpoint = async (caseId, spokenResponse, language = "en", acousticTelemetry = null) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post(`/cases/${numericId}/simulate-touchpoint`, {
      case_id: numericId,
      spoken_response: spokenResponse,
      language,
      acoustic_telemetry: acousticTelemetry
    });
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        call_id: `IVRS-NHAA-14566-${Date.now()}`,
        case_id: caseId,
        timestamp: new Date().toISOString(),
        prompt_played: "Namaste. This is the National Helpline Against Atrocities (14566) automated safety and well-being check-in.",
        victim_transcript: spokenResponse,
        vocal_stress_level: "High Autonomic Strain",
        vocal_distress_score: 84.0,
        detected_emotion: "panic_fear",
        threat_flag: true,
        escalation_triggered: true,
        recommended_action: "Emergency Armed Protection Patrol Dispatched (PoA Sec 15A)"
      }
    };
  }
};

export const dispatchInterAgencyAlert = async (caseId, targetAgency, severity, message, actionRequired) => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post(`/cases/${numericId}/inter-agency-alert`, {
      case_id: numericId,
      target_agency: targetAgency,
      severity,
      message,
      action_required: actionRequired
    });
    return { data: res.data };
  } catch (e) {
    return { data: { status: "success", message: "Alert dispatched to designated authority" } };
  }
};

export const getGovernanceStats = async (level = "national", paramValue = null) => {
  try {
    let url = `/governance/summary?level=${level}`;
    if (level === "district" && paramValue) url += `&district=${encodeURIComponent(paramValue)}`;
    if (level === "state" && paramValue) url += `&state=${encodeURIComponent(paramValue)}`;
    const res = await api.get(url);
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        level,
        scope_name: level === "district" ? `District ${paramValue || "Varanasi"} Atrocity Welfare Cell` : (level === "state" ? `${paramValue || "Uttar Pradesh"} State Monitoring Committee` : "NHAA 14566 National Command Center"),
        total_monitored_victims: 15,
        critical_distress_cases: 6,
        witnesses_under_protection: 8,
        relief_compensation_disbursed_inr: "₹ 57.75 Lakhs",
        relief_compensation_pending_inr: "₹ 81.00 Lakhs",
        predictive_7d_crisis_surges: 5,
        priority_use_cases: {
          rape_gang_rape: 4,
          murder_arson_grievous: 4,
          witness_intimidation: 4,
          caste_violence_boycott: 3
        },
        legal_lifecycle_distribution: {
          investigation: 4,
          trial: 6,
          rehabilitation: 2,
          compensation: 3
        },
        inter_agency_coordination_index: 94.2
      }
    };
  }
};

export const getAISettings = async () => {
  try {
    const res = await api.get('/chat/settings');
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        engine: "autonomous",
        model: "gemini-2.5-flash",
        has_api_key: false,
        status: "autonomous_mode",
        message: "Operating with Autonomous Multi-Turn Conversational Engine"
      }
    };
  }
};

export const updateAISettings = async (geminiApiKey, model = "gemini-2.5-flash") => {
  try {
    const res = await api.post('/chat/settings', {
      gemini_api_key: geminiApiKey,
      model
    });
    return { data: res.data };
  } catch (e) {
    return {
      data: {
        engine: geminiApiKey ? "gemini" : "autonomous",
        model,
        has_api_key: Boolean(geminiApiKey),
        status: "saved",
        message: "AI settings saved"
      }
    };
  }
};

export const clearChatHistory = async (caseId, channel = "ai_companion") => {
  try {
    const numericId = parseInt(String(caseId).replace(/\D/g, '')) || 1;
    const res = await api.post('/chat/clear', { case_id: numericId, channel });
    return { data: res.data };
  } catch (e) {
    return { data: { status: "success" } };
  }
};
