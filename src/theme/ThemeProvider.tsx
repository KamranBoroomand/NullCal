import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  children: ReactNode;
};

const ThemeProvider = ({ theme, onThemeChange, children }: ThemeProviderProps) => {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.body.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('nullcal:theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: onThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeProvider;
