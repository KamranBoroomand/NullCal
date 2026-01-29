import type { ReactNode } from 'react';
import ThemeProvider from '../theme/ThemeProvider';
import { AppStoreProvider, useAppStore } from './AppStore';
import { ToastProvider } from '../components/ToastProvider';
import LockScreen from '../components/LockScreen';
import { PrivacyScreenProvider } from '../state/privacy';

const ThemeBridge = ({ children }: { children: ReactNode }) => {
  const { state, updateSettings, locked, unlock } = useAppStore();
  const fallbackTheme =
    typeof window !== 'undefined'
      ? ((window.localStorage.getItem('nullcal:theme') as 'dark' | 'light') ?? 'dark')
      : 'dark';
  const fallbackPalette =
    typeof window !== 'undefined' ? window.localStorage.getItem('nullcal:palette') ?? 'nullcal-neon' : 'nullcal-neon';
  const theme = state?.settings.theme ?? fallbackTheme;
  const palette = state?.settings.palette ?? fallbackPalette;

  return (
    <ThemeProvider
      theme={theme}
      palette={palette}
      onThemeChange={(next) => updateSettings({ theme: next })}
    >
      <PrivacyScreenProvider>
        {children}
        <LockScreen
          open={locked}
          pinEnabled={Boolean(state?.securityPrefs.pinEnabled || state?.securityPrefs.decoyPinEnabled)}
          onUnlock={unlock}
        />
      </PrivacyScreenProvider>
    </ThemeProvider>
  );
};

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <AppStoreProvider>
      <ThemeBridge>{children}</ThemeBridge>
    </AppStoreProvider>
  </ToastProvider>
);

export default AppProviders;
