import React, { createContext, useContext, useState } from 'react';
import { translations } from '../i18n/translations';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', flag: '🌐', speechLang: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', speechLang: 'hi-IN' },
  { code: 'hinglish', label: 'Hinglish', native: 'Hinglish', flag: '🇮🇳', speechLang: 'en-IN' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇮🇳', speechLang: 'bn-IN' },
  { code: 'mr', label: 'Marathi', native: 'मराठी', flag: '🇮🇳', speechLang: 'mr-IN' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', speechLang: 'te-IN' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', speechLang: 'ta-IN' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳', speechLang: 'gu-IN' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', speechLang: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', speechLang: 'ml-IN' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳', speechLang: 'pa-IN' },
  { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🇮🇳', speechLang: 'or-IN' },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇮🇳', speechLang: 'ur-IN' },
];

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    try {
      return localStorage.getItem('sanjeevani_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (langCode) => {
    if (translations[langCode] || SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      setCurrentLanguageState(langCode);
      try {
        localStorage.setItem('sanjeevani_lang', langCode);
      } catch (err) {
        console.error("Failed to save language preference:", err);
      }
    }
  };

  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');
    
    let currentObj = translations[currentLanguage];
    let found = true;
    for (const part of parts) {
      if (currentObj && typeof currentObj === 'object' && part in currentObj) {
        currentObj = currentObj[part];
      } else {
        found = false;
        break;
      }
    }
    if (found && typeof currentObj === 'string') {
      return currentObj;
    }

    let enObj = translations['en'];
    let enFound = true;
    for (const part of parts) {
      if (enObj && typeof enObj === 'object' && part in enObj) {
        enObj = enObj[part];
      } else {
        enFound = false;
        break;
      }
    }
    if (enFound && typeof enObj === 'string') {
      return enObj;
    }

    return fallback || path;
  };

  const getLanguageInfo = (code = currentLanguage) => {
    return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      language: currentLanguage,
      setLanguage,
      t,
      getLanguageInfo,
      languages: SUPPORTED_LANGUAGES
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
