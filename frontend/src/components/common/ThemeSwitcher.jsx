import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Sparkles } from 'lucide-react';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div 
      className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner"
      title="Choose Background UI: Clinical Blue vs Midnight Black"
    >
      <button
        type="button"
        onClick={() => toggleTheme('blue')}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'blue'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-cyan-300"></span>
        <span className="hidden sm:inline">Clinical</span> Blue
      </button>

      <button
        type="button"
        onClick={() => toggleTheme('black')}
        className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'black'
            ? 'bg-slate-900 text-white shadow-xs border border-slate-700'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        <span className="hidden sm:inline">Midnight</span> Black
      </button>
    </div>
  );
};

export default ThemeSwitcher;
