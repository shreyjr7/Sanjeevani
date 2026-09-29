import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Check, Play, Pause, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const AmbientScribeWidget = ({ patientName = "Elena Vance", onInsertNote }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStep, setRecordingStep] = useState(0); // 0 = idle, 1 = listening, 2 = transcribed, 3 = soap ready
  const [soapGenerated, setSoapGenerated] = useState(false);
  const [inserted, setInserted] = useState(false);

  const mockTranscript = `Dr. Sarah Jenkins: "Elena, welcome back. How have you been feeling since our last session?"
Elena Vance: "It's been tough, doctor. The panic attacks have been waking me up around 3 AM. Whenever I hear traffic or loud braking outside, my heart races and I freeze. I haven't slept more than 3 to 4 hours."
Dr. Sarah Jenkins: "I hear you, Elena. Your check-in distress score is currently elevated at 77/100. We are going to prioritize daily 4-7-8 breathing pacer exercises and schedule a bilateral trauma stabilization check next Tuesday."`;

  const structuredSoap = `SUBJECTIVE:
Patient reports recurrent panic attacks triggered by vehicular audio cues (brakes, sirens). Severe insomnia with sleep latency < 4 hours per night. Endorses feelings of dread and autonomic hyperarousal.

OBJECTIVE:
Longitudinal EHR distress score 77/100 (High Risk). Ambient NLP sentiment compound -0.72. Negative affect and anxiety keywords detected across check-ins.

ASSESSMENT:
Post-Traumatic Stress Disorder (acute exacerbation) with secondary panic symptomatology and sleep disturbance post-incident.

PLAN:
1. Daily 4-7-8 breathing pacer via Sarajeevi AI companion.
2. Trauma-informed bilateral grounding stabilization.
3. Emergency contact (Marcus Vance) alert acknowledged.
4. Follow-up clinical session scheduled for next week.`;

  const handleStartScribe = () => {
    setIsRecording(true);
    setRecordingStep(1);
    setInserted(false);

    // Simulate audio capture and transcription
    setTimeout(() => {
      setRecordingStep(2);
    }, 1200);

    setTimeout(() => {
      setRecordingStep(3);
      setSoapGenerated(true);
      setIsRecording(false);
    }, 2400);
  };

  const handleInsert = () => {
    if (onInsertNote) {
      onInsertNote(structuredSoap, "SOAP Encounter Note");
      setInserted(true);
      setTimeout(() => setInserted(false), 3000);
    }
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-4 text-white border border-indigo-700/50 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500/30 rounded-lg border border-indigo-400/40">
            <Mic className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span>Sanjeevani Ambient AI Clinical Scribe (संजीवनी)</span>
              <span className="text-[10px] bg-emerald-500/40 text-emerald-200 px-1.5 py-0.2 rounded font-medium">DAX</span>
            </h4>
            <p className="text-[10px] text-indigo-300">Live clinical encounter transcription & automatic SOAP synthesis</p>
          </div>
        </div>

        <div>
          {isRecording ? (
            <button
              onClick={() => setIsRecording(false)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 animate-pulse cursor-pointer shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>Recording Encounter...</span>
            </button>
          ) : (
            <button
              onClick={handleStartScribe}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{soapGenerated ? 'Re-run Ambient Scribe' : 'Simulate Ambient Scribe'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Recording Waveform Animation */}
      {isRecording && (
        <div className="p-3 bg-slate-950/80 rounded-lg border border-indigo-500/30 flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce"></span>
            <span className="w-1 h-5 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.1s]"></span>
            <span className="w-1 h-7 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
            <span className="w-1 h-6 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.15s]"></span>
          </div>
          <span className="text-[11px] text-indigo-200 italic">
            Capturing ambient audio session with {patientName}... Transcribing dialogue & structuring SOAP notes.
          </span>
        </div>
      )}

      {/* Generated SOAP Result */}
      {soapGenerated && !isRecording && (
        <div className="bg-slate-950/90 rounded-lg p-3 border border-indigo-500/40 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px] text-indigo-300 border-b border-indigo-800/60 pb-1">
            <span className="font-semibold flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generated SOAP Clinical Assessment</span>
            </span>
            <span className="text-emerald-400 text-[10px] font-bold">100% HIPAA Formatted</span>
          </div>

          <pre className="text-[11px] font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto bg-slate-900/60 p-2 rounded border border-slate-800">
            {structuredSoap}
          </pre>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 italic">
              Review and click Insert to include in official longitudinal record.
            </span>
            <button
              onClick={handleInsert}
              disabled={inserted}
              className={`px-3 py-1 rounded text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer ${
                inserted 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}
            >
              {inserted ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Inserted into Chart!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  <span>Insert SOAP Note into Chart</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmbientScribeWidget;
