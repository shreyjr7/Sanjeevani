import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Textarea, Badge } from '../components/ui/components';
import { submitCheckIn, analyzePipelineSandbox } from '../services/api';
import { 
  Heart, CheckCircle, Brain, Sparkles, AlertTriangle, 
  Activity, ShieldAlert, Zap, Flame, Wind 
} from 'lucide-react';

const MOOD_EMOJIS = ['😭', '😢', '😐', '🙂', '😄'];
const TAGS = ['Anxious', 'Sad', 'Hopeful', 'Angry', 'Calm', 'Tired', 'Grateful', 'Lonely', 'Motivated'];

const CheckIn = () => {
  const navigate = useNavigate();
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState(7);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Real-time AI NLP Pre-Assessment state
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!text || text.trim().length < 6) {
      setLiveAnalysis(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsAnalyzing(true);
      const res = await analyzePipelineSandbox(text, mood, sleep);
      if (res) setLiveAnalysis(res);
      setIsAnalyzing(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [text, mood, sleep]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitCheckIn({ mood, sleep, text, tags: selectedTags });
      setShowSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="bg-white rounded-2xl shadow-xl p-12 border border-slate-200">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check-in Logged Successfully 💙</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Your reflection and biometric parameters have been securely processed by the 6-stage clinical distress pipeline and updated in your care team's EHR file.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={() => navigate('/dashboard')} className="px-6 py-2.5">
              Return to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/chat')} 
              className="px-6 py-2.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Talk with Sarajeevi AI Companion &rarr;
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const score = liveAnalysis?.riskScore || 25;
  const isHighRisk = score >= 60;
  const isCritical = score >= 80 || liveAnalysis?.crisisOverride;

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 rounded-full text-indigo-700 text-xs font-semibold mb-2">
          <Brain className="w-3.5 h-3.5" />
          <span>Real-time Clinical NLP Pre-Assessment Active</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daily Wellness Check-In</h1>
        <p className="text-slate-500 text-sm">Reflect on your mood, rest, and thoughts for ambient clinical monitoring</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Mood */}
        <Card className="p-6 sm:p-8">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-6">
            1. Current Emotional Valence
          </h3>
          <div className="flex justify-between items-center mb-4 px-4 max-w-md mx-auto">
            {MOOD_EMOJIS.map((emoji, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setMood(idx + 1)}
                className={`text-4xl transition-transform hover:scale-110 cursor-pointer ${
                  mood === idx + 1 ? 'scale-125 drop-shadow-md grayscale-0' : 'grayscale opacity-40 hover:opacity-100 hover:grayscale-0'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-400 px-4 max-w-md mx-auto">
            <span>Severe Distress</span>
            <span>Neutral</span>
            <span>Calm & Balanced</span>
          </div>
        </Card>

        {/* Step 2: Sleep & Physiological Rest */}
        <Card className="p-6 sm:p-8">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">
            2. Physiological Rest & Sleep Duration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-slate-600 font-medium">Hours of sleep last night:</label>
              <span className="font-bold text-lg text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-lg border border-indigo-200">
                {sleep} hrs
              </span>
            </div>
            <input 
              type="range" 
              min="0" max="14" step="1" 
              value={sleep} 
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>0h (Severe Insomnia)</span>
              <span>7-8h (Recommended)</span>
              <span>14h+</span>
            </div>
          </div>
        </Card>

        {/* Step 3: Journal & NLP Pre-Assessment */}
        <Card className="p-6 sm:p-8">
          <div className="flex justify-between items-end mb-3">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              3. Unstructured Personal Journal
            </h3>
            <span className="text-xs text-slate-400">{text.length} characters</span>
          </div>

          <Textarea 
            rows={5}
            placeholder="Share your raw thoughts, triggers, physical sensations, or emotional experiences today..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-sm leading-relaxed"
          />
          
          {/* Quick Tags */}
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Key Feelings:</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                    selectedTags.includes(tag) 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time NLP Distress Gauge & Explainability Display */}
          {liveAnalysis && (
            <div className={`mt-6 p-4 rounded-xl border transition-all animate-in fade-in duration-200 ${
              isCritical 
                ? 'bg-rose-50/70 border-rose-200' 
                : isHighRisk 
                  ? 'bg-amber-50/70 border-amber-200' 
                  : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Live AI Pre-Assessment Signal
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {isAnalyzing && (
                    <span className="text-[10px] text-slate-400 animate-pulse">Analyzing...</span>
                  )}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    isCritical 
                      ? 'bg-rose-600 text-white' 
                      : isHighRisk 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-emerald-600 text-white'
                  }`}>
                    {score}/100 ({score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : 'Low'})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Compound Sentiment Valence:</span>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {liveAnalysis.sentiment > 0.05 ? 'Positive / Calm' : liveAnalysis.sentiment < -0.05 ? 'Negative / Distressed' : 'Neutral'} ({liveAnalysis.sentiment})
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Detected Distress Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {liveAnalysis.keywords && liveAnalysis.keywords.length > 0 ? (
                      liveAnalysis.keywords.map((kw, i) => (
                        <span key={i} className="bg-rose-100 text-rose-700 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">No high-distress keywords</span>
                    )}
                  </div>
                </div>
              </div>

              {liveAnalysis.xaiRationale && (
                <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-200/60 leading-relaxed italic">
                  <strong>NLP Rationale:</strong> {liveAnalysis.xaiRationale}
                </p>
              )}

              {/* Crisis Safety Banner */}
              {isCritical && (
                <div className="mt-3 p-2.5 bg-rose-100 border border-rose-300 rounded-lg flex items-center space-x-2 text-rose-800 text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Safety Notice:</strong> Elevated distress indicators identified. The 988 Crisis Lifeline is available 24/7 free and confidential.
                  </span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col items-center pt-2">
          <Button 
            type="submit" 
            className="w-full py-3.5 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer disabled:opacity-50" 
            disabled={isSubmitting || !text.trim()}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting to Care Team...</span>
              </span>
            ) : (
              'Submit Check-In to Clinical EHR'
            )}
          </Button>
          
          <p className="text-xs text-slate-400 flex items-center mt-3">
            <Heart className="w-3.5 h-3.5 mr-1 text-slate-400" />
            <span>End-to-End Encrypted & HIPAA Compliant Check-In Log.</span>
          </p>
        </div>
      </form>
    </div>
  );
};

export default CheckIn;
