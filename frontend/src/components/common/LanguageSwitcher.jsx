import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LanguageSwitcher = () => {
  const { currentLanguage, setLanguage, languages, getLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = getLanguageInfo(currentLanguage);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Language Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        title="Choose Language (भाषा चुनें)"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-600 group-hover:rotate-12 transition-transform" />
        <span className="text-sm">{activeLang.flag}</span>
        <span className="hidden md:inline text-slate-800">{activeLang.native}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Language / भाषा
            </span>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
              {languages.length} Languages
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {languages.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                    isSelected ? 'bg-indigo-50/80 font-bold text-indigo-700' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-[13px]">{lang.native}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{lang.label}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
