import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    localStorage.setItem('fraudtrace_theme', 'light');
  }, [theme]);

  const toggleTheme = () => {
    setTheme('light');
  };

  return (
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme }}>
        <div data-theme="light" className="light-mode">
          {children}
        </div>
      </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

