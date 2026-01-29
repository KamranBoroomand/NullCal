import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { safeLocalStorage } from '../storage/safeStorage';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  theme: ThemeMode;
  palette: string;
  onThemeChange: (theme: ThemeMode) => void;
  children: ReactNode;
};

const ThemeProvider = ({ theme, palette, onThemeChange, children }: ThemeProviderProps) => {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.body.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.body.dataset.palette = palette;
  }, [palette]);

  useEffect(() => {
    safeLocalStorage.setItem('nullcal:theme', theme);
  }, [theme]);

  useEffect(() => {
    safeLocalStorage.setItem('nullcal:palette', palette);
  }, [palette]);

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
