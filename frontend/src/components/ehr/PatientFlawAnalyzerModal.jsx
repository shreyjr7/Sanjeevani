import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Brain, Sparkles, Shield, Check, FileText, 
  ArrowRight, ShieldAlert, Activity, HeartHandshake, Printer, Zap, CheckCircle2 
} from 'lucide-react';
import { getPatientFlawAnalysis, saveClinicalNote } from '../../services/api';

const PatientFlawAnalyzerModal = ({ isOpen, onClose, caseId = 1, patientName = "Elena Vance", onNoteAdded }) => {
  const [loading, setLoading] = useState(true);
  const [flawData, setFlawData] = useState(null);
  const [insertedStrategy, setInsertedStrategy] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getPatientFlawAnalysis(caseId).then(res => {
        if (res?.data) {
          setFlawData(res.data);
        }
        setLoading(false);
      });
    }
  }, [isOpen, caseId]);

  const handleInsertCountermeasure = async (item) => {
    const noteText = `[AI PATIENT FLAW COUNTERMEASURE - ${item.strategy.toUpperCase()}]
Target Cognitive Distortion: ${item.target_distortion}
Prescribed Protocol: ${item.protocol}
Primary Barrier Addressed: ${flawData?.primary_flaw}
Recommended Session Probe: "${flawData?.recommended_session_question}"`;
    await saveClinicalNote(caseId, noteText, "Therapy Countermeasure");
    setInsertedStrategy(item.strategy);
    if (onNoteAdded) onNoteAdded();
    setTimeout(() => setInsertedStrategy(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-inner">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  AI Patient Flaws & Clinical Barriers Analyzer
                </h2>
                <span className="text-[10px] bg-rose-500/30 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-400/30 uppercase">
                  DIAGNOSTIC RADAR
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Psychological Obstacles, Cognitive Distortions & Countermeasures &bull; {patientName} (Case C-{1000 + Number(caseId)})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Print Clinical Summary"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 bg-slate-50/50">
          
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 font-medium">Synthesizing patient check-in journals, sleep telemetry & speech patterns...</p>
            </div>
          ) : (
            <>
              {/* Core Flaw Banner */}
              <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 border-2 border-rose-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full border border-rose-300/60 inline-flex items-center w-fit">
                    <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                    Primary Identified Patient Barrier / Flaw
                  </span>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-semibold">Impact on Care:</span>
                    <span className="font-extrabold text-rose-600 bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                      {flawData?.impact_score}/100 ({flawData?.severity} Risk)
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {flawData?.primary_flaw}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed mt-2 bg-white/80 p-3 rounded-xl border border-rose-100">
                  {flawData?.summary}
                </p>
              </div>

              {/* Cognitive Distortions & Psychological Vulnerabilities Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Cognitive Distortions & Emotional Vulnerabilities</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">NLP Attribution Meter</span>
                </div>

                <div className="space-y-3">
                  {flawData?.distortions?.map((dist, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{dist.name}</span>
                        <span className="font-bold text-slate-600 font-mono">{dist.score}%</span>
                      </div>
                      <p className="text-[11px] text-slate-500 italic mb-1">{dist.desc}</p>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            dist.score >= 85 ? 'bg-rose-500' :
                            dist.score >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${dist.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Trail extracted from patient reflections */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Clinical Evidence Trail (EHR Journal Quotes & Biometrics)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {flawData?.evidence_trail?.map((ev, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700 leading-relaxed flex items-start space-x-2">
                      <span className="text-indigo-600 font-bold text-sm leading-none">•</span>
                      <span>{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Targeted Clinical Countermeasures */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Prescribed Therapeutic Countermeasures</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                    Evidence-Based CBT / DBT
                  </span>
                </div>

                <div className="space-y-3">
                  {flawData?.therapeutic_countermeasures?.map((item, idx) => {
                    const isInserted = insertedStrategy === item.strategy;
                    return (
                      <div key={idx} className="p-4 bg-slate-50 hover:bg-indigo-50/30 rounded-xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 max-w-lg">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-xs">{item.strategy}</span>
                            <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
                              Targets: {item.target_distortion}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{item.protocol}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInsertCountermeasure(item)}
                          disabled={isInserted}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 ${
                            isInserted 
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                          }`}
                        >
                          {isInserted ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Added to Chart!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Add to Chart</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Session Question Probe */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl border border-indigo-700/50 shadow-xs flex items-start space-x-3">
                <HeartHandshake className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                    Recommended Socratic Probe for Next Therapy Session
                  </span>
                  <p className="text-xs text-indigo-100 font-medium italic leading-relaxed">
                    "{flawData?.recommended_session_question}"
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>AI Psychological Vulnerability Modeling &bull; HIPAA Compliant</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Diagnostic
          </button>
        </div>

      </div>
    </div>
  );
};

export default PatientFlawAnalyzerModal;
