import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, Award, ArrowRight, CheckCircle2, ChevronDown, 
  ChevronUp, Shield, Activity, MessageSquare, FileText, User 
} from 'lucide-react';

const JudgeTourBar = ({ onOpenProfile }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const tourSteps = [
    {
      id: 1,
      title: "Sanjeevani Longitudinal EHR (Case #1)",
      desc: "Live EHR timeline, ambient AI intelligence & distress scoring",
      path: "/cases/1",
      icon: Activity
    },
    {
      id: 2,
      title: "Trauma-Informed 24/7 AI Companion",
      desc: "Interactive 4-7-8 breathing pacer & direct doctor chat",
      path: "/chat",
      icon: MessageSquare
    },
    {
      id: 3,
      title: "Patient Demographics & Dossier",
      desc: "Inspect legal Name, Age, Gender & Emergency Contact",
      action: () => onOpenProfile && onOpenProfile(),
      icon: User
    },
    {
      id: 4,
      title: "NLP Check-in Sentiment Radar",
      desc: "Real-time biometric mood & sleep journaling",
      path: "/check-in",
      icon: FileText
    },
    {
      id: 5,
      title: "Clinical Intervention Pipeline",
      desc: "Automated triage recommendations & scheduled interventions",
      path: "/intervention",
      icon: Shield
    }
  ];

  return (
    <div className="sticky top-16 z-30 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white border-b border-indigo-800/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
        
        {/* Left Badge & Quick Nav */}
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-bold tracking-wide uppercase">
            <Award className="w-3.5 h-3.5" />
            <span>Judge & Evaluator Tour</span>
          </span>
          <span className="hidden md:inline text-xs text-indigo-200">
            Quickly evaluate Sanjeevani's (संजीवनी) 5 core clinical AI innovations:
          </span>
        </div>

        {/* Quick Tour Step Pills */}
        <div className="hidden lg:flex items-center space-x-2">
          {tourSteps.map((step) => {
            const isActive = location.pathname === step.path;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => {
                  if (step.action) {
                    step.action();
                  } else {
                    navigate(step.path);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold border border-indigo-400/40'
                    : 'bg-white/10 hover:bg-white/20 text-indigo-100 hover:text-white border border-white/10'
                }`}
                title={step.desc}
              >
                <Icon className="w-3 h-3" />
                <span>{step.id}. {step.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-indigo-200 hover:text-white flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Hide Tour Guide' : 'Full Tour Guide'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Interactive Tour Drawer */}
      {isExpanded && (
        <div className="border-t border-indigo-800/50 bg-slate-950/95 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sanjeevani Evaluation Walkthrough for Judges</span>
              </h3>
              <span className="text-xs text-indigo-300">Click any card to jump directly into that live module</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {tourSteps.map((step) => {
                const isActive = location.pathname === step.path;
                const Icon = step.icon;
                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      if (step.action) {
                        step.action();
                      } else {
                        navigate(step.path);
                      }
                      setIsExpanded(false);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-indigo-900/60 border-indigo-400 shadow-md ring-1 ring-indigo-400'
                        : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-indigo-600/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                        {step.id}
                      </div>
                      <Icon className="w-4 h-4 text-indigo-400 group-hover:text-indigo-200" />
                    </div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {step.desc}
                    </p>
                    <div className="mt-3 flex items-center text-[11px] text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Launch Step {step.id}</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeTourBar;
