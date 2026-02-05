import type { ReactNode } from 'react';
import ThemeProvider from '../theme/ThemeProvider';
import { AppStoreProvider, useAppStore } from './AppStore';
import { ToastProvider } from '../components/ToastProvider';
import LockScreen from '../components/LockScreen';
import { PrivacyScreenProvider } from '../state/privacy';
import { safeLocalStorage } from '../storage/safeStorage';
import { DEFAULT_THEME_BY_MODE, resolveThemeModeFromPalette } from '../theme/themePacks';

const ThemeBridge = ({ children }: { children: ReactNode }) => {
  const {
    state,
    updateSettings,
    locked,
    unlock,
    unlockWithWebAuthn,
    unlockWithBiometric,
    twoFactorPending,
    verifyTwoFactor,
    resendTwoFactor
  } = useAppStore();
  const fallbackPalette = safeLocalStorage.getItem('nullcal:palette') ?? DEFAULT_THEME_BY_MODE.dark;
  const fallbackTheme =
    (safeLocalStorage.getItem('nullcal:theme') as 'dark' | 'light' | null) ??
    resolveThemeModeFromPalette(fallbackPalette, 'dark');
  const palette = state?.settings.palette ?? fallbackPalette;
  const theme = state?.settings.theme ?? resolveThemeModeFromPalette(palette, fallbackTheme);

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
          passwordEnabled={Boolean(state?.securityPrefs.localAuthEnabled)}
          webAuthnEnabled={Boolean(state?.securityPrefs.webAuthnEnabled)}
          biometricEnabled={Boolean(state?.settings.biometricEnabled && state?.securityPrefs.biometricCredentialId)}
          twoFactorPending={twoFactorPending}
          onUnlock={unlock}
          onUnlockWithWebAuthn={unlockWithWebAuthn}
          onUnlockWithBiometric={unlockWithBiometric}
          onVerifyTwoFactor={verifyTwoFactor}
          onResendTwoFactor={resendTwoFactor}
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
