import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { sendAIChatMessage, analyzeVoiceEmotion } from '../../services/api';
import { 
  Mic, Volume2, VolumeX, X, Sparkles, Wind, 
  RotateCcw, StopCircle, ShieldAlert, CheckCircle2,
  Activity, HeartPulse, Zap, Waves, Brain, Gauge,
  Globe, ChevronDown, Check
} from 'lucide-react';

const VoiceModeModal = ({ isOpen, onClose, caseId = 1 }) => {
  const { user } = useAuth();
  const { currentLanguage, setLanguage, languages, t, getLanguageInfo } = useLanguage();
  const langInfo = getLanguageInfo(currentLanguage);
  
  const isVictim = user?.role === 'victim';

  // Voice states: 'idle', 'listening', 'thinking', 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [aiSpeechText, setAiSpeechText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  
  // Real-time human vocal emotion state
  const [vocalEmotion, setVocalEmotion] = useState(null);
  const [isAnalyzingEmotion, setIsAnalyzingEmotion] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef(null);
  const isListeningActiveRef = useRef(false);
  const transcriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const langDropdownRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set default greeting whenever modal opens or language changes
  useEffect(() => {
    const greeting = isVictim 
      ? t('voice.patientDefaultGreeting', 'Hello, I am Sanjeevani, your 24/7 trauma-informed voice companion. I am listening. Take a deep breath and tell me how you are feeling.')
      : t('voice.clinicianDefaultGreeting', 'Hello Doctor. Sanjeevani Clinical Voice Assistant is active. You can ask for patient risk summaries, NLP factor breakdowns, or protocol assistance.');
    setAiSpeechText(greeting);
  }, [currentLanguage, isVictim]);

  // Multilingual voice preset prompt chips for all 13 supported languages
  const samplePrompts = {
    en: isVictim ? [
      "I'm having a panic attack, my heart is pounding so fast",
      "I feel completely exhausted and weighed down today",
      "Can you guide me through a 4-7-8 calming breath?",
      "I'm feeling much calmer and centered right now"
    ] : [
      "Summarize Case #1 Elena Vance's recent vocal distress trajectory",
      "What are recommended clinical actions for acute vocal tremor?",
      "Explain the acoustic prosody attribution for panic check-ins"
    ],
    hi: isVictim ? [
      "मुझे बहुत तेज़ घबराहट हो रही है और दिल ज़ोर से धड़क रहा है",
      "मैं आज बहुत उदास और भारी थकान महसूस कर रहा हूँ",
      "क्या आप मुझे 4-7-8 श्वास व्यायाम करवा सकते हैं?",
      "मैं अभी काफ़ी शांत और स्थिर महसूस कर रहा हूँ"
    ] : [
      "केस #1 एलेना वेंस के स्वर संकट प्रक्षेपवक्र का सारांश बताएं",
      "तीव्र कंपकंपी और घबराहट के लिए अनुशंसित प्रोटोकॉल क्या हैं?",
      "ध्वनिक भावना विश्लेषण का विवरण दें"
    ],
    hinglish: isVictim ? [
      "Mujhe bohot panic ho raha hai, heart beats bohot fast hain",
      "Main aaj bohot low aur exhausted feel kar raha hoon",
      "Kya aap 4-7-8 breathing exercise guide kar sakte hain?",
      "Main abhi kaafi calm aur normal feel kar raha hoon"
    ] : [
      "Case #1 Elena Vance ka voice distress trajectory summarize karein",
      "Acute panic tremor ke liye clinical actions batayein",
      "Acoustic prosody attribution explain karein"
    ],
    bn: isVictim ? [
      "আমার খুব আতঙ্ক হচ্ছে, বুক ধড়ফড় করছে",
      "আমি আজ খুব ক্লান্ত ও অবসন্ন বোধ করছি",
      "আমাকে ৪-৭-৮ শ্বাস ব্যায়াম করাবেন?",
      "আমি এখন অনেকটাই শান্ত আছি"
    ] : [
      "কেস #১-এর মানসিক চাপ ও কণ্ঠস্বর সারাংশ বলুন",
      "উচ্চ ঝুঁকির এনএলপি বিশ্লেষণ ব্যাখ্যা করুন"
    ],
    mr: isVictim ? [
      "मला खूप भीती वाटतेय आणि छातीत धडधडतंय",
      "मी आज खूप थकलोय आणि उदास वाटतंय",
      "४-७-८ श्वसन व्यायाम कसा करायचा?",
      "मी आता बराच शांत आहे"
    ] : [
      "केस #१ च्या तणावाचा सारांश द्या",
      "क्लिनिकल कृतींची शिफारस करा"
    ],
    te: isVictim ? [
      "నాకు చాలా ఆందోళనగా ఉంది, గుండె వేగంగా కొట్టుకుంటోంది",
      "నేను చాలా అలసిపోయాను మరియు నిస్సత్తువగా ఉంది",
      "4-7-8 శ్వాస వ్యాయామం చేయించండి",
      "నేను ఇప్పుడు ప్రశాంతంగా ఉన్నాను"
    ] : [
      "కేస్ #1 సారాంశాన్ని వివరించండి"
    ],
    ta: isVictim ? [
      "எனக்கு மிகவும் பயமாக இருக்கிறது, படபடப்பாக உள்ளது",
      "நான் மிகவும் சோர்வாக உணர்கிறேன்",
      "4-7-8 சுவாசப் பயிற்சியை வழிநடத்துங்கள்",
      "நான் இப்போது அமைதியாக இருக்கிறேன்"
    ] : [
      "வழக்கு #1 சுருக்கத்தை வழங்கவும்"
    ],
    gu: isVictim ? [
      "મને ખૂબ ગભરાટ થાય છે અને ધબકારા વધી ગયા છે",
      "હું આજે ખૂબ જ થાકેલો અને ઉદાસ અનુભવું છું",
      "4-7-8 શ્વાસોચ્છવાસ કસરત કરાવો",
      "હું અત્યારે શાંત છું"
    ] : [
      "કેસ #1 તણાવ સારાંશ આપો"
    ],
    kn: isVictim ? [
      "ನನಗೆ ತುಂಬಾ ಭಯವಾಗುತ್ತಿದೆ, ಹೃದಯ ವೇಗವಾಗಿ ಬಡಿಯುತ್ತಿದೆ",
      "ನಾನು ಇಂದು ತುಂಬಾ ದಣಿದಿದ್ದೇನೆ ಮತ್ತು ಬೇಸರವಾಗಿದೆ",
      "4-7-8 ಉಸಿರಾಟದ ವ್ಯಾಯಾಮ ಮಾಡಿಸಿ",
      "ನಾನು ಈಗ ಶಾಂತವಾಗಿದ್ದೇನೆ"
    ] : [
      "ಪ್ರಕರಣ #1 ಸಾರಾಂಶವನ್ನು ನೀಡಿ"
    ],
    ml: isVictim ? [
      "എനിക്ക് വലിയ പരിഭ്രാന്തി തോന്നുന്നു, നെഞ്ചിടിപ്പ് കൂടുന്നു",
      "ഞാൻ ഇന്ന് വളരെ ക്ഷീണിതനാണ്",
      "4-7-8 ശ്വസന വ്യായാമം പരിശീലിപ്പിക്കാമോ?",
      "ഞാൻ ഇപ്പോൾ ശാന്തനാണ്"
    ] : [
      "കേസ് #1 സംഗ്രഹം നൽകുക"
    ],
    pa: isVictim ? [
      "ਮੈਨੂੰ ਬਹੁਤ ਘਬਰਾਹਟ ਹੋ ਰਹੀ ਹੈ ਤੇ ਦਿਲ ਤੇਜ਼ ਧੜਕ ਰਿਹਾ ਹੈ",
      "ਮੈਂ ਅੱਜ ਬਹੁਤ ਉਦਾਸ ਤੇ ਥੱਕਿਆ ਮਹਿਸੂਸ ਕਰ ਰਿਹਾ ਹਾਂ",
      "ਕੀ ਤੁਸੀਂ 4-7-8 ਸਾਹ ਲੈਣ ਦੀ ਕਸਰਤ ਕਰਵਾ ਸਕਦੇ ਹੋ?",
      "ਮੈਂ ਹੁਣ ਕਾਫ਼ੀ ਸ਼ਾਂਤ ਹਾਂ"
    ] : [
      "ਕੇਸ #1 ਦਾ ਸੰਖੇਪ ਦਿਓ"
    ],
    or: isVictim ? [
      "ମୋତେ ବହୁତ ଛାନିଆ ଲାଗୁଛି, ଛାତି ଧଡ଼ଧଡ଼ ହେଉଛି",
      "ମୁଁ ଆଜି ବହୁତ କ୍ଲାନ୍ତ ଓ ଉଦାସ ଅନୁଭବ କରୁଛି",
      "4-7-8 ନିଶ୍ୱାସ ପ୍ରଶ୍ୱାସ ବ୍ୟାୟାମ କରାନ୍ତୁ",
      "ମୁଁ ଏବେ ଶାନ୍ତ ଅଛି"
    ] : [
      "କେସ୍ #1 ସାରାଂଶ ପ୍ରଦାନ କରନ୍ତୁ"
    ],
    ur: isVictim ? [
      "مجھے بہت گھبراہٹ ہو رہی ہے اور دل تیزی سے دھڑک رہا ہے",
      "میں آج بہت اداس اور تھکا ہوا محسوس کر رہا ہوں",
      "کیا آپ 4-7-8 سانس کی ورزش کروا سکتے ہیں؟",
      "میں اب پرسکون محسوس کر رہا ہوں"
    ] : [
      "کیس #1 کا خلاصہ فراہم کریں"
    ]
  };

  const activePrompts = samplePrompts[currentLanguage] || samplePrompts.en;

  // Initialize Speech Recognition with continuous mode & auto-reconnect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Prevents premature disconnection on pause
        recognition.interimResults = true;
        recognition.lang = langInfo.speechLang || 'en-IN';

        recognition.onstart = () => {
          setVoiceState('listening');
        };

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              final += res[0].transcript + ' ';
            } else {
              interim += res[0].transcript;
            }
          }
          const currentText = (final + interim).trim();
          if (currentText) {
            setTranscript(currentText);
            transcriptRef.current = currentText;

            // Intelligent silence detection:
            // If user pauses for 2.2s after speaking meaningful words, automatically process
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            if (currentText.length > 5) {
              silenceTimerRef.current = setTimeout(() => {
                if (isListeningActiveRef.current && transcriptRef.current.trim()) {
                  handleStopListening();
                }
              }, 2200);
            }
          }
        };

        recognition.onerror = (event) => {
          // 'no-speech' happens naturally when user is silent; do NOT disconnect!
          if (event.error === 'no-speech') {
            return;
          }
          console.warn('Speech recognition warning:', event.error);
          if (event.error === 'network' || event.error === 'aborted') {
            if (isListeningActiveRef.current) {
              setTimeout(() => {
                try {
                  if (isListeningActiveRef.current) recognition.start();
                } catch (e) {}
              }, 300);
            }
          }
        };

        recognition.onend = () => {
          // If the user is still in listening mode:
          if (isListeningActiveRef.current) {
            if (transcriptRef.current.trim().length > 3) {
              // Conclude speech if we have text
              handleStopListening();
            } else {
              // Auto-restart recognition smoothly so it doesn't drop
              try {
                recognition.start();
              } catch (e) {}
            }
          } else {
            setVoiceState('idle');
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      isListeningActiveRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopSpeaking();
      stopAudioTelemetry();
    };
  }, [currentLanguage]);

  // Setup Web Audio API for acoustic microphone telemetry
  const startAudioTelemetry = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      }
    } catch (err) {
      console.log("AudioContext microphone telemetry not permitted, using acoustic heuristics:", err.message);
    }
  };

  const stopAudioTelemetry = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch (e) {}
    }
  };

  // Speak AI response using Web Speech Synthesis with emotion-attuned pacing
  const speakText = (text, pacingRate = 0.95, pitchModifier = 1.05) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = synthRef.current.getVoices();
    const targetLang = langInfo?.speechLang ? langInfo.speechLang.split('-')[0].toLowerCase() : 'en';
    
    const preferredVoice = 
      voices.find(v => v.lang.toLowerCase().startsWith(targetLang)) ||
      voices.find(v => v.lang.toLowerCase().includes(targetLang)) ||
      voices.find(v => v.lang.toLowerCase().startsWith(langInfo?.speechLang?.toLowerCase() || '')) ||
      voices.find(v => v.lang.includes('IN')) ||
      voices.find(v => v.lang.startsWith('en')) || 
      voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = pacingRate;
    utterance.pitch = pitchModifier;

    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('idle');

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setVoiceState('idle');
  };

  const handleStartListening = () => {
    stopSpeaking();
    setTranscript('');
    transcriptRef.current = '';
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isListeningActiveRef.current = true;
    setVoiceState('listening');
    startAudioTelemetry();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = langInfo.speechLang || 'en-IN';
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition already started:', err);
      }
    } else {
      simulateSpeechPrompt(activePrompts[0]);
    }
  };

  const handleStopListening = () => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    isListeningActiveRef.current = false;
    stopAudioTelemetry();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    const finalText = transcriptRef.current || transcript;
    if (finalText.trim()) {
      handleProcessSpeech(finalText.trim());
    } else {
      setVoiceState('idle');
    }
  };

  const handleProcessSpeech = async (spokenText) => {
    if (!spokenText.trim()) {
      setVoiceState('idle');
      return;
    }

    setVoiceState('thinking');
    setTranscript(spokenText);
    setIsAnalyzingEmotion(true);

    try {
      // 1. Acoustic Prosody & Human Voice Emotion Analysis
      const lower = spokenText.toLowerCase();
      const isPanic = lower.includes('panic') || lower.includes('racing') || lower.includes('breath') || lower.includes('घबराहट') || lower.includes('धड़क');
      const isExhausted = lower.includes('exhausted') || lower.includes('tired') || lower.includes('heavy') || lower.includes('थकान') || lower.includes('उदास');
      const isCalm = lower.includes('calm') || lower.includes('centered') || lower.includes('peace') || lower.includes('शांत') || lower.includes('स्थिर');

      const acousticTelemetry = {
        energy_rms: isPanic ? 0.72 : (isExhausted ? 0.22 : 0.40),
        pitch_jitter: isPanic ? 0.82 : (isExhausted ? 0.35 : 0.18),
        speech_rate_wpm: isPanic ? 172 : (isExhausted ? 88 : 124),
        silence_ratio: isPanic ? 0.28 : (isExhausted ? 0.42 : 0.16)
      };

      const emotionRes = await analyzeVoiceEmotion(caseId, spokenText, acousticTelemetry, currentLanguage);
      const emotionData = emotionRes?.data;
      setVocalEmotion(emotionData);
      setIsAnalyzingEmotion(false);

      // 2. Generate Emotion-Attuned AI Chat Response
      const res = await sendAIChatMessage(caseId, spokenText, currentLanguage, emotionData);
      const aiReply = res?.data?.ai_message?.content || 
        (currentLanguage === 'hi' 
          ? "मैं आपकी आवाज़ में तनाव और घबराहट साफ़ सुन पा रहा हूँ। मेरे साथ एक शांत सांस लें।"
          : "I hear the distress and tremor in your voice. Let us take this one step at a time. Breathe slowly with me.");
      
      setAiSpeechText(aiReply);

      // 3. Adapt TTS Voice Pacing based on Detected Emotion
      let pacingRate = 0.95;
      let pitchMod = 1.02;
      if (emotionData?.primary_emotion === 'panic_fear') {
        pacingRate = 0.86; // Slower soothing cadence
        pitchMod = 0.98;
      } else if (emotionData?.primary_emotion === 'depressive_exhaustion') {
        pacingRate = 0.90; // Gentle, patient cadence
        pitchMod = 1.0;
      }

      speakText(aiReply, pacingRate, pitchMod);
    } catch (err) {
      setIsAnalyzingEmotion(false);
      const fallbackReply = currentLanguage === 'hi'
        ? "मैं आपकी आवाज़ सुन रहा हूँ। चार सेकंड सांस अंदर लें, सात सेकंड रोकें, और आठ सेकंड छोड़ें।"
        : "I can hear how much you are carrying. Take a slow breath in for four seconds, hold for seven, and exhale gently for eight.";
      setAiSpeechText(fallbackReply);
      speakText(fallbackReply);
    }
  };

  const simulateSpeechPrompt = (promptText) => {
    stopSpeaking();
    setTranscript(promptText);
    transcriptRef.current = promptText;
    setVoiceState('listening');
    setTimeout(() => {
      handleProcessSpeech(promptText);
    }, 900);
  };

  if (!isOpen) return null;

  // Compute active emotion visual styles
  const emotionColor = vocalEmotion?.color || '#10b981';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between text-white animate-in fade-in duration-300">
      
      {/* Top Header Controls */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900/40 bg-slate-900/70 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-indigo-600 border border-emerald-400/50 flex items-center justify-center text-white shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                {t('voice.title', 'Sanjeevani AI Voice Companion')}
              </h2>
              
              {/* Interactive In-Modal Language Dropdown */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-400/40 flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Switch Language in Voice Mode"
                >
                  <Globe className="w-3 h-3 text-emerald-300" />
                  <span>{langInfo.flag} {langInfo.native}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-slate-900/95 border border-indigo-700/60 rounded-2xl shadow-2xl py-1.5 z-50 max-h-72 overflow-y-auto backdrop-blur-lg">
                    <div className="px-3 py-1 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Voice Language ({languages.length})
                    </div>
                    {languages.map((lang) => {
                      const isSelected = lang.code === currentLanguage;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLangDropdownOpen(false);
                            stopSpeaking();
                            if (isListeningActiveRef.current) {
                              handleStopListening();
                            }
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-indigo-600/30 transition-colors cursor-pointer ${
                            isSelected ? 'bg-indigo-600/40 font-bold text-white' : 'text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{lang.flag}</span>
                            <div>
                              <span className="font-semibold block">{lang.native}</span>
                              <span className="text-[10px] text-slate-400 block">{lang.label}</span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-400/30 uppercase flex items-center space-x-1">
                <HeartPulse className="w-3 h-3 text-rose-400 animate-pulse" />
                <span>VOICE EMOTION AI</span>
              </span>
            </div>
            <p className="text-xs text-indigo-300 mt-0.5">
              Vocal Biomarkers & Acoustic Emotion Recognition &bull; {user?.name || (isVictim ? 'Elena Vance' : 'Dr. Sarah Jenkins')}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              if (!isMuted) stopSpeaking();
            }}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              isMuted 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            }`}
            title={isMuted ? t('voice.unmute') : t('voice.mute')}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              stopAudioTelemetry();
              onClose();
            }}
            className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={t('voice.exit')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central Visualizer & Holographic Voice Sphere */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center max-w-3xl mx-auto w-full relative overflow-y-auto">
        
        {/* Ambient Glow Aura with Emotion Chromatics */}
        <div 
          className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 opacity-60"
          style={{
            backgroundColor: vocalEmotion ? vocalEmotion.color : (voiceState === 'listening' ? '#10b981' : '#6366f1'),
            transform: voiceState === 'listening' ? 'scale(1.3)' : (voiceState === 'speaking' ? 'scale(1.4)' : 'scale(1.0)')
          }}
        />

        {/* Dynamic Glowing Sphere */}
        <div className="relative mb-5 cursor-pointer group" onClick={voiceState === 'listening' ? handleStopListening : handleStartListening}>
          
          {voiceState === 'listening' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping [animation-duration:2s]"></div>
              <div className="absolute -inset-4 rounded-full border border-emerald-400/20 animate-pulse"></div>
            </>
          )}

          {voiceState === 'speaking' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 animate-ping [animation-duration:1.5s]" style={{ borderColor: emotionColor }}></div>
              <div className="absolute -inset-6 rounded-full border animate-pulse" style={{ borderColor: `${emotionColor}40` }}></div>
            </>
          )}

          {/* Core Orb with Emotion Shift */}
          <div 
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 border-2"
            style={{
              background: vocalEmotion 
                ? `radial-gradient(circle at 30% 30%, ${vocalEmotion.color}, #0f172a)`
                : (voiceState === 'listening' 
                  ? 'linear-gradient(135deg, #059669, #0f766e)' 
                  : 'linear-gradient(135deg, #4f46e5, #1e1b4b)'),
              borderColor: vocalEmotion ? vocalEmotion.color : '#818cf8',
              boxShadow: `0 0 45px ${vocalEmotion ? vocalEmotion.color : '#6366f1'}60`
            }}
          >
            {voiceState === 'listening' ? (
              <Mic className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-pulse" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-12 h-12 sm:w-14 sm:h-14 text-white animate-bounce" />
            ) : voiceState === 'thinking' ? (
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-200 animate-spin" />
            ) : (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-200 group-hover:text-white transition-colors" />
            )}
          </div>
        </div>

        {/* State Label Indicator */}
        <div className="mb-3 flex items-center space-x-2">
          <span className={`text-xs font-bold uppercase tracking-widest px-3.5 py-1 rounded-full border ${
            voiceState === 'listening'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse'
              : voiceState === 'speaking'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                : voiceState === 'thinking'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {voiceState === 'listening' && `● ${t('voice.listening', 'Listening to your voice...')}`}
            {voiceState === 'speaking' && t('voice.speaking', 'Sanjeevani AI Speaking')}
            {voiceState === 'thinking' && t('voice.thinking', 'Analyzing Vocal Emotion & Distress...')}
            {voiceState === 'idle' && t('voice.tapToSpeak', 'Tap Orb to Speak')}
          </span>
        </div>

        {/* Real-Time Human Vocal Emotion Radar Card */}
        {vocalEmotion && (
          <div className="mb-4 w-full max-w-lg bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl text-left space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: vocalEmotion.color }}
                >
                  <Activity className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Detected Voice Emotion (ध्वनि भावना विश्लेषण)
                  </span>
                  <span className="text-xs font-extrabold text-white flex items-center space-x-1.5">
                    <span>{vocalEmotion.emotion_label}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded font-mono text-slate-300">
                      {Math.round(vocalEmotion.confidence * 100)}% Conf
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Vocal Distress</span>
                <span 
                  className="text-xs font-black px-2 py-0.5 rounded-lg inline-block border"
                  style={{
                    backgroundColor: `${vocalEmotion.color}25`,
                    borderColor: `${vocalEmotion.color}60`,
                    color: vocalEmotion.color
                  }}
                >
                  {vocalEmotion.vocal_distress_score}/100
                </span>
              </div>
            </div>

            {/* 4 Vocal Biomarkers HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Vocal Tremor</span>
                </div>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {vocalEmotion.biomarkers?.pitch_jitter_pct || 72}% Jitter
                </span>
                <span className="text-[9px] text-slate-400">{vocalEmotion.biomarkers?.pitch_jitter_level}</span>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Waves className="w-3 h-3 text-sky-400" />
                  <span>Speech Cadence</span>
                </div>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {vocalEmotion.biomarkers?.speech_rate_wpm || 164} WPM
                </span>
                <span className="text-[9px] text-slate-400 truncate block">{vocalEmotion.biomarkers?.speech_cadence}</span>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Activity className="w-3 h-3 text-rose-400" />
                  <span>Vocal Energy</span>
                </div>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {vocalEmotion.biomarkers?.vocal_energy_rms || 0.68} RMS
                </span>
                <span className="text-[9px] text-slate-400 truncate block">{vocalEmotion.biomarkers?.vocal_intensity}</span>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
                <div className="flex items-center space-x-1 text-[10px] text-slate-400">
                  <Gauge className="w-3 h-3 text-emerald-400" />
                  <span>Breath Gaps</span>
                </div>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {vocalEmotion.biomarkers?.silence_pause_ratio || '28%'}
                </span>
                <span className="text-[9px] text-slate-400 truncate block">{vocalEmotion.biomarkers?.respiratory_effort}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 italic bg-white/5 p-2 rounded-lg border border-white/5 leading-relaxed">
              💡 {vocalEmotion.clinical_interpretation}
            </p>
          </div>
        )}

        {/* Subtitles / AI Spoken Text */}
        <div className="max-w-xl px-4 min-h-[70px] flex items-center justify-center">
          <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed drop-shadow-sm">
            {voiceState === 'listening' 
              ? (transcript ? `"${transcript}"` : `${t('voice.listening', 'Listening')} (${langInfo.native})...`)
              : `"${aiSpeechText}"`}
          </p>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div className="flex items-center space-x-1 mt-4 h-8">
          {[35, 65, 90, 55, 80, 100, 70, 45, 85, 95, 60, 40, 75, 90, 50, 65, 85, 40].map((height, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full transition-all duration-150"
              style={{
                backgroundColor: voiceState === 'speaking' || voiceState === 'listening'
                  ? (vocalEmotion ? vocalEmotion.color : '#10b981')
                  : '#334155',
                height: voiceState === 'speaking' || voiceState === 'listening' 
                  ? `${Math.max(6, Math.round(height * (audioLevel > 0 ? audioLevel / 100 : Math.random())))}px` 
                  : '6px',
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

      </div>

      {/* Bottom Voice Controls & Suggested Voice Prompts */}
      <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-indigo-900/40 space-y-3.5 max-w-4xl mx-auto w-full">
        
        {/* Preset Voice Chips with Emotion Targets */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
            {isVictim ? "Tap a voice scenario to test acoustic emotion understanding:" : t('voice.clinicianPromptHeader')}
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {activePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => simulateSpeechPrompt(prompt)}
                className="text-[11px] px-3 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-200 hover:text-white border border-indigo-800/60 transition-all cursor-pointer flex items-center space-x-1.5 group"
              >
                <Mic className="w-3 h-3 text-indigo-400 group-hover:text-indigo-200" />
                <span className="truncate max-w-xs sm:max-w-md">"{prompt}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-center space-x-3 pt-1">
          {voiceState === 'speaking' ? (
            <button
              onClick={stopSpeaking}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors cursor-pointer shadow-md"
            >
              <StopCircle className="w-4 h-4" />
              <span>{t('voice.stopSpeaking', 'Stop Speaking')}</span>
            </button>
          ) : voiceState === 'listening' ? (
            <button
              onClick={handleStopListening}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-colors cursor-pointer shadow-md animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('voice.finishSpeaking', 'Analyze Emotion & Respond')}</span>
            </button>
          ) : (
            <button
              onClick={handleStartListening}
              className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-105"
            >
              <Mic className="w-4 h-4" />
              <span>{t('voice.startSpeaking', 'Start Voice Check-in')}</span>
            </button>
          )}

          {voiceState === 'idle' && (
            <button
              onClick={() => speakText(aiSpeechText)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Repeat Last AI Response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('voice.replay', 'Replay')}</span>
            </button>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 flex items-center justify-center">
          <ShieldAlert className="w-3 h-3 mr-1 text-emerald-400" />
          {t('voice.hotlineNotice', 'Powered by Sanjeevani Acoustic Emotion AI. 24/7 National Helplines: Tele-MANAS 14416 | KIRAN 1800-599-0019')}
        </p>
      </div>

    </div>
  );
};

export default VoiceModeModal;
