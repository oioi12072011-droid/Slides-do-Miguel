import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'default' | 'cyber-red' | 'cyber-purple' | 'matrix-clean';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('slides-theme');
    return (saved as Theme) || 'default';
  });

  useEffect(() => {
    localStorage.setItem('slides-theme', theme);
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-cyber-red', 'theme-cyber-purple', 'theme-matrix-clean');
    
    // Add selected theme class
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
