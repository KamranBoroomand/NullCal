import type { ReactNode } from 'react';
import ThemeProvider from '../theme/ThemeProvider';
import { AppStoreProvider, useAppStore } from './AppStore';
import { ToastProvider } from '../components/ToastProvider';
import LockScreen from '../components/LockScreen';

const ThemeBridge = ({ children }: { children: ReactNode }) => {
  const { state, updateSettings, locked, unlock } = useAppStore();
  const fallbackTheme =
    typeof window !== 'undefined'
      ? ((window.localStorage.getItem('nullcal:theme') as 'dark' | 'light') ?? 'dark')
      : 'dark';
  const theme = state?.settings.theme ?? fallbackTheme;

  return (
    <ThemeProvider theme={theme} onThemeChange={(next) => updateSettings({ theme: next })}>
      <ToastProvider>
        {children}
        <LockScreen open={locked} pinEnabled={Boolean(state?.securityPrefs.pinEnabled)} onUnlock={unlock} />
      </ToastProvider>
    </ThemeProvider>
  );
};

const AppProviders = ({ children }: { children: ReactNode }) => (
  <AppStoreProvider>
    <ThemeBridge>{children}</ThemeBridge>
  </AppStoreProvider>
);

export default AppProviders;
