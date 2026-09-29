import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getChatMessages, sendAIChatMessage, sendTherapistMessage } from '../../services/api';
import { 
  MessageSquare, X, Maximize2, Bot, User, Send, Sparkles, Wind, 
  ShieldAlert, ChevronDown, Check, RefreshCw 
} from 'lucide-react';

const FloatingChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [channel, setChannel] = useState('ai_companion'); // 'ai_companion' or 'therapist_direct'
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const caseId = user?.caseId || 1;
  const counsellorName = "Dr. Sarah Jenkins";

  // Hide floating widget if we are already on the full /chat page
  const isChatPage = location.pathname === '/chat';

  useEffect(() => {
    if (isOpen) {
      getChatMessages(caseId, channel).then(res => {
        if (res?.data) setMessages(res.data);
      });
    }
  }, [isOpen, channel, caseId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  if (!isAuthenticated || isChatPage) return null;

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const text = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    if (channel === 'ai_companion') {
      const tempUserMsg = {
        id: Date.now(),
        sender_role: "user",
        sender_name: user?.name || "Me",
        content: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      const res = await sendAIChatMessage(caseId, text);
      setIsTyping(false);
      if (res?.data?.ai_message) {
        setMessages(prev => [...prev, res.data.ai_message]);
      }
    } else {
      const tempUserMsg = {
        id: Date.now(),
        sender_role: user?.role === 'counsellor' ? 'therapist' : 'user',
        sender_name: user?.name || "Me",
        content: text,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      await sendTherapistMessage(caseId, text, "therapist_direct");
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Popup Modal */}
      {isOpen && (
        <div className="mb-3 w-[360px] sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                {channel === 'ai_companion' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center">
                  {channel === 'ai_companion' ? 'Sarajeevi AI Companion' : counsellorName}
                  <span className="w-2 h-2 bg-emerald-400 rounded-full ml-2"></span>
                </h3>
                <p className="text-[10px] text-slate-300">
                  {channel === 'ai_companion' ? 'Trauma-informed 24/7 care' : 'Assigned Clinical Specialist'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => { setIsOpen(false); navigate('/chat'); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Expand to Full Page"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                title="Minimize"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex bg-slate-100 p-1 border-b border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setChannel('ai_companion')}
              className={`flex-1 py-1.5 text-center rounded-md transition-all ${
                channel === 'ai_companion' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🤖 Sarajeevi AI
            </button>
            <button
              onClick={() => setChannel('therapist_direct')}
              className={`flex-1 py-1.5 text-center rounded-md transition-all ${
                channel === 'therapist_direct' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              👨‍⚕️ Dr. Sarah (Therapist)
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-slate-50/50 text-xs">
            {messages.map((m, idx) => {
              const isMe = m.sender_role === 'user';
              return (
                <div key={m.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl shadow-2xs leading-relaxed ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-br-xs' 
                      : m.sender_role === 'therapist'
                      ? 'bg-white border-2 border-emerald-300 text-slate-800 rounded-bl-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}>
                    <p className="whitespace-pre-line text-[11px]">{m.content}</p>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center space-x-1.5 text-slate-400 text-xs py-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Grounding Action */}
          <div className="px-3 py-1.5 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-800 font-medium">
            <span className="flex items-center">
              <Wind className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Need to decompress?
            </span>
            <button
              onClick={() => { setIsOpen(false); navigate('/chat'); }}
              className="text-indigo-600 hover:text-indigo-800 font-bold underline"
            >
              Start Breathing Pacer &rarr;
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder={channel === 'ai_companion' ? "Ask Sarajeevi AI for support or grounding..." : "Message Dr. Sarah..."}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2.5 bg-linear-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 border border-indigo-400/30 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-xs font-bold tracking-wide">
            Support Chat &bull; AI & Therapist
          </span>
        </button>
      )}
    </div>
  );
};

export default FloatingChatWidget;
