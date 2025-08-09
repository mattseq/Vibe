import React, { createContext, useState, useEffect } from 'react';
import { saveTheme, loadTheme } from '../storage/themeStorage.js';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  // load saved theme when app starts
  useEffect(() => {
    (async () => {
      const storedTheme = await loadTheme();
      setTheme(storedTheme);
    })();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    saveTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
