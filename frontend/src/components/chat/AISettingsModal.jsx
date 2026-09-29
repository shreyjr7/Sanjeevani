import React, { useState, useEffect } from 'react';
import { getAISettings, updateAISettings } from '../../services/api';
import { Bot, Key, Sparkles, CheckCircle, AlertCircle, RefreshCw, X, ExternalLink, ShieldCheck } from 'lucide-react';

const AISettingsModal = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [settings, setSettings] = useState({
    engine: 'autonomous',
    model: 'gemini-2.5-flash',
    has_api_key: false,
    status: 'autonomous_mode',
    message: ''
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      setTestResult(null);
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    const res = await getAISettings();
    if (res?.data) {
      setSettings(res.data);
      setSelectedModel(res.data.model || 'gemini-2.5-flash');
    }
    setLoading(false);
  };

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await updateAISettings(apiKeyInput.trim(), selectedModel);
      if (res?.data) {
        setSettings(res.data);
        setTestResult({
          success: true,
          message: res.data.has_api_key 
            ? 'Connected successfully to Google Gemini Live API! ChatGPT-style intelligence is now active.'
            : 'Saved in Autonomous Conversational Engine mode. All mental health responses remain active.'
        });
        if (onSettingsUpdated) onSettingsUpdated(res.data);
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Could not connect: ' + e.message
      });
    }
    setTesting(false);
  };

  if (!isOpen) return null;

  const isGeminiActive = settings.has_api_key || settings.engine === 'gemini';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center space-x-2">
                <span>Sarajeevi AI Model & Engine Settings</span>
              </h2>
              <p className="text-xs text-indigo-200">Configure Google Gemini LLM or Autonomous Neural Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          
          {/* Active Engine Status Card */}
          <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
            isGeminiActive 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
              : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
          }`}>
            <div className="mt-0.5">
              {isGeminiActive ? (
                <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {isGeminiActive ? '🟢 Google Gemini 2.5 Flash Live LLM' : '⚡ Autonomous Conversational Engine'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                  {settings.status}
                </span>
              </div>
              <p className="text-[11px] mt-1 text-slate-600 leading-relaxed">
                {isGeminiActive 
                  ? 'Genuine, multi-turn fluid generative intelligence via official google-genai SDK. Contextual memory and Socratic clinical grounding active.'
                  : 'Built-in multi-turn conversational intelligence. Answers questions, provides CBT grounding, and handles legal/threat situations without external API dependencies.'}
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Google Gemini API Key (Optional)</span>
              </label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 underline text-[11px]"
              >
                <span>Get Free Key (30s)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder={settings.has_api_key ? "•••••••••••••••••••••••••••• (API Key Active)" : "Paste your Gemini API key (AIzaSy...)"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <p className="text-[10px] text-slate-400">
              Keys are securely stored in your local environment and used strictly for conversational inferences.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Target Generative Model:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-flash')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'gemini-2.5-flash' 
                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <p className="text-xs">gemini-2.5-flash</p>
                <p className="text-[10px] text-slate-400 font-normal">Ultra-fast, high empathy (Recommended)</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-3.7-flash')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedModel === 'gemini-3.7-flash' 
                    ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-xs' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <p className="text-xs">gemini-3.7-flash</p>
                <p className="text-[10px] text-slate-400 font-normal">Advanced reasoning & multimodal</p>
              </button>
            </div>
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={testing}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/25 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>{testing ? 'Testing Connection...' : 'Save & Activate Engine'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AISettingsModal;
