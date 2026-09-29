import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getChatMessages, sendAIChatMessage, sendTherapistMessage, clearChatHistory } from '../services/api';
import AISettingsModal from '../components/chat/AISettingsModal';
import { Card, Button, Badge } from '../components/ui/components';
import { formatDate, formatTime } from '../utils/dateUtils';
import VoiceModeModal from '../components/voice/VoiceModeModal';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { 
  Bot, User, Send, Sparkles, Phone, ShieldAlert, Heart, Wind, Settings, RotateCcw, Shield, 
  CheckCircle, Clock, RefreshCw, AlertTriangle, ArrowRight, MessageSquare,
  Mic, Volume2, VolumeX, PlusCircle
} from 'lucide-react';

const Chat = () => {
  const { user } = useAuth();
  const { t, language, currentLanguage, getLanguageInfo } = useLanguage();
  const langInfo = getLanguageInfo(currentLanguage || language);
  const [channel, setChannel] = useState('ai_companion'); // 'ai_companion' or 'therapist_direct'
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('Inhale'); // Inhale, Hold, Exhale
  const [breathingTimer, setBreathingTimer] = useState(4);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListeningDictation, setIsListeningDictation] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);

  const getLocalizedWelcome = (lang = 'en') => {
    const greetings = {
      hi: "नमस्ते। मैं संजीवनी हूँ, राष्ट्रीय हेल्पलाइन (14566) के अंतर्गत आपकी 24/7 सुरक्षित साथी। मैं आपकी बात सुनने के लिए तैयार हूँ। आज आप कैसा महसूस कर रहे हैं?",
      hinglish: "Namaste! Main Sanjeevani hoon — 14566 framework ke tahat aapka 24/7 companion. Main yahin hoon aapki baat sunne ke liye. Aaj aap kaisa mehsoos kar rahe hain?",
      bn: "নমস্কার। আমি সঞ্জীবনী, জাতীয় হেল্পলাইন (১৪৫৬৬) কাঠামোর অধীনে আপনার ২৪/৭ সহচর। আজ আপনি কেমন অনুভব করছেন?",
      mr: "नमस्कार। मी संजीवनी आहे, राष्ट्रीय हेल्पलाइन (१४५६६) अंतर्गत आपली २४/७ साथीदार। आज आपल्याला कसे वाटत आहे?",
      te: "నమస్కారం. నేను సంజీవని, జాతీయ హెల్ప్‌లైన్ (14566) ఆధ్వర్యంలో మీ 24/7 సహాయకురాలిని. ఈరోజు మీరు ఎలా భావిస్తున్నారు?",
      ta: "வணக்கம். நான் சஞ்சீவனி, தேசிய உதவி எண் (14566) கட்டமைப்பின் கீழ் உங்கள் 24/7 தோழர். இன்று நீங்கள் எப்படி உணர்கிறீர்கள்?",
      gu: "નમસ્તે. હું સંજીવની છું, રાષ્ટ્રીય હેલ્પલાઇન (14566) હેઠળ તમારી 24/7 સાથી. આજે તમે કેવું અનુભવી રહ્યા છો?",
      kn: "ನಮಸ್ಕಾರ. ನಾನು ಸಂಜೀವನಿ, ರಾಷ್ಟ್ರೀಯ ಸಹಾಯವಾಣಿ (14566) ಅಡಿಯಲ್ಲಿ ನಿಮ್ಮ 24/7 ಒಡನಾಡಿ. ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ?",
      ml: "നമസ്കാരം. ഞാൻ സഞ്ജീവനി, ദേശീയ ഹെൽപ്പ്‌ലൈൻ (14566) ചട്ടക്കൂടിലെ നിങ്ങളുടെ 24/7 കൂട്ടുകാരി. ഇന്ന് നിങ്ങൾക്ക് എങ്ങനെയുണ്ട്?",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ। ਮੈਂ ਸੰਜੀਵਨੀ ਹਾਂ, ਨੈਸ਼ਨਲ ਹੈਲਪਲਾਈਨ (14566) ਅਧੀਨ ਤੁਹਾਡੀ 24/7 ਸਾਥੀ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਮਹਿਸੂਸ ਕਰ ਰਹੇ ਹੋ?",
      or: "ନମସ୍କାର। ମୁଁ ସଞ୍ଜୀବନୀ, ଜାତୀୟ ହେଲ୍ପଲାଇନ (୧୪୫୬୬) ଅଧୀନରେ ଆପଣଙ୍କ ୨୪/୭ ସାଥୀ। ଆଜି ଆପଣ କିପରି ଅନୁଭବ କରୁଛନ୍ତି?",
      ur: "سلام۔ میں سنجیوانی ہوں، نیشنل ہیلپ لائن (14566) فریم ورک کے تحت آپ کی 24/7 ساتھی۔ آج آپ کیسا محسوس کر رہے ہیں؟",
      en: "Namaste. I am Sanjeevani, your trauma-informed companion under the National Helpline Against Atrocities (14566) framework. I am here with you 24/7. How are you feeling today?"
    };
    return greetings[lang] || greetings.en;
  };

  const handleClearChat = async () => {
    const confirmText = t('chat.newChatConfirm') || "Start a fresh new chat session? This will clear previous test messages and start with a clean slate.";
    if (window.confirm(confirmText)) {
      setIsClearingChat(true);
      try {
        await clearChatHistory(caseId, channel);
        const welcomeText = getLocalizedWelcome(currentLanguage || language);
        setMessages([{
          id: Date.now(),
          sender_role: "ai",
          sender_name: "Sanjeevani AI",
          content: welcomeText,
          created_at: new Date().toISOString()
        }]);
      } catch (err) {
        console.error("Failed to start new chat:", err);
      } finally {
        setIsClearingChat(false);
      }
    }
  };

  const renderFormattedContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start space-x-2 ml-1">
                <span className="text-indigo-500 font-bold">&bull;</span>
                <span>{formatBoldSpans(line.substring(2))}</span>
              </div>
            );
          }
          const numMatch = line.match(/^(\d+\.)\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start space-x-2 ml-1">
                <span className="font-semibold text-indigo-600">{numMatch[1]}</span>
                <span>{formatBoldSpans(numMatch[2])}</span>
              </div>
            );
          }
          return <p key={idx}>{formatBoldSpans(line)}</p>;
        })}
      </div>
    );
  };

  const formatBoldSpans = (text) => {
    const parts = text.split(/(\**.*?\**)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };
  const messagesEndRef = useRef(null);

  const caseId = user?.caseId || 1;
  const counsellorName = "Dr. Sarah Jenkins";

  const loadMessages = async () => {
    setLoading(true);
    const res = await getChatMessages(caseId, channel);
    if (res?.data) {
      setMessages(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, [channel, caseId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Breathing pacer animation cycle (4s Inhale -> 7s Hold -> 8s Exhale)
  useEffect(() => {
    if (!breathingActive) return;
    let seconds = breathingTimer;
    const interval = setInterval(() => {
      seconds -= 1;
      if (seconds > 0) {
        setBreathingTimer(seconds);
      } else {
        if (breathingPhase === 'Inhale') {
          setBreathingPhase('Hold');
          setBreathingTimer(7);
          seconds = 7;
        } else if (breathingPhase === 'Hold') {
          setBreathingPhase('Exhale');
          setBreathingTimer(8);
          seconds = 8;
        } else {
          setBreathingPhase('Inhale');
          setBreathingTimer(4);
          seconds = 4;
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [breathingActive, breathingPhase, breathingTimer]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    setInputMessage('');
    setIsTyping(true);

    if (channel === 'ai_companion') {
      const tempUserMsg = {
        id: Date.now(),
        sender_role: "user",
        sender_name: user?.name || "Me",
        content: textToSend,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      try {
        const res = await sendAIChatMessage(caseId, textToSend, language, null);
        if (res?.data) {
          const aiMsg = res.data.ai_message;
          setMessages(prev => [...prev, aiMsg]);

          if (res.data.grounding_exercise) {
            setBreathingActive(true);
          }
        }
      } catch (e) {
        console.error("AI send error:", e);
      }
    } else {
      const tempMsg = {
        id: Date.now(),
        sender_role: user?.role === 'counsellor' ? "therapist" : "user",
        sender_name: user?.name || (user?.role === 'counsellor' ? counsellorName : "Me"),
        content: textToSend,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);

      try {
        await sendTherapistMessage(caseId, textToSend, 'therapist_direct');
      } catch (e) {
        console.error("Doctor send error:", e);
      }
    }

    setIsTyping(false);
  };

  // Text-to-speech for any AI message
  const handleSpeakMessage = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const targetLang = langInfo?.speechLang ? langInfo.speechLang.split('-')[0].toLowerCase() : 'en';
      const preferredVoice = 
        voices.find(v => v.lang.toLowerCase().startsWith(targetLang)) ||
        voices.find(v => v.lang.toLowerCase().includes(targetLang)) ||
        voices.find(v => v.lang.toLowerCase().startsWith(langInfo?.speechLang?.toLowerCase() || '')) ||
        voices.find(v => v.lang.includes('IN')) ||
        voices.find(v => v.lang.startsWith('en')) || 
        voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Mic dictation toggle with active language calibration
  const toggleDictation = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        if (isListeningDictation) {
          setIsListeningDictation(false);
        } else {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = langInfo?.speechLang || 'en-IN';

            recognition.onstart = () => setIsListeningDictation(true);
            recognition.onresult = (event) => {
              const transcript = event.results[0][0].transcript;
              setInputMessage(prev => prev ? `${prev} ${transcript}` : transcript);
              setIsListeningDictation(false);
            };
            recognition.onerror = (err) => {
              console.warn("Dictation error:", err);
              setIsListeningDictation(false);
            };
            recognition.onend = () => setIsListeningDictation(false);
            recognition.start();
          } catch (e) {
            setIsListeningDictation(false);
          }
        }
      } else {
        alert("Voice dictation is not supported by your current browser. Please try Chrome or Edge.");
      }
    }
  };

  const quickPrompts = [
    { label: "🧘 4-7-8 Breathing Pacer", action: () => setBreathingActive(!breathingActive) },
    { label: "🌿 5-4-3-2-1 Sensory Grounding", text: "Guide me through a 5-4-3-2-1 grounding exercise." },
    { label: "📊 Check My Current Distress", text: "What is my current distress level based on my check-ins?" },
    { label: "🆘 Crisis Hotline Information", text: "Please provide emergency crisis hotline numbers and support." }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      
      {/* Top Banner with Voice Mode CTA & Language Switcher */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl p-5 text-white shadow-md border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight">Interactive Care & Communication Hub</h1>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                AI + Clinician
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Talk directly to Sarajeevi AI Companion or your assigned clinician ({counsellorName})
            </p>
          </div>
        </div>

        {/* Action Controls: Language Switcher + New Chat + Launch Voice Mode */}
        <div className="flex items-center space-x-2.5 shrink-0 flex-wrap gap-2">
          <LanguageSwitcher />

          <button
            onClick={handleClearChat}
            disabled={isClearingChat}
            className="px-3.5 py-2.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 hover:text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs border border-emerald-400/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Start a fresh conversation session"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            <span>+ New Chat</span>
          </button>

          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-105 shrink-0 border border-indigo-400/30"
          >
            <Mic className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Launch AI Voice Mode</span>
          </button>
        </div>
      </div>

      {/* Breathing Pacer Banner */}
      {breathingActive && (
        <div className="bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white border border-teal-500/40 shadow-md animate-in fade-in duration-300 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-1000 ${
                breathingPhase === 'Inhale' 
                  ? 'bg-teal-500 scale-125 shadow-lg shadow-teal-500/50' 
                  : breathingPhase === 'Hold' 
                    ? 'bg-amber-500 scale-125 shadow-lg shadow-amber-500/50' 
                    : 'bg-indigo-500 scale-95 shadow-md shadow-indigo-500/30'
              }`}>
                <Wind className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal-300">
                  Trauma-Informed 4-7-8 Breathing Pacer
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {breathingPhase}: <span className="text-teal-300">{breathingTimer}s</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {breathingPhase === 'Inhale' && 'Breathe in slowly through your nose... expanding your diaphragm.'}
                  {breathingPhase === 'Hold' && 'Hold gently. Allow your autonomic nervous system to stabilize.'}
                  {breathingPhase === 'Exhale' && 'Exhale completely through your mouth with a soft whoosh sound.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setBreathingActive(false)}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Interface Card */}
      <Card className="p-0 overflow-hidden shadow-sm flex flex-col h-[600px]">
        
        {/* Channel Switcher Header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex space-x-2">
            <button
              onClick={() => setChannel('ai_companion')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                channel === 'ai_companion'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{t('chat.channelAI') || 'Sarajeevi AI Companion (24/7)'}</span>
            </button>

            <button
              onClick={() => setChannel('therapist_direct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                channel === 'therapist_direct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{user?.role === 'counsellor' ? 'Patient Messages' : `Dr. Sarah Jenkins`}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {channel === 'ai_companion' && (
              <>
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={isClearingChat}
                  className="text-xs px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 hover:text-white rounded-xl font-bold border border-emerald-500/50 transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Start a fresh conversation session"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ New Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-semibold border border-slate-700 transition-colors flex items-center space-x-1 cursor-pointer"
                  title="Configure AI Engine & Gemini API Key"
                >
                  <Settings className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">AI Settings</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="text-xs px-2.5 py-1 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 hover:text-white rounded-lg font-bold border border-indigo-400/30 transition-colors flex items-center space-x-1 cursor-pointer"
              title="Open Voice Model"
            >
              <Mic className="w-3 h-3 text-amber-300" />
              <span>Voice</span>
            </button>

            <button
              onClick={loadMessages}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh messages"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((msg, i) => {
            const isUser = msg.sender_role === 'user';
            const isAI = msg.sender_role === 'ai';
            const isTherapist = msg.sender_role === 'therapist';

            return (
              <div 
                key={msg.id || i}
                className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    isAI ? 'bg-indigo-600' : 'bg-emerald-600'
                  }`}>
                    {isAI ? <Bot className="w-4 h-4" /> : 'SJ'}
                  </div>
                )}

                <div className={`max-w-lg rounded-2xl p-4 shadow-2xs text-xs leading-relaxed ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-br-xs' 
                    : isTherapist
                    ? 'bg-white border-2 border-emerald-300 text-slate-800 rounded-bl-xs'
                    : msg.is_crisis_flagged
                    ? 'bg-rose-50 border border-rose-300 text-rose-950 rounded-bl-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[10px] mb-1 font-semibold opacity-75">
                    <span>{msg.sender_name}</span>
                    <div className="flex items-center space-x-2">
                      <span>{formatTime(msg.created_at)}</span>
                      {isAI && (
                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.content)}
                          className="hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Read Aloud with Voice Synthesis"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isAI ? renderFormattedContent(msg.content) : <p className="whitespace-pre-line text-[13px]">{msg.content}</p>}

                  {msg.is_crisis_flagged && (
                    <div className="mt-2 pt-2 border-t border-rose-200 flex items-center text-[11px] text-rose-700 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
                      Crisis indicators flagged & escalated to clinical lead.
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center space-x-2 text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs flex items-center space-x-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {channel === 'ai_companion' && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-500 shrink-0">Quick prompts:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (p.action) p.action();
                  else if (p.text) handleSendMessage(p.text);
                }}
                className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 rounded-full text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar with Dictation Mic */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder={channel === 'ai_companion' ? (t('chat.placeholderAI') || "Message Sarajeevi AI for support, grounding, or guidance...") : `Message ${counsellorName} directly...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            
            {/* Mic Dictation Button */}
            <button
              type="button"
              onClick={toggleDictation}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListeningDictation 
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
              title={isListeningDictation ? 'Listening to voice...' : 'Dictate with Microphone'}
            >
              <Mic className="w-4 h-4" />
            </button>

            <Button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="flex items-center px-4 py-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Send
            </Button>
          </form>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 px-1">
            <span>Press Enter to send or click Mic to dictate</span>
            <span>AI conversations monitored with clinical safety protocols.</span>
          </div>
        </div>

      </Card>

      {/* Voice Mode Modal */}
      <VoiceModeModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        caseId={caseId}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

    </div>
  );
};

export default Chat;
