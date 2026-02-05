import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Modal from '../components/Modal';
import RouteErrorBoundary from '../components/RouteErrorBoundary';
import { useAppStore } from '../app/AppStore';
import { useToast } from '../components/ToastProvider';
import AppShell from '../app/AppShell';
import TopBar from '../app/TopBar';
import SideBar from '../app/SideBar';
import ThemePicker from '../components/ThemePicker';
import { encryptPayload } from '../security/encryption';
import { hashLocalSecret } from '../security/localAuth';
import { isWebAuthnSupported, registerPasskey } from '../security/webauthn';
import { buildExportPayload, type ExportMode, validateExportPayload } from '../security/exportUtils';
import { usePrivacyScreen } from '../state/privacy';
import type { AppSettings } from '../storage/types';
import { DEFAULT_THEME_BY_MODE, THEME_PACKS } from '../theme/themePacks';

const formatDate = (value?: string) => {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
};

const themeOptions = THEME_PACKS;

const SafetyCenter = () => {
  const reduceMotion = useReducedMotion();
  const {
    state,
    lockNow,
    updateSettings,
    setActiveProfile,
    createProfile,
    createDecoyProfile,
    resetProfile,
    createCalendar,
    renameCalendar,
    recolorCalendar,
    deleteCalendar,
    toggleCalendarVisibility,
    setPin,
    setDecoyPin,
    clearPin,
    clearDecoyPin,
    updateSecurityPrefs,
    importEncrypted,
    panicWipe
  } = useAppStore();
  const { privacyScreenOn, togglePrivacyScreen } = usePrivacyScreen();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportConfirm, setExportConfirm] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [decoyPinDraft, setDecoyPinDraft] = useState('');
  const [decoyPinConfirm, setDecoyPinConfirm] = useState('');
  const [localAuthDraft, setLocalAuthDraft] = useState('');
  const [localAuthConfirm, setLocalAuthConfirm] = useState('');
  const [panicOpen, setPanicOpen] = useState(false);
  const [themeBrowserOpen, setThemeBrowserOpen] = useState(false);
  const [wipedImportOpen, setWipedImportOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('clean');
  const [keepTitles, setKeepTitles] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const profileRecoveryRef = useRef(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.title = 'NullCal — Safety Center';
  }, []);

  const readSessionValue = (key: string) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const removeSessionValue = (key: string) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage failures.
    }
  };

  const wiped = searchParams.get('wiped') === '1' || readSessionValue('nullcal:wiped') === '1';

  const activeProfile = useMemo(() => {
    if (!state) {
      return null;
    }
    return state.profiles.find((profile) => profile.id === state.settings.activeProfileId) ?? state.profiles[0] ?? null;
  }, [state]);

  useEffect(() => {
    if (!state || profileRecoveryRef.current) {
      return;
    }
    const hasActiveProfile = state.profiles.some((profile) => profile.id === state.settings.activeProfileId);
    if (hasActiveProfile) {
      return;
    }
    profileRecoveryRef.current = true;
    if (state.profiles.length > 0) {
      setActiveProfile(state.profiles[0].id);
      notify('Active profile was missing. Switched to the first available profile.', 'error');
      return;
    }
    createProfile('Primary');
    notify('No profiles found. Created a default profile.', 'error');
  }, [createProfile, notify, setActiveProfile, state]);
  const calendars = useMemo(() => {
    if (!state || !activeProfile) {
      return [];
    }
    return state.calendars.filter((calendar) => calendar.profileId === activeProfile.id);
  }, [activeProfile, state]);
  const activeTheme = useMemo(() => {
    const fallback = themeOptions.find((theme) => theme.id === DEFAULT_THEME_BY_MODE.dark) ?? themeOptions[0];
    return themeOptions.find((palette) => palette.id === state?.settings.palette) ?? fallback;
  }, [state?.settings.palette]);
  const authSummary = useMemo(() => {
    if (!state) {
      return 'None';
    }
    const methods = [];
    if (state.securityPrefs.pinEnabled) {
      methods.push('PIN');
    }
    if (state.settings.twoFactorEnabled) {
      methods.push('2FA');
    }
    if (state.settings.biometricEnabled) {
      methods.push('Biometric');
    }
    return methods.length ? methods.join(' + ') : 'None';
  }, [state?.securityPrefs.pinEnabled, state?.settings.biometricEnabled, state?.settings.twoFactorEnabled]);
  const lastSyncAt = useMemo(() => new Date().toLocaleString(), []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) {
        window.clearTimeout(holdTimer.current);
      }
    };
  }, []);

  if (wiped) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="photon-panel w-full max-w-2xl rounded-3xl p-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Safe State</p>
          <h1 className="mt-3 text-3xl font-semibold text-text">Data wiped</h1>
          <p className="mt-2 text-sm text-muted">
            NullCal cleared local storage and caches. You are in a clean, offline-safe state.
          </p>
          <div className="mt-6 rounded-2xl border border-grid bg-panel2 p-4 text-left text-sm text-muted">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Status checklist</p>
            <ul className="mt-3 space-y-2">
              <li className="flex items-center justify-between">
                <span>Local data cleared</span>
                <span className="text-accent">Confirmed</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Offline mode</span>
                <span className="text-accent">ENFORCED</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Sync</span>
                <span className="text-accent">OFF</span>
              </li>
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                removeSessionValue('nullcal:wiped');
                navigate('/');
              }}
              className="rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
            >
              Start fresh
            </button>
            <button
              type="button"
              onClick={() => setWipedImportOpen(true)}
              className="rounded-full border border-grid px-5 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
            >
              Re-import encrypted backup
            </button>
          </div>
        </div>
        <Modal title="Re-import encrypted backup" open={wipedImportOpen} onClose={() => setWipedImportOpen(false)}>
          <div className="grid gap-3 text-sm text-muted">
            <input
              type="file"
              accept="application/json"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
              className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
            />
            <input
              type="password"
              placeholder="Passphrase"
              value={importPassphrase}
              onChange={(event) => setImportPassphrase(event.target.value)}
              className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
            />
            <button
              type="button"
              onClick={async () => {
                await handleImport(() => {
                  removeSessionValue('nullcal:wiped');
                  setWipedImportOpen(false);
                  navigate('/');
                });
              }}
              className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
            >
              Import backup
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-muted">
        Loading safety systems…
      </div>
    );
  }

  const handleCreateProfile = () => {
    const name = window.prompt('Profile name');
    if (!name) {
      return;
    }
    createProfile(name.trim());
  };

  const handleResetProfile = () => {
    if (!activeProfile) {
      return;
    }
    const confirmed = window.confirm('Reset this profile back to default calendars (events removed)?');
    if (!confirmed) {
      return;
    }
    resetProfile(activeProfile.id);
  };

  const buildExportSnapshot = (mode: ExportMode = exportMode, keepTitlesOverride = keepTitles) => {
    if (!state || !activeProfile) {
      notify('Unable to export: profile data is missing.', 'error');
      return null;
    }
    const payload = buildExportPayload(state, activeProfile.id, {
      mode,
      keepTitles: keepTitlesOverride
    });
    const sanityCheck = JSON.parse(JSON.stringify(payload)) as typeof payload;
    validateExportPayload(sanityCheck);
    return sanityCheck;
  };

  const handleQuickExport = async () => {
    const passphrase = window.prompt('Create a passphrase to encrypt this backup.');
    if (!passphrase) {
      return;
    }
    try {
      const payload = buildExportSnapshot();
      if (!payload) {
        return;
      }
      const encryptedPayload = await encryptPayload(payload, passphrase);
      updateSettings({ lastExportAt: new Date().toISOString() });
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nullcal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify('Encrypted backup exported.', 'success');
    } catch {
      notify('Export failed.', 'error');
    }
  };

  const handleQuickImport = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const passphrase = window.prompt('Enter your backup passphrase.');
      if (!passphrase) {
        return;
      }
      await importEncrypted(payload, passphrase);
      notify('Backup imported successfully.', 'success');
    } catch {
      notify('Import failed.', 'error');
    }
  };

  const securityScoreChecklist = [
    { label: 'PIN enabled', value: state.securityPrefs.pinEnabled || state.securityPrefs.decoyPinEnabled },
    { label: 'Auto-lock enabled', value: state.settings.autoLockMinutes > 0 || state.settings.autoLockOnBlur },
    {
      label: 'Offline mode enforced',
      value: state.settings.networkLock || state.settings.syncStrategy === 'offline'
    },
    { label: 'Secure mode enabled', value: state.settings.secureMode },
    { label: 'Two-factor ready', value: state.settings.twoFactorEnabled },
    { label: 'Encrypted notes', value: state.settings.encryptedNotes },
    {
      label: 'Recent encrypted backup (14 days)',
      value: state.settings.lastExportAt
        ? Date.now() - new Date(state.settings.lastExportAt).getTime() < 14 * 24 * 60 * 60 * 1000
        : false
    }
  ];
  const score = securityScoreChecklist.filter((item) => item.value).length;
  const securityChecklistSections = [
    {
      title: 'Access & locking',
      items: [
        { label: 'PIN enabled', value: state.securityPrefs.pinEnabled || state.securityPrefs.decoyPinEnabled },
        { label: 'Auto-lock enabled', value: state.settings.autoLockMinutes > 0 || state.settings.autoLockOnBlur },
        { label: 'Two-factor ready', value: state.settings.twoFactorEnabled }
      ]
    },
    {
      title: 'Data & encryption',
      items: [
        { label: 'Secure mode enabled', value: state.settings.secureMode },
        { label: 'Encrypted notes', value: state.settings.encryptedNotes },
        { label: 'Sync encryption', value: state.settings.encryptedSharingEnabled }
      ]
    },
    {
      title: 'Backups & network',
      items: [
        {
          label: 'Recent encrypted backup (14 days)',
          value: state.settings.lastExportAt
            ? Date.now() - new Date(state.settings.lastExportAt).getTime() < 14 * 24 * 60 * 60 * 1000
            : false
        },
        {
          label: 'Offline mode enforced',
          value: state.settings.networkLock || state.settings.syncStrategy === 'offline'
        }
      ]
    }
  ];

  const handleExport = async () => {
    if (!exportPassphrase || exportPassphrase !== exportConfirm) {
      notify('Passphrases do not match.', 'error');
      return;
    }
    try {
      const payload = buildExportSnapshot();
      if (!payload) {
        return;
      }
      const encryptedPayload = await encryptPayload(payload, exportPassphrase);
      updateSettings({ lastExportAt: new Date().toISOString() });
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nullcal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setExportPassphrase('');
      setExportConfirm('');
      notify('Encrypted backup exported.', 'success');
    } catch {
      notify('Export failed.', 'error');
    }
  };

  const handleImport = async (onSuccess?: () => void) => {
    if (!importFile || !importPassphrase) {
      notify('Select a file and passphrase.', 'error');
      return;
    }
    try {
      const payload = JSON.parse(await importFile.text());
      await importEncrypted(payload, importPassphrase);
      setImportFile(null);
      setImportPassphrase('');
      notify('Backup imported successfully.', 'success');
      onSuccess?.();
    } catch {
      notify('Import failed.', 'error');
    }
  };

  const handleSetPin = async () => {
    if (!pinDraft || pinDraft !== pinConfirm) {
      notify('PINs do not match.', 'error');
      return;
    }
    await setPin(pinDraft);
    if (activeProfile) {
      updateSettings({ primaryProfileId: activeProfile.id });
    }
    setPinDraft('');
    setPinConfirm('');
    notify('PIN set. Lock screen enabled.', 'success');
  };

  const handleSetDecoyPin = async () => {
    if (!decoyPinDraft || decoyPinDraft !== decoyPinConfirm) {
      notify('Decoy PINs do not match.', 'error');
      return;
    }
    if (!state.settings.decoyProfileId) {
      notify('Create a decoy profile first.', 'error');
      return;
    }
    await setDecoyPin(decoyPinDraft);
    setDecoyPinDraft('');
    setDecoyPinConfirm('');
    notify('Decoy PIN set.', 'success');
  };

  const handleSetLocalAuth = async () => {
    if (!localAuthDraft || localAuthDraft !== localAuthConfirm) {
      notify('Passphrases do not match.', 'error');
      return;
    }
    const hashed = await hashLocalSecret(localAuthDraft);
    updateSecurityPrefs({
      localAuthEnabled: true,
      localAuthHash: hashed.hash,
      localAuthSalt: hashed.salt,
      localAuthIterations: hashed.iterations
    });
    lockNow();
    setLocalAuthDraft('');
    setLocalAuthConfirm('');
    notify('Local passphrase enabled.', 'success');
  };

  const handleClearLocalAuth = () => {
    updateSecurityPrefs({
      localAuthEnabled: false,
      localAuthHash: undefined,
      localAuthSalt: undefined,
      localAuthIterations: undefined
    });
    notify('Local passphrase cleared.', 'info');
  };

  const handleRegisterPasskey = async () => {
    try {
      if (!isWebAuthnSupported()) {
        notify('WebAuthn is not supported on this device.', 'error');
        return;
      }
      const credentialId = await registerPasskey();
      updateSecurityPrefs({ webAuthnEnabled: true, webAuthnCredentialId: credentialId });
      lockNow();
      notify('Passkey registered.', 'success');
    } catch {
      notify('Passkey registration failed.', 'error');
    }
  };

  const handleClearPasskey = () => {
    updateSecurityPrefs({ webAuthnEnabled: false, webAuthnCredentialId: undefined });
    notify('Passkey removed.', 'info');
  };

  const createShareToken = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');

  const handleToggleSyncEnabled = (enabled: boolean) => {
    updateSettings({ syncStrategy: enabled ? 'p2p' : 'offline' });
    notify(enabled ? 'Decentralized sync enabled.' : 'Decentralized sync disabled.', 'success');
  };

  const handleToggleReminders = (enabled: boolean) => {
    updateSettings({ remindersEnabled: enabled });
    notify(enabled ? 'Reminders enabled.' : 'Reminders disabled.', 'success');
  };

  const handleToggleCollaboration = (enabled: boolean) => {
    updateSettings({ collaborationEnabled: enabled });
    notify(enabled ? 'Collaboration enabled.' : 'Collaboration disabled.', 'success');
  };

  const handleToggleSharing = (enabled: boolean) => {
    updateSettings({
      encryptedSharingEnabled: enabled,
      notesShareToken: enabled ? state.settings.notesShareToken ?? createShareToken() : undefined
    });
    notify(enabled ? 'Secure sharing enabled.' : 'Secure sharing disabled.', 'success');
  };

  const handleCopyShareToken = async () => {
    if (!state.settings.notesShareToken) {
      return;
    }
    try {
      await navigator.clipboard.writeText(state.settings.notesShareToken);
      notify('Share token copied.', 'success');
    } catch {
      notify('Unable to copy token.', 'error');
    }
  };

  const handleCreateDecoyProfile = () => {
    if (state.settings.decoyProfileId) {
      notify('Decoy profile already exists.', 'info');
      return;
    }
    const name = window.prompt('Decoy profile name', 'Decoy');
    if (!name) {
      return;
    }
    createDecoyProfile(name.trim() || 'Decoy');
  };

  const handleDecoyProfileChange = (profileId: string) => {
    if (!profileId) {
      updateSettings({ decoyProfileId: undefined });
      notify('Decoy profile cleared.', 'info');
      return;
    }
    updateSettings({ decoyProfileId: profileId });
    notify('Decoy profile updated.', 'success');
  };

  const handleSwitchToDecoy = () => {
    if (!state.settings.decoyProfileId) {
      notify('Set a decoy profile first.', 'error');
      return;
    }
    if (state.securityPrefs.pinEnabled || state.securityPrefs.decoyPinEnabled) {
      notify('Unlock to switch profiles.', 'error');
      return;
    }
    setActiveProfile(state.settings.decoyProfileId);
    notify('Switched to decoy profile.', 'success');
  };

  const handleCommandExport = async (mode: 'clean' | 'full') => {
    const passphrase = window.prompt(`Create a passphrase for the ${mode} export.`);
    if (!passphrase) {
      return;
    }
    try {
      const payload = buildExportSnapshot(mode, false);
      if (!payload) {
        return;
      }
      const encryptedPayload = await encryptPayload(payload, passphrase);
      updateSettings({ lastExportAt: new Date().toISOString() });
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nullcal-backup-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify(`${mode === 'full' ? 'Full' : 'Clean'} export saved.`, 'success');
    } catch {
      notify('Export failed.', 'error');
    }
  };

  const handleCommandAdd = () => {
    navigate('/');
  };

  const handleManualProfileSwitch = (id: string) => {
    if (!id) {
      return;
    }
    if (state.securityPrefs.pinEnabled || state.securityPrefs.decoyPinEnabled) {
      notify('Profile switching is tied to your PIN unlock.', 'error');
      return;
    }
    const confirmed = window.confirm('Switch active profile?');
    if (!confirmed) {
      return;
    }
    setActiveProfile(id);
  };

  const handlePanicHoldStart = () => {
    holdTimer.current = window.setTimeout(async () => {
      await panicWipe();
    }, 2000);
  };

  const handlePanicHoldEnd = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const panelMotion = reduceMotion
    ? undefined
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };
  const localEncryption = state.settings.encryptedNotes || state.settings.encryptedAttachments ? 'Encrypted' : 'Standard';
  const syncEncryption = state.settings.encryptedSharingEnabled ? 'Enabled' : 'Standard';
  const networkLabel =
    state.settings.syncStrategy === 'offline'
      ? 'Offline only'
      : 'Secure sync';
  const ipTrackingStatus = state.settings.networkLock ? 'Blocked' : 'Limited';
  const privacyScore = [
    state.settings.networkLock || state.settings.syncStrategy === 'offline',
    state.settings.encryptedNotes || state.settings.encryptedAttachments,
    state.settings.encryptedSharingEnabled,
    state.settings.twoFactorEnabled
  ].filter(Boolean).length;
  const privacyLevel = privacyScore >= 3 ? 'High' : privacyScore >= 2 ? 'Moderate' : 'Basic';
  const decoyReadiness = [
    { label: 'Decoy profile selected', value: Boolean(state.settings.decoyProfileId) },
    { label: 'Decoy PIN set', value: state.securityPrefs.decoyPinEnabled },
    { label: 'Switch-on-blur ready', value: state.settings.switchToDecoyOnBlur }
  ];
  const privacySections = [
    {
      title: 'General privacy',
      items: [
        { label: 'Storage', value: 'Local-only' },
        { label: 'Network access', value: networkLabel },
        { label: 'Last sync', value: state.settings.syncStrategy === 'offline' ? 'Never' : lastSyncAt },
        { label: 'Last backup', value: formatDate(state.settings.lastExportAt) },
        { label: 'Authentication', value: authSummary }
      ]
    },
    {
      title: 'Location & access',
      items: [
        { label: 'IP tracking', value: ipTrackingStatus },
        { label: 'Location access', value: 'Restricted' }
      ]
    },
    {
      title: 'Encryption',
      items: [
        { label: 'Local data encryption', value: localEncryption },
        { label: 'Sync encryption', value: syncEncryption }
      ]
    }
  ];
  const handleSectionJump = (targetId: string) => {
    const section = document.getElementById(targetId);
    if (!section) {
      return;
    }
    section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <AppShell
      topBar={
        <TopBar
          variant="minimal"
          profiles={state.profiles.map((profile) => ({ id: profile.id, name: profile.name }))}
          activeProfileId={activeProfile?.id ?? ''}
          onProfileChange={handleManualProfileSwitch}
          onCreateProfile={handleCreateProfile}
          profileSwitchAllowed={!state.securityPrefs.pinEnabled && !state.securityPrefs.decoyPinEnabled}
          showCreateProfile={!state.securityPrefs.pinEnabled && !state.securityPrefs.decoyPinEnabled}
          onLockNow={lockNow}
          onHome={() => navigate('/')}
          showSearch={false}
          onOpenNav={() => setNavOpen(true)}
          onCommandAdd={handleCommandAdd}
          onCommandDecoy={handleSwitchToDecoy}
          onCommandExport={handleCommandExport}
          secureMode={state.settings.secureMode}
          eventObfuscation={state.settings.eventObfuscation}
          encryptedNotes={state.settings.encryptedNotes}
          twoFactorEnabled={state.settings.twoFactorEnabled}
          syncStrategy={state.settings.syncStrategy}
          syncTrustedDevices={state.settings.syncTrustedDevices}
          notificationsCount={0}
        />
      }
      sidebar={
        <SideBar
          calendars={calendars}
          activeProfileId={activeProfile?.id ?? ''}
          activeProfileName={activeProfile?.name ?? 'KamranBroomand'}
          onToggleCalendar={toggleCalendarVisibility}
          onCreateCalendar={createCalendar}
          onRenameCalendar={renameCalendar}
          onRecolorCalendar={recolorCalendar}
          onDeleteCalendar={deleteCalendar}
          onNewEvent={() => {
            navigate('/');
          }}
          onExport={handleQuickExport}
          onImport={handleQuickImport}
          onResetProfile={handleResetProfile}
          onOpenReminders={() => handleSectionJump('reminders-section')}
          onOpenNotes={() => handleSectionJump('notes-section')}
          onLockNow={lockNow}
          showClipboardWarning
        />
      }
      mobileNav={
        <SideBar
          calendars={calendars}
          activeProfileId={activeProfile?.id ?? ''}
          activeProfileName={activeProfile?.name ?? 'KamranBroomand'}
          variant="drawer"
          onToggleCalendar={toggleCalendarVisibility}
          onCreateCalendar={createCalendar}
          onRenameCalendar={renameCalendar}
          onRecolorCalendar={recolorCalendar}
          onDeleteCalendar={deleteCalendar}
          onNavigate={() => setNavOpen(false)}
          onOpenReminders={() => handleSectionJump('reminders-section')}
          onOpenNotes={() => handleSectionJump('notes-section')}
          onLockNow={lockNow}
        />
      }
      navOpen={navOpen}
      onNavClose={() => setNavOpen(false)}
    >
      <RouteErrorBoundary>
        <div className="space-y-3">
          <motion.section {...panelMotion} className="photon-panel rounded-3xl p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Safety Center</p>
                <h1 className="mt-2 text-2xl font-semibold text-text">Privacy & Security</h1>
              </div>
              <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Security Score</p>
                <p className="text-2xl font-semibold text-accent">
                  {score}/{securityScoreChecklist.length}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section {...panelMotion} className="grid gap-2 lg:grid-cols-2">
            <div className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Decentralized Sync</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Enable decentralized sync</p>
                    <p className="mt-1 text-xs text-muted">Uses peer channels to sync profiles across devices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.syncStrategy !== 'offline'}
                    onChange={(event) => handleToggleSyncEnabled(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                  Sync strategy
                  <select
                    value={state.settings.syncStrategy}
                    onChange={(event) =>
                      updateSettings({ syncStrategy: event.target.value as AppSettings['syncStrategy'] })
                    }
                    className="rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
                    disabled={state.settings.syncStrategy === 'offline'}
                  >
                    <option value="offline" className="bg-panel2">
                      Offline only
                    </option>
                    <option value="ipfs" className="bg-panel2">
                      IPFS secure sync
                    </option>
                    <option value="p2p" className="bg-panel2">
                      Peer-to-peer mesh
                    </option>
                  </select>
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Trusted device sharing</p>
                    <p className="mt-1 text-xs text-muted">
                      Pair devices with end-to-end keys before sharing calendars.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.syncTrustedDevices}
                    onChange={(event) => updateSettings({ syncTrustedDevices: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Tamper-proof event log</p>
                    <p className="mt-1 text-xs text-muted">Anchor event hashes for integrity checks.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.tamperProofLog}
                    onChange={(event) => updateSettings({ tamperProofLog: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
              </div>
            </div>

            <div className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Authentication</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Two-factor authentication</p>
                    <p className="mt-1 text-xs text-muted">Use an authenticator app or SMS backup.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.twoFactorEnabled}
                    onChange={(event) => updateSettings({ twoFactorEnabled: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Biometric unlock</p>
                    <p className="mt-1 text-xs text-muted">Enable fingerprint or Face ID on supported devices.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.biometricEnabled}
                    onChange={(event) => updateSettings({ biometricEnabled: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <label className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted">Local passphrase</p>
                      <p className="mt-1 text-xs text-muted">Protect the app with a local-only passphrase.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.securityPrefs.localAuthEnabled}
                      onChange={(event) => {
                        if (!event.target.checked) {
                          handleClearLocalAuth();
                          return;
                        }
                        handleSetLocalAuth();
                      }}
                      className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                    />
                  </label>
                  {!state.securityPrefs.localAuthEnabled && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <input
                        type="password"
                        placeholder="Passphrase"
                        value={localAuthDraft}
                        onChange={(event) => setLocalAuthDraft(event.target.value)}
                        className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                      />
                      <input
                        type="password"
                        placeholder="Confirm passphrase"
                        value={localAuthConfirm}
                        onChange={(event) => setLocalAuthConfirm(event.target.value)}
                        className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                      />
                    </div>
                  )}
                  {state.securityPrefs.localAuthEnabled && (
                    <button
                      type="button"
                      onClick={handleClearLocalAuth}
                      className="mt-3 rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Disable passphrase
                    </button>
                  )}
                </div>
                <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <label className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-muted">Passkey authentication</p>
                      <p className="mt-1 text-xs text-muted">Use WebAuthn for device-bound login.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.securityPrefs.webAuthnEnabled}
                      disabled={!isWebAuthnSupported()}
                      onChange={(event) => {
                        if (!event.target.checked) {
                          handleClearPasskey();
                          return;
                        }
                        handleRegisterPasskey();
                      }}
                      className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                    />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                    <button
                      type="button"
                      onClick={handleRegisterPasskey}
                      disabled={!isWebAuthnSupported()}
                      className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Register passkey
                    </button>
                    {state.securityPrefs.webAuthnEnabled && (
                      <button
                        type="button"
                        onClick={handleClearPasskey}
                        className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        Remove passkey
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div id="notes-section" className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Private Notes & Sharing</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted notes by default</p>
                    <p className="mt-1 text-xs text-muted">Encrypt notes locally with AES-GCM.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.encryptedNotes}
                    onChange={(event) => updateSettings({ encryptedNotes: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted attachments</p>
                    <p className="mt-1 text-xs text-muted">Wrap event files with local encryption.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.encryptedAttachments}
                    onChange={(event) => updateSettings({ encryptedAttachments: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted event sharing</p>
                    <p className="mt-1 text-xs text-muted">Share calendars with recipient-only keys.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.encryptedSharingEnabled}
                    onChange={(event) => handleToggleSharing(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                {state.settings.encryptedSharingEnabled && (
                  <div className="rounded-2xl border border-grid bg-panel px-4 py-3 text-xs text-muted">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Share token</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-grid px-3 py-1 text-[11px] text-text">
                        {state.settings.notesShareToken}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyShareToken}
                        className="rounded-full border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateSettings({ notesShareToken: createShareToken(), encryptedSharingEnabled: true })
                        }
                        className="rounded-full border border-grid px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>
                )}
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Obfuscate event details</p>
                    <p className="mt-1 text-xs text-muted">Show time blocks instead of titles in the grid.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.eventObfuscation}
                    onChange={(event) => updateSettings({ eventObfuscation: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
              </div>
            </div>

            <div id="reminders-section" className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Reminders & Collaboration</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Reminders</p>
                    <p className="mt-1 text-xs text-muted">Trigger notifications on this device.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.remindersEnabled}
                    onChange={(event) => handleToggleReminders(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                  Reminder channel
                  <select
                    value={state.settings.reminderChannel}
                    onChange={(event) =>
                      updateSettings({ reminderChannel: event.target.value as AppSettings['reminderChannel'] })
                    }
                    className="rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
                    disabled={!state.settings.remindersEnabled}
                  >
                    <option value="local" className="bg-panel2">
                      Local notifications
                    </option>
                    <option value="signal" className="bg-panel2">
                      Signal secure ping
                    </option>
                    <option value="telegram" className="bg-panel2">
                      Telegram secure ping
                    </option>
                  </select>
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Collaboration</p>
                    <p className="mt-1 text-xs text-muted">Enable real-time updates via peer channels.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.collaborationEnabled}
                    onChange={(event) => handleToggleCollaboration(event.target.checked)}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                  Collaboration mode
                  <select
                    value={state.settings.collaborationMode}
                    onChange={(event) =>
                      updateSettings({
                        collaborationMode: event.target.value as AppSettings['collaborationMode']
                      })
                    }
                    className="rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
                    disabled={!state.settings.collaborationEnabled}
                  >
                    <option value="private" className="bg-panel2">
                      Private only
                    </option>
                    <option value="shared" className="bg-panel2">
                      Shared with trusted group
                    </option>
                    <option value="team" className="bg-panel2">
                      Collaborative workspace
                    </option>
                  </select>
                </label>
                <p className="text-xs text-muted">
                  Shared calendars remain encrypted; only approved collaborators can decrypt events.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section {...panelMotion} className="grid gap-2 text-sm text-muted md:grid-cols-2">
            <div className="photon-panel min-w-0 rounded-3xl p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Privacy Status</p>
              <div className="mt-3 space-y-3 text-xs text-muted">
                <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                    <span>Privacy level</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text">{privacyLevel}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                    <span>Coverage</span>
                    <span className="text-text">
                      {privacyScore}/4 signals active
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-grid">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${(privacyScore / 4) * 100}%` }}
                    />
                  </div>
                </div>
                {privacySections.map((section, index) => (
                  <details
                    key={section.title}
                    className="rounded-2xl border border-grid bg-panel2 px-4 py-3"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between text-xs uppercase tracking-[0.3em] text-muted">
                      <span>{section.title}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-muted">View</span>
                    </summary>
                    <ul className="mt-3 space-y-1.5 text-sm text-muted">
                      {section.items.map((item) => (
                        <li key={item.label} className="flex min-w-0 items-center justify-between gap-3">
                          <span>{item.label}</span>
                          <span className="text-text">{item.value}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
            <div className="grid gap-3">
              <div className="photon-panel min-w-0 rounded-3xl p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Security Checklist</p>
                <div className="mt-3 space-y-3 text-xs text-muted">
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                      <span>Coverage score</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-text">
                        {score}/{securityScoreChecklist.length}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-grid">
                      <div
                        className="h-full rounded-full bg-accent transition-all"
                        style={{ width: `${(score / securityScoreChecklist.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  {securityChecklistSections.map((section, index) => (
                    <details
                      key={section.title}
                      className="rounded-2xl border border-grid bg-panel2 px-4 py-3"
                      open={index === 0}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs uppercase tracking-[0.3em] text-muted">
                        <span>{section.title}</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">View</span>
                      </summary>
                      <ul className="mt-3 space-y-1.5 text-sm text-muted">
                        {section.items.map((item) => (
                          <li key={item.label} className="flex min-w-0 items-center justify-between gap-3">
                            <span>{item.label}</span>
                            <span className={item.value ? 'text-accent' : 'text-muted'}>
                              {item.value ? 'Enabled' : 'Off'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
              <div className="photon-panel min-w-0 rounded-3xl p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-muted">Locking</p>
                <div className="mt-2 space-y-3 text-sm text-muted">
                  <div className="rounded-2xl border border-grid bg-panel2 px-3 py-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Lock now</p>
                    <p className="mt-1 text-xs text-muted">Immediately hides the calendar until you unlock.</p>
                    <button
                      type="button"
                      onClick={lockNow}
                      className="mt-3 rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Lock now
                    </button>
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs uppercase tracking-[0.3em] text-muted">Set PIN</label>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="New PIN"
                        value={pinDraft}
                        onChange={(event) => setPinDraft(event.target.value)}
                        className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                      />
                      <input
                        type="password"
                        inputMode="numeric"
                        placeholder="Confirm PIN"
                        value={pinConfirm}
                        onChange={(event) => setPinConfirm(event.target.value)}
                        className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSetPin}
                        className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
                      >
                        Save PIN
                      </button>
                      <button
                        type="button"
                        onClick={clearPin}
                        className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        Clear PIN
                      </button>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs uppercase tracking-[0.3em] text-muted">Auto-lock (minutes)</label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={state.settings.autoLockMinutes}
                      onChange={(event) =>
                        updateSettings({ autoLockMinutes: Number(event.target.value || 0) })
                      }
                      className="mt-2 w-full min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                    <p className="mt-2 text-xs text-muted">Set to 0 to disable inactivity lock.</p>
                  </div>
                  <div className="rounded-2xl border border-grid bg-panel2 px-3 py-2">
                    <label className="flex min-w-0 items-start justify-between gap-4 text-xs uppercase tracking-[0.3em] text-muted">
                      <span>Auto-lock on tab blur</span>
                      <input
                        type="checkbox"
                        checked={state.settings.autoLockOnBlur}
                        onChange={(event) => updateSettings({ autoLockOnBlur: event.target.checked })}
                        className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                      />
                    </label>
                    <div className="mt-3 flex min-w-0 items-center gap-3 text-xs text-muted">
                      <span>Grace period</span>
                      <select
                        value={state.settings.autoLockGraceSeconds}
                        onChange={(event) =>
                          updateSettings({ autoLockGraceSeconds: Number(event.target.value || 0) })
                        }
                        className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
                      >
                        <option value={0} className="bg-panel2">
                          0s
                        </option>
                        <option value={5} className="bg-panel2">
                          5s
                        </option>
                        <option value={15} className="bg-panel2">
                          15s
                        </option>
                      </select>
                    </div>
                    <label className="mt-3 flex min-w-0 items-start justify-between gap-4 text-xs uppercase tracking-[0.3em] text-muted">
                      <span>Switch to decoy on blur</span>
                      <input
                        type="checkbox"
                        checked={state.settings.switchToDecoyOnBlur}
                        onChange={(event) => updateSettings({ switchToDecoyOnBlur: event.target.checked })}
                        className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                        disabled={!state.settings.decoyProfileId}
                      />
                    </label>
                    {!state.settings.decoyProfileId && (
                      <p className="mt-2 text-xs text-muted">Select a decoy profile to enable this option.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section {...panelMotion} className="grid gap-2">
            <div className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Screen Privacy</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Secure mode</p>
                    <p className="mt-1 text-xs text-muted">
                      Hides event titles until hover or focus to deter shoulder-surfing. Not encryption.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.secureMode}
                    onChange={(event) => updateSettings({ secureMode: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Blur sensitive</p>
                    <p className="mt-1 text-xs text-muted">Blurs titles until hover.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.blurSensitive}
                    onChange={(event) => updateSettings({ blurSensitive: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <label className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Privacy screen hotkey</p>
                    <p className="mt-1 text-xs text-muted">Cmd/Ctrl+Shift+P toggles a decoy overlay.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={state.settings.privacyScreenHotkeyEnabled}
                    onChange={(event) =>
                      updateSettings({ privacyScreenHotkeyEnabled: event.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border border-grid bg-panel2"
                  />
                </label>
                <button
                  type="button"
                  onClick={togglePrivacyScreen}
                  className="w-full rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
                >
                  {privacyScreenOn ? 'Exit privacy screen' : 'Activate privacy screen'}
                </button>
              </div>
            </div>

            <div className="photon-panel min-w-0 rounded-3xl p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Appearance</p>
              <div className="mt-2 flex flex-col gap-3 text-sm text-muted lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                    <span>Theme Packs</span>
                    <span className="text-[10px] tracking-[0.2em] text-muted">{activeTheme.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Pick a theme to restyle the entire interface. Saved locally on this device.
                  </p>
                  <div className="mt-3 min-w-0">
                    <ThemePicker
                      themes={themeOptions}
                      activeId={state.settings.palette}
                      onSelect={(nextPalette) => {
                        const nextTheme =
                          themeOptions.find((theme) => theme.id === nextPalette)?.mode ?? state.settings.theme;
                        updateSettings({ palette: nextPalette, theme: nextTheme });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section {...panelMotion} className="grid gap-2 md:grid-cols-2">
            <div className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Export Hygiene</p>
              <div className="mt-3 space-y-3 text-sm text-muted">
                <div className="space-y-3">
                  {(['full', 'clean', 'minimal'] as ExportMode[]).map((mode) => (
                    <label
                      key={mode}
                      className="flex min-w-0 items-start justify-between gap-4 rounded-2xl border border-grid bg-panel2 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.3em] text-muted">
                          {mode === 'full' && 'Full export'}
                          {mode === 'clean' && 'Clean export'}
                          {mode === 'minimal' && 'Minimal export'}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {mode === 'full' && 'Complete profile export (calendars, events, preferences).'}
                          {mode === 'clean' &&
                            'Removes notes, locations, attendees; titles become “Busy” unless kept.'}
                          {mode === 'minimal' && 'Only time blocks and category labels (no notes/locations).'}
                        </p>
                      </div>
                      <input
                        type="radio"
                        name="export-mode"
                        value={mode}
                        checked={exportMode === mode}
                        onChange={() => setExportMode(mode)}
                        className="mt-1 h-4 w-4 rounded-full border border-grid bg-panel2"
                      />
                    </label>
                  ))}
                  {exportMode === 'clean' && (
                    <label className="flex min-w-0 items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        checked={keepTitles}
                        onChange={(event) => setKeepTitles(event.target.checked)}
                        className="h-4 w-4 rounded border border-grid bg-panel2"
                      />
                      Keep titles (still removes notes/location/attendees)
                    </label>
                  )}
                  <p className="text-xs text-muted">Exports are files; handle them like secrets.</p>
                </div>
                <div className="grid gap-3 text-sm text-muted">
                  <input
                    type="password"
                    placeholder="Passphrase"
                    value={exportPassphrase}
                    onChange={(event) => setExportPassphrase(event.target.value)}
                    className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                  <input
                    type="password"
                    placeholder="Confirm passphrase"
                    value={exportConfirm}
                    onChange={(event) => setExportConfirm(event.target.value)}
                    className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                  />
                  <button
                    type="button"
                    onClick={handleExport}
                    className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
                  >
                    Export encrypted
                  </button>
                </div>
                <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Quick export</p>
                  <p className="mt-1 text-xs text-muted">Prompt for a passphrase and export immediately.</p>
                  <button
                    type="button"
                    onClick={handleQuickExport}
                    className="mt-3 rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                  >
                    Quick export
                  </button>
                </div>
                <div className="border-t border-grid pt-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-muted">Import Backup</p>
                  <div className="mt-3 grid gap-3 text-sm text-muted">
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
                      className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                    <input
                      type="password"
                      placeholder="Passphrase"
                      value={importPassphrase}
                      onChange={(event) => setImportPassphrase(event.target.value)}
                      className="min-w-0 rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                    />
                    <button
                      type="button"
                      onClick={() => handleImport()}
                      className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                    >
                      Import
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="photon-panel min-w-0 rounded-3xl p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Decoy Profile</p>
              <div className="mt-4 grid gap-4 text-sm text-muted xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="space-y-4">
                  <p className="text-xs text-muted leading-relaxed">
                    Decoy profile is a separate local workspace. Use a decoy PIN to open it under pressure.
                  </p>
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-xs text-muted">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2.5 text-center text-[11px] leading-snug">
                        <div className="uppercase tracking-[0.2em] text-muted">Active profile</div>
                        <div className="mt-1 break-words text-text">{activeProfile?.name ?? 'Unknown'}</div>
                      </div>
                      <div className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2.5 text-center text-[11px] leading-snug">
                        <div className="uppercase tracking-[0.2em] text-muted">Decoy profile</div>
                        <div className="mt-1 break-words text-text">
                          {state.settings.decoyProfileId ? 'Configured' : 'Not created'}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                    <label className="text-xs uppercase tracking-[0.3em] text-muted">Choose decoy profile</label>
                    <select
                      value={state.settings.decoyProfileId ?? ''}
                      onChange={(event) => handleDecoyProfileChange(event.target.value)}
                      className="mt-2 w-full min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-xs text-text"
                    >
                      <option value="">No decoy profile</option>
                      {state.profiles.map((profile) => (
                        <option key={profile.id} value={profile.id} className="bg-panel2">
                          {profile.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-muted">
                      Use a profile with minimal data for safe handoff.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Decoy readiness</p>
                    <ul className="mt-3 space-y-2 text-xs text-muted">
                      {decoyReadiness.map((item) => (
                        <li key={item.label} className="flex items-center justify-between gap-3">
                          <span>{item.label}</span>
                          <span className={item.value ? 'text-accent' : 'text-muted'}>
                            {item.value ? 'Ready' : 'Pending'}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={handleSwitchToDecoy}
                      disabled={!state.settings.decoyProfileId}
                      className="mt-4 w-full rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Open decoy workspace
                    </button>
                  </div>
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Profile actions</p>
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={handleCreateDecoyProfile}
                        className="w-full rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        Create decoy shell
                      </button>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleSwitchToDecoy}
                          className="w-full rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                        >
                          Switch to decoy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleManualProfileSwitch(state.settings.primaryProfileId)}
                          className="w-full rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                        >
                          Switch to primary
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted">Set decoy PIN</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                        Decoy PIN
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="Enter PIN"
                          value={decoyPinDraft}
                          onChange={(event) => setDecoyPinDraft(event.target.value)}
                          className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                        />
                      </label>
                      <label className="grid gap-2 text-xs uppercase tracking-[0.3em] text-muted">
                        Confirm decoy PIN
                        <input
                          type="password"
                          inputMode="numeric"
                          placeholder="Confirm PIN"
                          value={decoyPinConfirm}
                          onChange={(event) => setDecoyPinConfirm(event.target.value)}
                          className="min-w-0 rounded-xl border border-grid bg-panel px-3 py-2 text-sm text-text"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSetDecoyPin}
                        className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)]"
                      >
                        Save decoy PIN
                      </button>
                      <button
                        type="button"
                        onClick={clearDecoyPin}
                        className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
                      >
                        Clear decoy PIN
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

        <motion.section
          {...panelMotion}
          className="photon-panel min-w-0 rounded-3xl border border-danger p-5 sm:p-6"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-danger">Panic Wipe</p>
          <p className="mt-2 text-sm text-muted">
            Wipes IndexedDB, localStorage, and cache data on this device. This action is irreversible.
          </p>
          <button
            type="button"
            onClick={() => setPanicOpen(true)}
            className="mt-4 rounded-full border border-danger px-4 py-2 text-xs uppercase tracking-[0.2em] text-danger"
          >
            Open panic wipe
          </button>
        </motion.section>
        </div>
        <Modal title="Confirm panic wipe" open={panicOpen} onClose={() => setPanicOpen(false)}>
          <p className="text-sm text-muted">
            Hold the button for 2 seconds to wipe all local NullCAL data. This cannot be undone.
          </p>
          <button
            type="button"
            onPointerDown={handlePanicHoldStart}
            onPointerUp={handlePanicHoldEnd}
            onPointerLeave={handlePanicHoldEnd}
            className="mt-4 w-full rounded-xl bg-danger px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            Hold to wipe
          </button>
        </Modal>
        <Modal title="Theme Packs" open={themeBrowserOpen} onClose={() => setThemeBrowserOpen(false)}>
          <div className="space-y-3 text-sm text-muted">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-[0.3em] text-muted">Current</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-text">{activeTheme.name}</span>
            </div>
            <p className="text-xs text-muted">Select a theme pack to restyle the entire interface.</p>
            <ThemePicker
              themes={themeOptions}
              activeId={state.settings.palette}
              onSelect={(nextPalette) => {
                const nextTheme =
                  themeOptions.find((theme) => theme.id === nextPalette)?.mode ?? state.settings.theme;
                updateSettings({ palette: nextPalette, theme: nextTheme });
                setThemeBrowserOpen(false);
              }}
            />
          </div>
        </Modal>
      </RouteErrorBoundary>
    </AppShell>
  );
};

export default SafetyCenter;
