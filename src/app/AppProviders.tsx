import { useEffect, useRef, type ReactNode } from 'react';
import ThemeProvider from '../theme/ThemeProvider';
import { AppStoreProvider, useAppStore } from './AppStore';
import { ToastProvider } from '../components/ToastProvider';
import LockScreen from '../components/LockScreen';
import { PrivacyScreenProvider } from '../state/privacy';
import { safeLocalStorage } from '../storage/safeStorage';
import { DEFAULT_THEME_BY_MODE, resolveThemeModeFromPalette } from '../theme/themePacks';
import { localizeDocumentLiterals, translateLiteral } from '../i18n/literalTranslations';
import type { Language } from '../i18n/translations';

const resolveLanguage = (value?: string): Language => {
  if (value === 'ru' || value === 'fa') {
    return value;
  }
  return 'en';
};

const ThemeBridge = ({ children }: { children: ReactNode }) => {
  const {
    state,
    updateSettings,
    locked,
    unlock,
    unlockWithWebAuthn,
    unlockWithBiometric,
    twoFactorPending,
    twoFactorMode,
    availableTwoFactorModes,
    setTwoFactorMode,
    verifyTwoFactor,
    resendTwoFactor
  } = useAppStore();
  const fallbackPalette = safeLocalStorage.getItem('nullcal:palette') ?? DEFAULT_THEME_BY_MODE.dark;
  const fallbackTheme =
    (safeLocalStorage.getItem('nullcal:theme') as 'dark' | 'light' | null) ??
    resolveThemeModeFromPalette(fallbackPalette, 'dark');
  const palette = state?.settings.palette ?? fallbackPalette;
  const theme = state?.settings.theme ?? resolveThemeModeFromPalette(palette, fallbackTheme);

  useEffect(() => {
    void import('../security/notifications')
      .then(({ flushPendingNotifications }) => flushPendingNotifications())
      .catch(() => {
        // Ignore startup notification flush failures.
      });
  }, []);

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
          twoFactorMode={twoFactorMode}
          availableTwoFactorModes={availableTwoFactorModes}
          onSelectTwoFactorMode={setTwoFactorMode}
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

const LocalizationBridge = ({ children }: { children: ReactNode }) => {
  const { state } = useAppStore();
  const language = resolveLanguage(state?.settings.language);
  const languageRef = useRef<Language>(language);

  useEffect(() => {
    languageRef.current = language;
    if (typeof document === 'undefined') {
      return;
    }
    if (document.body) {
      localizeDocumentLiterals(document.body, language);
    }
    if (document.title) {
      document.title = translateLiteral(document.title, language);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const nativeConfirm = window.confirm.bind(window);
    const nativePrompt = window.prompt.bind(window);

    window.confirm = (message?: string) =>
      nativeConfirm(message ? translateLiteral(message, languageRef.current) : message);
    window.prompt = (message?: string, defaultValue?: string) => {
      const localizedMessage = message ? translateLiteral(message, languageRef.current) : message;
      const localizedDefault =
        typeof defaultValue === 'string' ? translateLiteral(defaultValue, languageRef.current) : defaultValue;
      return nativePrompt(localizedMessage, localizedDefault);
    };

    let frameId: number | null = null;
    const pendingRoots = new Set<ParentNode>();
    const enqueueRoot = (node: Node | null) => {
      if (!node) {
        return;
      }
      if (node.nodeType === Node.TEXT_NODE) {
        enqueueRoot(node.parentNode);
        return;
      }
      if (node.nodeType === Node.DOCUMENT_NODE) {
        const doc = node as Document;
        if (doc.body) {
          pendingRoots.add(doc.body);
        }
        return;
      }
      if ('querySelectorAll' in node) {
        pendingRoots.add(node as ParentNode);
        return;
      }
      enqueueRoot(node.parentNode);
    };
    const localizePending = () => {
      if (pendingRoots.size === 0 && document.body) {
        pendingRoots.add(document.body);
      }
      pendingRoots.forEach((root) => {
        localizeDocumentLiterals(root, languageRef.current);
      });
      pendingRoots.clear();
      if (document.title) {
        document.title = translateLiteral(document.title, languageRef.current);
      }
    };
    const queueLocalize = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        localizePending();
      });
    };

    if (document.body) {
      pendingRoots.add(document.body);
    }
    localizePending();

    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          enqueueRoot(mutation.target.parentNode);
          continue;
        }
        enqueueRoot(mutation.target);
        mutation.addedNodes.forEach((node) => {
          enqueueRoot(node);
        });
      }
      queueLocalize();
    });
    if (document.body) {
      bodyObserver.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'aria-label', 'title']
      });
    }

    const headObserver = new MutationObserver(() => {
      queueLocalize();
    });
    headObserver.observe(document.head, { subtree: true, childList: true, characterData: true });

    return () => {
      window.confirm = nativeConfirm;
      window.prompt = nativePrompt;
      bodyObserver.disconnect();
      headObserver.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return <>{children}</>;
};

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ToastProvider>
    <AppStoreProvider>
      <LocalizationBridge>
        <ThemeBridge>{children}</ThemeBridge>
      </LocalizationBridge>
    </AppStoreProvider>
  </ToastProvider>
);

export default AppProviders;
