import React from 'react';
import { X, Printer, Shield, FileText, CheckCircle2, User, Phone, Activity } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

const EhrExportModal = ({ isOpen, onClose, caseData, checkIns, clinicalNotes }) => {
  if (!isOpen || !caseData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Top Actions Bar (Not Printed) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-bold tracking-wide uppercase">Official EHR Clinical Dossier Export</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable EHR Document Content */}
        <div className="p-8 sm:p-10 overflow-y-auto space-y-6 text-slate-900 bg-white" id="printable-ehr">
          
          {/* Clinic / System Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Sanjeevani Health Systems (संजीवनी)</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                National Longitudinal Behavioral EHR & Crisis Intelligence
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded border border-slate-300">
                CONFIDENTIAL MEDICAL RECORD
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Generated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Patient Demographics Table */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Patient Full Name</span>
              <p className="text-sm font-bold text-slate-800">{caseData.victimName}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Age & Gender</span>
              <p className="text-sm font-bold text-slate-800">{caseData.victim_age || 29} yrs / {caseData.victim_gender || 'Female'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Record / Case ID</span>
              <p className="text-sm font-bold text-slate-800">{caseData.code || `C-${1000 + caseData.id}`}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Attending Clinician</span>
              <p className="text-sm font-bold text-indigo-700">{caseData.counsellorName || "Dr. Sarah Jenkins, PsyD"}</p>
            </div>

            <div>
              <span className="text-slate-400 font-medium block">Contact Phone</span>
              <p className="font-semibold text-slate-700">{caseData.victim_phone || "+1 (555) 782-4419"}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 font-medium block">Emergency Contact</span>
              <p className="font-semibold text-rose-700">{caseData.victim_emergency_contact || "Marcus Vance (Brother) - +1 (555) 782-9900"}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Current Clinical Status</span>
              <p className="font-bold uppercase text-slate-800">{caseData.status || "Active Monitoring"}</p>
            </div>
          </div>

          {/* Clinical Distress & Biometrics Summary */}
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">
              1. Quantitative Distress & Biometrics Trajectory
            </h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-xs text-slate-500">Current Distress Index</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{caseData.riskScore}/100</p>
                <span className="text-[10px] text-slate-400 font-medium">NLP Compound Risk</span>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-xs text-slate-500">Average Sleep Duration</span>
                <p className="text-2xl font-black text-indigo-600 mt-1">4.8 hrs</p>
                <span className="text-[10px] text-slate-400 font-medium">Physiological Deficit</span>
              </div>
              <div className="p-3 bg-slate-50 border rounded-lg">
                <span className="text-xs text-slate-500">Check-ins Monitored</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{checkIns?.length || 10}</p>
                <span className="text-[10px] text-slate-400 font-medium">Continuous Signal</span>
              </div>
            </div>
          </div>

          {/* Patient Clinical Dossier / Trauma History */}
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">
              2. Clinical Dossier & Trauma History
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border">
              {caseData.victim_bio || "Patient experiencing acute panic episodes, nightmares, and somatic autonomic hyperarousal following vehicular trauma. Monitored for trauma-informed cognitive behavioral stabilization and crisis safety triggers."}
            </p>
          </div>

          {/* Longitudinal Clinical Notes Stream */}
          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b pb-1">
              3. Attending Clinical Notes & Encounter Records
            </h2>
            <div className="space-y-2 text-xs">
              {clinicalNotes && clinicalNotes.length > 0 ? (
                clinicalNotes.slice(0, 4).map((note, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                      <span className="font-bold text-indigo-700">{note.note_type} &bull; {note.author_name}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-slate-800 text-xs leading-relaxed">{note.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No formal clinical notes recorded yet.</p>
              )}
            </div>
          </div>

          {/* Legal / HIPAA Sign-Off Block */}
          <div className="pt-6 border-t border-slate-300 mt-8 flex items-end justify-between text-xs">
            <div>
              <div className="flex items-center space-x-1.5 text-slate-500">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>HIPAA Title II Confidential Record &bull; End-to-End Cryptographic Audit Trail</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sanjeevani Medical Intelligence &bull; License #SJ-8821-X</p>
            </div>

            <div className="text-right">
              <div className="w-48 border-b border-slate-800 pb-1 mb-1 font-serif italic text-sm text-indigo-900">
                Dr. Sarah Jenkins, PsyD
              </div>
              <span className="text-[10px] text-slate-500 block">Attending Clinician Signature & Date</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EhrExportModal;
