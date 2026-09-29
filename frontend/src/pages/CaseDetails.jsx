import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getCaseById, getCheckIns, getTrendData, getCaseNotes, saveClinicalNote, updateCaseStatus,
  getChatMessages, sendTherapistMessage, getPatientFlawAnalysis,
  getPredictiveRisk, getCaseLifecycle, simulateTouchpoint, dispatchInterAgencyAlert
} from '../services/api';
import { Card, Button, Badge, Textarea } from '../components/ui/components';
import ProfileModal from '../components/profile/ProfileModal';
import AmbientScribeWidget from '../components/ehr/AmbientScribeWidget';
import EhrExportModal from '../components/ehr/EhrExportModal';
import PatientFlawAnalyzerModal from '../components/ehr/PatientFlawAnalyzerModal';
import { getRiskLevel, getRiskColor, getRiskBgColor } from '../utils/riskColors';
import { formatDate, formatTime } from '../utils/dateUtils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  ChevronLeft, ChevronDown, ChevronUp, AlertTriangle, FileText, Bot, Activity, Plus,
  Sparkles, Brain, Clock, Calendar, CheckCircle2, User, Phone, ShieldAlert, 
  ArrowUpRight, ArrowDownRight, Search, Filter, Printer, RefreshCw, Send, Check, MessageSquare,
  Shield, Scale, Building2, PhoneCall, Radio, Eye, EyeOff, Gavel, AlertOctagon, SendHorizontal
} from 'lucide-react';

const EMOTION_COLORS = {
  sadness: '#3b82f6',
  fear: '#8b5cf6',
  anger: '#ef4444',
  joy: '#10b981',
  surprise: '#f59e0b',
  disgust: '#14b8a6',
  anticipation: '#f97316',
  neutral: '#94a3b8'
};

const CaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [checkIns, setCheckIns] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('Clinical Note');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedToast, setNoteSavedToast] = useState(false);
  const [expandedCheckIn, setExpandedCheckIn] = useState(null);
  const [searchHistory, setSearchHistory] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [caseStatus, setCaseStatus] = useState('active');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [patientMessages, setPatientMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFlawModalOpen, setIsFlawModalOpen] = useState(false);
  const [flawSummary, setFlawSummary] = useState(null);

  // NHAA 14566 National Framework State
  const [isPrivacyShieldActive, setIsPrivacyShieldActive] = useState(true);
  const [activeNhaaTab, setActiveNhaaTab] = useState('lifecycle');
  const [predictiveData, setPredictiveData] = useState(null);
  const [lifecycleData, setLifecycleData] = useState(null);
  const [simulatedVoiceText, setSimulatedVoiceText] = useState(
    "The accused relatives came to my house yesterday and threatened me if I depose in court next Tuesday."
  );
  const [simulatingTouchpoint, setSimulatingTouchpoint] = useState(false);
  const [touchpointResult, setTouchpointResult] = useState(null);
  const [selectedAgency, setSelectedAgency] = useState('police_sp');
  const [alertSeverity, setAlertSeverity] = useState('critical');
  const [alertNotes, setAlertNotes] = useState('');
  const [dispatchingAlert, setDispatchingAlert] = useState(false);
  const [alertSuccessMsg, setAlertSuccessMsg] = useState('');

  const loadAllData = () => {
    getCaseById(id).then(res => {
      if (res?.data) {
        setCaseData(res.data);
        setCaseStatus(res.data.status || 'active');
      }
    });
    getPatientFlawAnalysis(id).then(res => {
      if (res?.data) setFlawSummary(res.data);
    });
    getPredictiveRisk(id).then(res => {
      if (res?.data) setPredictiveData(res.data);
    });
    getCaseLifecycle(id).then(res => {
      if (res?.data) setLifecycleData(res.data);
    });
    getCheckIns(id).then(res => {
      if (res?.data) {
        setCheckIns(res.data);
        if (res.data.length > 0) {
          setExpandedCheckIn(res.data[0].id);
        }
      }
    });
    getTrendData(id).then(res => {
      if (res?.data) setTrendData(res.data);
    });
    getCaseNotes(id).then(res => {
      if (res?.data) setClinicalNotes(res.data);
    });
    getChatMessages(id, 'therapist_direct').then(res => {
      if (res?.data) setPatientMessages(res.data);
    });
  };

  useEffect(() => {
    loadAllData();
  }, [id]);

  const maskName = (name) => {
    if (!isPrivacyShieldActive || !name) return name;
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0] + '***';
    return parts[0][0] + '*** ' + parts[parts.length - 1][0] + '*** (Protected)';
  };

  const handleSimulateTouchpoint = async () => {
    if (!simulatedVoiceText.trim()) return;
    setSimulatingTouchpoint(true);
    const res = await simulateTouchpoint(id, simulatedVoiceText, 'en');
    if (res?.data) {
      setTouchpointResult(res.data);
    }
    setSimulatingTouchpoint(false);
  };

  const handleDispatchAlert = async () => {
    setDispatchingAlert(true);
    const notes = alertNotes.trim() || `Urgent Section 15A protection & distress mitigation required for Case #${id}`;
    const res = await dispatchInterAgencyAlert(id, selectedAgency, alertSeverity, notes, "Immediate Inter-Agency Action Mandated");
    if (res?.data) {
      setAlertSuccessMsg(`Alert dispatched successfully to ${selectedAgency.toUpperCase().replace('_', ' ')}!`);
      setAlertNotes('');
      setTimeout(() => setAlertSuccessMsg(''), 4000);
    }
    setDispatchingAlert(false);
  };

  const handleSendTherapistReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    const res = await sendTherapistMessage(id, replyText, 'therapist_direct');
    if (res?.data) {
      setPatientMessages(prev => [...prev, res.data]);
      setReplyText('');
    }
    setSendingReply(false);
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    setCaseStatus(newStatus);
    await updateCaseStatus(id, newStatus);
    setUpdatingStatus(false);
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const res = await saveClinicalNote(id, newNote, noteType);
    if (res?.data) {
      setClinicalNotes(prev => [res.data, ...prev]);
      setNewNote('');
      setNoteSavedToast(true);
      setTimeout(() => setNoteSavedToast(false), 3000);
    }
    setSavingNote(false);
  };

  const insertTemplate = (templateText, type = 'Clinical Note') => {
    setNoteType(type);
    setNewNote(templateText);
  };

  if (!caseData) return (
    <div className="p-16 text-center space-y-4">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <div className="text-slate-500 font-medium">Loading NHAA 14566 Atrocity Case Dossier #{id}...</div>
    </div>
  );

  const riskLevel = getRiskLevel(caseData.riskScore);
  const badgeVariant = riskLevel === 'Critical' ? 'red' : riskLevel === 'High' ? 'orange' : riskLevel === 'Moderate' ? 'amber' : 'emerald';

  const totalEntries = checkIns.length;
  const highDistressEntries = checkIns.filter(c => c.aiAnalysis?.riskScore >= 60).length;
  const avgSleep = checkIns.length > 0
    ? (checkIns.reduce((acc, c) => acc + (parseFloat(c.sleep) || 6.5), 0) / checkIns.length).toFixed(1)
    : '6.5';
  
  const allKeywords = Array.from(new Set(
    checkIns.flatMap(c => c.aiAnalysis?.keywords || []).filter(Boolean)
  )).slice(0, 8);

  const filteredCheckIns = checkIns.filter(chk => {
    const textMatch = (chk.text || '').toLowerCase().includes(searchHistory.toLowerCase()) ||
      (chk.aiAnalysis?.xaiRationale || '').toLowerCase().includes(searchHistory.toLowerCase()) ||
      (chk.aiAnalysis?.keywords || []).some(k => k.toLowerCase().includes(searchHistory.toLowerCase()));

    if (!textMatch) return false;

    if (historyFilter === 'high') {
      return (chk.aiAnalysis?.riskScore || 0) >= 60;
    }
    if (historyFilter === 'journal') {
      return chk.text && chk.text.trim().length > 0;
    }
    if (historyFilter === 'low') {
      return (chk.aiAnalysis?.riskScore || 0) < 40;
    }
    return true;
  });

  const formatEmotionsData = (emotions) => {
    if (!emotions) return [];
    return Object.entries(emotions).map(([name, value]) => ({ 
      name, 
      value: Math.round(value * 100) / 100 
    }));
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'rape_gang_rape':
        return <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-xs border border-rose-300">PoA Sec 3(2)(v) Rape / Gang Rape</span>;
      case 'murder_arson_grievous':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">IPC 302/436 Murder & Arson</span>;
      case 'witness_intimidation':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-xs border border-purple-300">PoA Sec 15A Witness Intimidation</span>;
      case 'caste_violence_boycott':
        return <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold text-xs border border-indigo-300">Caste Boycott & Social Ostracism</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">PoA Atrocity Case</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top NHAA Official Header & Case Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 pb-5 border-b border-slate-800">
          <div className="flex items-start sm:items-center space-x-3.5">
            <button 
              onClick={() => navigate('/cases')} 
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 shrink-0 cursor-pointer"
              title="Return to NHAA Case Roster"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-md">
                  {caseData.nhaa_docket_no || `NHAA-14566-2026-UP-${4800 + caseData.id}`}
                </span>
                {getCategoryBadge(caseData.case_category)}
                <Badge variant={badgeVariant} className="font-semibold text-xs px-2.5 py-0.5">
                  {riskLevel} Risk ({caseData.riskScore}/100)
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{maskName(caseData.victimName)}</span>
                {isPrivacyShieldActive && (
                  <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                    Sec 15A Masked
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>FIR: <strong className="text-slate-200">{caseData.fir_number || 'FIR #121/2026'}</strong></span>
                <span>Police Station: <strong className="text-slate-200">{caseData.police_station || 'Kotwali Special Cell'}</strong></span>
                <span>Jurisdiction: <strong className="text-slate-200">{caseData.district || 'Varanasi'}, {caseData.state || 'Uttar Pradesh'}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Witness Privacy Shield Toggle */}
            <button
              onClick={() => setIsPrivacyShieldActive(!isPrivacyShieldActive)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                isPrivacyShieldActive 
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40' 
                  : 'bg-rose-600/30 text-rose-300 border-rose-500/50 hover:bg-rose-600/40'
              }`}
              title="PoA Sec 15A Witness Privacy Shield: Mask PII from general display"
            >
              {isPrivacyShieldActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isPrivacyShieldActive ? 'Privacy Shield ON' : 'Privacy Shield OFF'}</span>
            </button>

            <Button
              variant="outline"
              onClick={() => setIsFlawModalOpen(true)}
              className="text-xs py-2 px-3 border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-bold cursor-pointer"
              title="Diagnose Cognitive Flaws & Psychological Barriers"
            >
              <Brain className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <span>Flaw Radar</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsPatientModalOpen(true)}
              className="text-xs py-2 px-3 border-indigo-400/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 font-bold cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              <span>Demographics</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
              className="text-xs py-2 px-3 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Export EHR
            </Button>
          </div>
        </div>

        {/* Legal Status & Protection Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Legal Stage:</span>
            <span className="font-bold text-indigo-300 capitalize">{caseData.legal_stage || 'Trial Deposition'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Next Court Hearing:</span>
            <span className="font-bold text-amber-300">{caseData.court_next_hearing || '18 Sep 2026 (Special Court)'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Witness Protection (Sec 15A):</span>
            <span className="font-bold text-emerald-300">{caseData.witness_protection_status || 'Armed Police Escort'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Relief Compensation (DBT):</span>
            <span className="font-bold text-slate-200">{caseData.compensation_status || '75% Disbursed (₹ 6.18L)'}</span>
          </div>
        </div>
      </div>

      {/* NHAA Case Intelligence Command Hub */}
      <Card className="p-0 overflow-hidden shadow-md border-indigo-200">
        
        {/* Hub Tabs Header */}
        <div className="bg-slate-900 text-white p-3 px-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-sm tracking-wide">NHAA Case Intelligence & Distress Decision-Support</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveNhaaTab('lifecycle')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeNhaaTab === 'lifecycle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>4-Stage Lifecycle</span>
            </button>

            <button
              onClick={() => setActiveNhaaTab('predictive')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeNhaaTab === 'predictive' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>7-Day Predictive XAI</span>
            </button>

            <button
              onClick={() => setActiveNhaaTab('touchpoints')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeNhaaTab === 'touchpoints' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>IVRS Simulator (14566)</span>
            </button>

            <button
              onClick={() => setActiveNhaaTab('alerts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeNhaaTab === 'alerts' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Inter-Agency Dispatch</span>
            </button>
          </div>
        </div>

        {/* Tab 1: 4-Stage Legal Lifecycle Milestone Timeline */}
        {activeNhaaTab === 'lifecycle' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <Scale className="w-4 h-4 mr-2 text-indigo-600" />
                  4-Stage Legal Lifecycle & Pre-Trial Pressure Progression
                </h3>
                <p className="text-xs text-slate-500">
                  Tracking psychological trauma velocity across investigation, court trial, rehabilitation, and compensation.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-xs text-amber-900 font-bold flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Next Hearing: {caseData.court_next_hearing || '18 Sep 2026 (7 Days Away)'}</span>
              </div>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  stage: "1. Investigation",
                  status: caseData.legal_stage === 'investigation' ? 'Active' : 'Completed',
                  color: 'blue',
                  milestones: ["FIR Registered", "Forensic Evidence", "Charge Sheet Filed"],
                  distressDriver: "Fear of accused retaliation during initial statement recording."
                },
                {
                  stage: "2. Trial & Deposition",
                  status: caseData.legal_stage === 'trial' ? 'Active (Pre-Trial Surge)' : 'Pending',
                  color: 'rose',
                  milestones: ["Charges Framed", "Victim Cross-Exam", "Judicial Verdict"],
                  distressDriver: "Extreme anticipatory panic before facing the perpetrator in open court."
                },
                {
                  stage: "3. Rehabilitation",
                  status: 'Active',
                  color: 'purple',
                  milestones: ["Sarajeevi AI Care", "Safe House Shelter", "Livelihood Grant"],
                  distressDriver: "Social boycott, ostracism, and isolation from village community."
                },
                {
                  stage: "4. Compensation",
                  status: 'In-Progress (75% Disbursed)',
                  color: 'emerald',
                  milestones: ["25% at FIR", "50% at Charge Sheet", "25% at Verdict"],
                  distressDriver: "Severe economic hardship while awaiting administrative approvals."
                }
              ].map((s, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border ${
                    s.status.includes('Active') 
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20' 
                      : s.status === 'Completed'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800">{s.stage}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      s.status.includes('Active') 
                        ? 'bg-rose-100 text-rose-800' 
                        : s.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <ul className="space-y-1 my-3 text-[11px] text-slate-600">
                    {s.milestones.map((m, mIdx) => (
                      <li key={mIdx} className="flex items-center space-x-1.5">
                        <CheckCircle2 className={`w-3 h-3 ${s.status === 'Completed' || mIdx === 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500">
                    <strong className="text-slate-700 block">Distress Trigger:</strong>
                    <span>{s.distressDriver}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: 7-Day Predictive Risk Radar & Explainable AI (XAI) */}
        {activeNhaaTab === 'predictive' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-rose-600" />
                  7-Day Predictive Crisis Radar & Explainable AI (XAI)
                </h3>
                <p className="text-xs text-slate-500">
                  Anticipatory escalation modeling forecasting severe acute distress spikes before critical legal events.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-600">Model Confidence:</span>
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  94.2% Calibrated
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Risk Gauge Card */}
              <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900 text-white p-5 rounded-2xl border border-rose-500/40 flex flex-col justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-rose-300 font-bold block">
                    7-Day Crisis Surge Probability
                  </span>
                  <div className="flex items-baseline space-x-2 my-2">
                    <span className="text-4xl font-extrabold text-rose-400">
                      {predictiveData?.predictive_crisis_risk_7d || caseData.predictive_crisis_risk_7d || 86.5}%
                    </span>
                    <span className="text-xs text-rose-200 font-semibold">High Probability</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    AI indicates acute risk of panic attacks and decompensation driven by the upcoming 
                    <strong> Court Deposition on 18 Sep 2026</strong>.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-rose-500/30">
                  <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Preemptive Mandate Triggered</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Auto-escalation forwarded to Police SP Witness Protection Unit and District Magistrate Relief Cell.
                  </p>
                </div>
              </div>

              {/* XAI Feature Attributions Breakdown */}
              <div className="lg:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center">
                  <Brain className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  XAI Feature Attribution Breakdown (Distress Drivers)
                </h4>

                <div className="space-y-3 pt-1">
                  {[
                    { factor: "Pre-Trial Deposition Anticipation Pressure", weight: 32, note: "Approaching court appearance facing accused (7 days remaining)" },
                    { factor: "Witness Threat & Hostile Intimidation Signals", weight: 28, note: "PoA Sec 15A threat flags detected in recent check-ins" },
                    { factor: "Severe Sleep Architecture Disruption (<4.5 hrs)", weight: 18, note: "Sustained insomnia and REM fragmentation" },
                    { factor: "Historical Distress Surge Velocity", weight: 12, note: "3 consecutive check-ins in elevated risk bracket" },
                    { factor: "Acoustic Vocal Strain (Jitter & Tremor)", weight: 10, note: "Autonomic nervous system activation in voice mode" }
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{f.factor}</span>
                        <span className="font-mono font-bold text-indigo-600">{f.weight}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                          style={{ width: `${f.weight * 2.5}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-500">{f.note}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Multi-Channel Touchpoint Simulator (IVRS 14566, SMS, Hotline) */}
        {activeNhaaTab === 'touchpoints' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <Radio className="w-4 h-4 mr-2 text-teal-600" />
                  Multi-Channel Outreach & IVRS Voice Stress Simulator
                </h3>
                <p className="text-xs text-slate-500">
                  Simulate victim interactions across IVRS automated calls (14566), SMS outreach, and vocal stress analytics.
                </p>
              </div>
              <span className="text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 px-3 py-1 rounded-full">
                Toll-Free NHAA 14566
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Simulator Input Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                  <PhoneCall className="w-4 h-4 text-teal-600" />
                  <span>IVRS 14566 Simulated Voice Ingestion</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter or select a victim spoken response to evaluate real-time acoustic stress, panic keywords, and auto-dispatch:
                </p>

                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={simulatedVoiceText}
                    onChange={(e) => setSimulatedVoiceText(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSimulatedVoiceText("The accused relatives came to my house yesterday and threatened me if I depose in court next Tuesday.")}
                      className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-1 rounded font-semibold cursor-pointer"
                    >
                      Scenario: Pre-Trial Intimidation
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedVoiceText("I cannot sleep at night, I feel intense panic and trembling every time I hear a knock at the door.")}
                      className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded font-semibold cursor-pointer"
                    >
                      Scenario: Panic & Sleep Deprivation
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatedVoiceText("The village panchayat has barred my family from the communal well and ordered a complete boycott.")}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-900 px-2 py-1 rounded font-semibold cursor-pointer"
                    >
                      Scenario: Caste Boycott
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSimulateTouchpoint}
                  disabled={simulatingTouchpoint}
                  className="w-full py-2.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 mr-1.5" />
                  {simulatingTouchpoint ? 'Analyzing Voice Telemetry...' : 'Simulate 14566 IVRS Voice Check-in'}
                </Button>
              </div>

              {/* Real-time Result Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Acoustic Stress & Telemetry Output
                  </span>
                  {touchpointResult && (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      {touchpointResult.call_id}
                    </span>
                  )}
                </div>

                {touchpointResult ? (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Vocal Stress Level</span>
                        <strong className="text-rose-600 text-xs font-extrabold">{touchpointResult.vocal_stress_level}</strong>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block">Acoustic Distress Score</span>
                        <strong className="text-slate-800 text-xs font-extrabold">{touchpointResult.vocal_distress_score} / 100</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Detected Emotion:</span>
                        <strong className="text-slate-800 capitalize">{touchpointResult.detected_emotion}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Threat / Intimidation Flag:</span>
                        <strong className={touchpointResult.threat_flag ? "text-rose-600 font-bold" : "text-emerald-600"}>
                          {touchpointResult.threat_flag ? "ACTIVE THREAT DETECTED" : "None"}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Acoustic Jitter / Tremor:</span>
                        <span className="font-mono text-indigo-600 font-bold">1.82% (Elevated)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Autonomic Strain:</span>
                        <span className="font-mono text-amber-600 font-bold">High Sympathetic Arousal</span>
                      </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 text-[11px]">
                      <strong className="block font-bold mb-0.5">Automated Inter-Agency Action Triggered:</strong>
                      <span>{touchpointResult.recommended_action}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 space-y-2">
                    <PhoneCall className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-xs">Run a simulation on the left to inspect live IVRS acoustic telemetry.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Multi-Tier Inter-Agency Escalation Dispatcher */}
        {activeNhaaTab === 'alerts' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <AlertOctagon className="w-4 h-4 mr-2 text-amber-600" />
                  Multi-Tier Inter-Agency Alert Dispatcher
                </h3>
                <p className="text-xs text-slate-500">
                  Instantly dispatch actionable distress, threat, and relief interventions to statutory authorities.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                PoA Rule 8 & Sec 15A Mandates
              </span>
            </div>

            {alertSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{alertSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Police SP Card */}
              <div 
                onClick={() => setSelectedAgency('police_sp')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAgency === 'police_sp' 
                    ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <strong className="text-xs text-slate-900">Police SP (Witness Protection)</strong>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Statutory action under PoA Sec 15A: Immediate armed escort to court, residential police picketing, threat neutralization.
                </p>
              </div>

              {/* District Magistrate Card */}
              <div 
                onClick={() => setSelectedAgency('district_magistrate')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAgency === 'district_magistrate' 
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <strong className="text-xs text-slate-900">District Magistrate (DM Relief Cell)</strong>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Emergency financial relief under DBT, immediate transit safe-house relocation, food security, and education protection.
                </p>
              </div>

              {/* Clinical Counsellor Card */}
              <div 
                onClick={() => setSelectedAgency('counsellor')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedAgency === 'counsellor' 
                    ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-4 h-4 text-emerald-600" />
                  <strong className="text-xs text-slate-900">Trauma Clinical Team</strong>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Trauma desensitization, pre-trial psychological stabilization, 4-7-8 grounding, and 24/7 tele-counselling via Sarajeevi AI.
                </p>
              </div>

            </div>

            {/* Dispatch Form */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-800">
                  Target: <strong className="text-indigo-600 uppercase">{selectedAgency.replace('_', ' ')}</strong>
                </span>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Severity Tier:</span>
                  <select
                    value={alertSeverity}
                    onChange={(e) => setAlertSeverity(e.target.value)}
                    className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
                  >
                    <option value="critical">Critical (Immediate Response)</option>
                    <option value="high">High (Within 12 Hours)</option>
                    <option value="moderate">Moderate (Within 24 Hours)</option>
                  </select>
                </div>
              </div>

              <Textarea
                rows={3}
                placeholder="Specify urgent tactical details, location of threat, hearing date, or required emergency assistance..."
                value={alertNotes}
                onChange={(e) => setAlertNotes(e.target.value)}
                className="text-xs bg-white"
              />

              <div className="flex justify-end">
                <Button
                  onClick={handleDispatchAlert}
                  disabled={dispatchingAlert}
                  className="py-2 px-4 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                >
                  <SendHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  {dispatchingAlert ? 'Dispatching Inter-Agency Alert...' : 'Dispatch Inter-Agency Alert'}
                </Button>
              </div>
            </div>

          </div>
        )}

      </Card>

      {/* EHR Longitudinal Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-indigo-600">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Distress Score Index</p>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-extrabold ${getRiskColor(caseData.riskScore)}`}>
              {caseData.riskScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 flex items-center">
            {caseData.riskScore >= 60 ? (
              <span className="text-rose-600 flex items-center font-medium"><ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> High Trajectory</span>
            ) : (
              <span className="text-emerald-600 flex items-center font-medium"><ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Baseline Controlled</span>
            )}
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Historical Check-ins</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalEntries}</span>
            <span className="text-xs text-slate-400">entries recorded</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Multi-channel touchpoint adherence</span>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-violet-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Average Sleep Architecture</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-800">{avgSleep}</span>
            <span className="text-xs text-slate-400">hrs / night</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            {parseFloat(avgSleep) < 5 ? '⚠️ Severe sleep deprivation' : 'Sleep architecture adequate'}
          </span>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reported Mood Index</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-800">{caseData.averageMood || 4.2}</span>
            <span className="text-xs text-slate-400">/ 10 avg</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">Self-reported subjective baseline</span>
        </Card>
      </div>

      {/* 30-Day Longitudinal Trend Chart */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800">Longitudinal Distress & Mood Trajectory</h2>
            <p className="text-xs text-slate-500">Multi-axis temporal chart correlating AI Distress Index with Self-Reported Mood</p>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-indigo-600 inline-block"></span>
              <span className="text-slate-600 font-medium">Distress Score (0-100)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 border-b border-dashed inline-block"></span>
              <span className="text-slate-600 font-medium">Mood (1-10)</span>
            </div>
          </div>
        </div>
        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} reversed />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              <ReferenceLine y={80} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical (80)', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={60} yAxisId="left" stroke="#f97316" strokeDasharray="3 3" label={{ value: 'High (60)', position: 'insideTopRight', fill: '#f97316', fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} name="Distress Score" />
              <Line yAxisId="right" type="monotone" dataKey="mood" stroke="#10b981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} name="Reported Mood" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Main 2-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left 3 Columns: Full Longitudinal Check-in History */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-indigo-600" /> Complete Patient History & Encounters
              </h2>
              <p className="text-xs text-slate-500">Review all historical check-ins, journal narratives, and XAI rationales</p>
            </div>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
              {filteredCheckIns.length} of {checkIns.length} Records
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-xs space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search across journal text, keywords, XAI rationales..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center">
                <Filter className="w-3 h-3 mr-1" /> Filter:
              </span>
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${historyFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Records ({checkIns.length})
              </button>
              <button
                onClick={() => setHistoryFilter('high')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${historyFilter === 'high' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                High & Critical ({highDistressEntries})
              </button>
              <button
                onClick={() => setHistoryFilter('journal')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${historyFilter === 'journal' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                With Journal Notes
              </button>
              <button
                onClick={() => setHistoryFilter('low')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${historyFilter === 'low' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Low / Stable
              </button>
            </div>
          </div>

          {/* Longitudinal History Cards */}
          <div className="space-y-3">
            {filteredCheckIns.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium">No check-ins match the search criteria.</p>
              </div>
            ) : (
              filteredCheckIns.map(chk => {
                const isExpanded = expandedCheckIn === chk.id;
                const emotionData = formatEmotionsData(chk.aiAnalysis?.emotions);
                const score = chk.aiAnalysis?.riskScore || 0;
                const scoreBadge = score >= 80 ? 'red' : score >= 60 ? 'orange' : score >= 40 ? 'amber' : 'emerald';

                return (
                  <Card key={chk.id} className="p-0 overflow-hidden transition-all duration-200 border-slate-200 hover:border-slate-300">
                    <div 
                      className="p-4 cursor-pointer hover:bg-slate-50/80 transition-colors flex justify-between items-center select-none"
                      onClick={() => setExpandedCheckIn(isExpanded ? null : chk.id)}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100">
                          {chk.mood <= 2 ? '😢' : chk.mood <= 4 ? '😐' : chk.mood <= 7 ? '🙂' : '😊'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold text-slate-800">{formatDate(chk.date)}</span>
                            <Badge variant={scoreBadge} className="text-[10px] py-0 px-1.5 font-semibold">
                              Score: {score}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Mood: <strong className="text-slate-700">{chk.mood}/10</strong> &bull; Sleep: <strong className="text-slate-700">{chk.sleep || 7}h</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className="text-xs hidden sm:inline text-slate-400">
                          {isExpanded ? 'Collapse' : 'Details'}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expanded Encounter Details */}
                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-3 text-xs">
                        {chk.text && (
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">Self-Reported Journal Note:</span>
                            <p className="text-slate-700 italic">"{chk.text}"</p>
                          </div>
                        )}

                        <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
                          <span className="text-[11px] font-bold text-indigo-700 flex items-center mb-1">
                            <Brain className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                            XAI Clinical Decision Rationale:
                          </span>
                          <p className="text-indigo-950 leading-relaxed">
                            {chk.aiAnalysis?.xaiRationale || "Check-in evaluated for clinical distress indicators and acute risk signals."}
                          </p>
                        </div>

                        {chk.aiAnalysis?.keywords && chk.aiAnalysis.keywords.length > 0 && (
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 mr-2">Extracted Distress Drivers:</span>
                            <div className="inline-flex flex-wrap gap-1 mt-1">
                              {chk.aiAnalysis.keywords.map((kw, kwIdx) => (
                                <span key={kwIdx} className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md font-medium">
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Ambient AI Scribe, Clinical Notes & Patient Messages */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Clinical Note-Taking (Sanjeevani EHR) */}
          <Card className="shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-indigo-600" /> Add Clinical Encounter Note
              </h3>
              <span className="text-[11px] text-slate-400">Case #{caseData.id}</span>
            </div>

            {/* Note Templates */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Clinical Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => insertTemplate("Intake trauma assessment conducted. Patient exhibits somatic hyperarousal and anticipatory panic regarding next court appearance. Coping strategies provided.", "Intake Note")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                >
                  + Trauma Intake
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate("Post-crisis outreach call conducted. Confirmed physical safety and verified PoA Sec 15A police protection. Grounding protocol reviewed.", "Crisis Follow-up")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                >
                  + Crisis Outreach
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate("Pre-trial legal support session. Addressed fear of facing accused defense counsel. Coordinated with District Legal Services Authority.", "Legal Prep")}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                >
                  + Legal Prep
                </button>
              </div>
            </div>

            {/* Ambient AI Clinical Scribe */}
            <AmbientScribeWidget 
              patientName={caseData.victimName}
              onInsertNote={(text, type) => {
                setNoteType(type);
                setNewNote(text);
              }}
            />

            <Textarea
              rows={4}
              placeholder="Type clinical observations, session summary, or care recommendations..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-xs"
            />

            <div className="flex items-center justify-between pt-1">
              {noteSavedToast ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> Note saved to EHR!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Signed as {caseData.counsellorName || "Clinician"}</span>
              )}
              <Button
                variant="primary"
                onClick={handleSaveNote}
                disabled={savingNote || !newNote.trim()}
                className="text-xs py-1.5 px-3 flex items-center cursor-pointer"
              >
                <Send className="w-3 h-3 mr-1.5" />
                {savingNote ? 'Saving...' : 'Save to Record'}
              </Button>
            </div>
          </Card>

          {/* Direct Patient Messages & Quick Reply Hub */}
          <Card className="shadow-xs space-y-3 border-emerald-100 bg-linear-to-b from-emerald-50/30 to-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <MessageSquare className="w-4 h-4 mr-1.5 text-emerald-600" /> Direct Patient Messages ({patientMessages.length})
              </h3>
              <button
                onClick={() => navigate('/chat')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                Open Full Hub &rarr;
              </button>
            </div>

            {patientMessages.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {patientMessages.map(m => {
                  const isTherapist = m.sender_role === 'therapist';
                  return (
                    <div 
                      key={m.id} 
                      className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                        isTherapist 
                          ? 'bg-indigo-50 border border-indigo-100 text-indigo-950 ml-4' 
                          : 'bg-white border border-slate-200 text-slate-800 mr-4'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                        <strong className={isTherapist ? "text-indigo-700" : "text-slate-700"}>{m.sender_name}</strong>
                        <span>{formatTime(m.created_at)}</span>
                      </div>
                      <p>{m.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-white p-2.5 rounded-lg border border-slate-200">
                No direct messages yet. Send a supportive check-in message below.
              </p>
            )}

            {/* Quick Reply Form */}
            <div className="flex items-center space-x-1.5 pt-1">
              <input
                type="text"
                placeholder={`Reply to ${maskName(caseData.victimName)}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendTherapistReply(); }}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button
                variant="primary"
                onClick={handleSendTherapistReply}
                disabled={sendingReply || !replyText.trim()}
                className="text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Send className="w-3 h-3 mr-1" />
                {sendingReply ? 'Sending...' : 'Reply'}
              </Button>
            </div>
          </Card>

          {/* Historical Clinical Notes */}
          {clinicalNotes.length > 0 && (
            <Card className="shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-indigo-600" /> Saved Clinician Notes ({clinicalNotes.length})
              </h3>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {clinicalNotes.map(n => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <strong className="text-slate-700">{n.author_name}</strong>
                      <span>{formatDate(n.created_at)}</span>
                    </div>
                    <span className="inline-block text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                      {n.note_type}
                    </span>
                    <p className="text-slate-700 text-xs mt-1">{n.note}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Official Helplines Reference Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-indigo-800/40 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-indigo-300 font-bold">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>NHAA 14566 Statutory Helplines</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span>National Helpline Against Atrocities:</span>
                <strong className="text-emerald-400 font-mono">14566 (24x7)</strong>
              </div>
              <div className="flex justify-between">
                <span>Tele-MANAS Psychological Support:</span>
                <strong className="text-indigo-300 font-mono">14416 / 1800-891-4416</strong>
              </div>
              <div className="flex justify-between">
                <span>KIRAN Mental Health Helpline:</span>
                <strong className="text-amber-300 font-mono">1800-599-0019</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Patient Demographics & Clinical Profile Inspection Modal */}
      {caseData && (
        <ProfileModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          patientData={{
            id: caseData.id,
            victimName: isPrivacyShieldActive ? maskName(caseData.victimName) : caseData.victimName,
            full_name: isPrivacyShieldActive ? maskName(caseData.victimName) : caseData.victimName,
            age: caseData.victim_age || 29,
            gender: caseData.victim_gender || 'Female',
            phone: isPrivacyShieldActive ? '+91 ••••• ••••5' : (caseData.victim_phone || '+91 98765 43210'),
            emergency_contact: 'Designated Family Representative (PoA Sec 15A Protected)',
            bio: `Registered under NHAA 14566 framework. Category: ${caseData.case_category}. Legal stage: ${caseData.legal_stage}.`,
            email: `docket-${caseData.id}@nhaa.gov.in`
          }}
        />
      )}

      {/* Official EHR Clinical Dossier Export & Print Modal */}
      {caseData && (
        <EhrExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          caseData={caseData}
          checkIns={checkIns}
          clinicalNotes={clinicalNotes}
        />
      )}

      {/* AI Patient Flaw & Clinical Barrier Analyzer Modal */}
      {caseData && (
        <PatientFlawAnalyzerModal
          isOpen={isFlawModalOpen}
          onClose={() => setIsFlawModalOpen(false)}
          caseId={caseData.id}
          patientName={caseData.victimName}
          onNoteAdded={loadAllData}
        />
      )}
    </div>
  );
};

export default CaseDetails;
