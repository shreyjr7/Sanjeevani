import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Available themes: 'blue' (Clinical Blue) or 'black' (Midnight Black)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('novaflow_theme') || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('novaflow_theme', theme);
    const root = document.documentElement;
    if (theme === 'black') {
      root.classList.add('theme-black');
      root.classList.remove('theme-blue');
    } else {
      root.classList.add('theme-blue');
      root.classList.remove('theme-black');
    }
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (newTheme) {
      setTheme(newTheme);
    } else {
      setTheme(prev => prev === 'blue' ? 'black' : 'blue');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isBlack: theme === 'black', isBlue: theme === 'blue' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
