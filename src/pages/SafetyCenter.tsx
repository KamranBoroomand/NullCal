import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Modal from '../components/Modal';
import { useAppStore } from '../app/AppStore';
import { useToast } from '../components/ToastProvider';
import AppShell from '../app/AppShell';
import TopBar from '../app/TopBar';
import SideBar from '../app/SideBar';

const formatDate = (value?: string) => {
  if (!value) {
    return 'Never';
  }
  return new Date(value).toLocaleString();
};

const SafetyCenter = () => {
  const reduceMotion = useReducedMotion();
  const {
    state,
    lockNow,
    updateSettings,
    setActiveProfile,
    createProfile,
    resetProfile,
    toggleCalendarVisibility,
    setPin,
    clearPin,
    exportEncrypted,
    importEncrypted,
    panicWipe
  } = useAppStore();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportConfirm, setExportConfirm] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [pinDraft, setPinDraft] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [panicOpen, setPanicOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    document.title = 'NullCal — Safety Center';
  }, []);

  if (!state) {
    return null;
  }

  const activeProfile = state.profiles.find((profile) => profile.id === state.settings.activeProfileId) ?? state.profiles[0];
  const calendars = useMemo(() => {
    if (!activeProfile) {
      return [];
    }
    return state.calendars.filter((calendar) => calendar.profileId === activeProfile.id);
  }, [activeProfile, state.calendars]);

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
    const confirmed = window.confirm('Reset this profile back to default calendars and events?');
    if (!confirmed) {
      return;
    }
    resetProfile(activeProfile.id);
  };

  const handleQuickExport = async () => {
    const passphrase = window.prompt('Create a passphrase to encrypt this backup.');
    if (!passphrase) {
      return;
    }
    try {
      const payload = await exportEncrypted(passphrase);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
    { label: 'PIN enabled', value: state.securityPrefs.pinEnabled },
    { label: 'Auto-lock enabled', value: state.settings.autoLockMinutes > 0 },
    { label: 'Network lock enabled', value: state.settings.networkLock },
    { label: 'Secure mode enabled', value: state.settings.secureMode },
    {
      label: 'Recent encrypted backup (14 days)',
      value: state.settings.lastExportAt
        ? Date.now() - new Date(state.settings.lastExportAt).getTime() < 14 * 24 * 60 * 60 * 1000
        : false
    }
  ];
  const score = securityScoreChecklist.filter((item) => item.value).length;

  const handleExport = async () => {
    if (!exportPassphrase || exportPassphrase !== exportConfirm) {
      notify('Passphrases do not match.', 'error');
      return;
    }
    try {
      const payload = await exportEncrypted(exportPassphrase);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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

  const handleImport = async () => {
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
    setPinDraft('');
    setPinConfirm('');
    notify('PIN set. Lock screen enabled.', 'success');
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

  return (
    <AppShell
      topBar={
        <TopBar
          profiles={state.profiles.map((profile) => ({ id: profile.id, name: profile.name }))}
          activeProfileId={activeProfile?.id ?? ''}
          onProfileChange={setActiveProfile}
          onCreateProfile={handleCreateProfile}
          onOpenSettings={() => setSettingsOpen(true)}
          onLockNow={lockNow}
          onHome={() => navigate('/')}
          theme={state.settings.theme}
          onThemeChange={(theme) => updateSettings({ theme })}
          networkLocked={state.settings.networkLock}
        />
      }
      sidebar={
        <SideBar
          selectedDate={currentDate}
          onSelectDate={setCurrentDate}
          calendars={calendars}
          onToggleCalendar={toggleCalendarVisibility}
          onNewEvent={() => {
            navigate('/');
          }}
          onExport={handleQuickExport}
          onImport={handleQuickImport}
          onResetProfile={handleResetProfile}
        />
      }
    >
      <div className="space-y-6">
      <motion.section {...panelMotion} className="photon-panel rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Safety Center</p>
            <h1 className="mt-2 text-2xl font-semibold text-text">Privacy & Security</h1>
          </div>
          <div className="rounded-2xl border border-grid bg-panel2 px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Security Score</p>
            <p className="text-2xl font-semibold text-accent">{score}/5</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Privacy Status</p>
            <ul className="mt-2 space-y-1">
              <li>
                Storage: <span className="text-text">Local IndexedDB</span>
              </li>
              <li>
                Network: <span className="text-text">{state.settings.networkLock ? 'Blocked' : 'Unlocked'}</span>
              </li>
              <li>
                Sync: <span className="text-text">Off</span>
              </li>
              <li>
                Encrypted export: <span className="text-text">Available</span>
              </li>
              <li>
                Last export: <span className="text-text">{formatDate(state.settings.lastExportAt)}</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Checklist</p>
            <ul className="mt-2 space-y-1">
              {securityScoreChecklist.map((item) => (
                <li key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className={item.value ? 'text-accent' : 'text-muted'}>
                    {item.value ? 'Enabled' : 'Off'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>

      <motion.section {...panelMotion} className="grid gap-6 lg:grid-cols-2">
        <div className="photon-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Lock Screen</p>
          <div className="mt-4 space-y-4 text-sm text-muted">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted">Set PIN</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="New PIN"
                  value={pinDraft}
                  onChange={(event) => setPinDraft(event.target.value)}
                  className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="Confirm PIN"
                  value={pinConfirm}
                  onChange={(event) => setPinConfirm(event.target.value)}
                  className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSetPin}
                  className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14]"
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
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-muted">Auto-lock (minutes)</label>
              <input
                type="number"
                min={0}
                max={120}
                value={state.settings.autoLockMinutes}
                onChange={(event) =>
                  updateSettings({ autoLockMinutes: Number(event.target.value || 0) })
                }
                className="mt-2 w-full rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
              />
              <p className="mt-2 text-xs text-muted">
                Set to 0 to disable inactivity lock.
              </p>
            </div>
          </div>
        </div>

        <div className="photon-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Privacy Controls</p>
          <div className="mt-4 space-y-4 text-sm text-muted">
            <label className="flex items-center justify-between">
              <span>Network lock (default on)</span>
              <input
                type="checkbox"
                checked={state.settings.networkLock}
                onChange={(event) => updateSettings({ networkLock: event.target.checked })}
                className="h-4 w-4 rounded border-grid text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Secure mode (hide event titles)</span>
              <input
                type="checkbox"
                checked={state.settings.secureMode}
                onChange={(event) => updateSettings({ secureMode: event.target.checked })}
                className="h-4 w-4 rounded border-grid text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Blur sensitive info</span>
              <input
                type="checkbox"
                checked={state.settings.blurSensitive}
                onChange={(event) => updateSettings({ blurSensitive: event.target.checked })}
                className="h-4 w-4 rounded border-grid text-accent focus:ring-accent"
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Scanline overlay</span>
              <input
                type="checkbox"
                checked={state.settings.scanlines}
                onChange={(event) => updateSettings({ scanlines: event.target.checked })}
                className="h-4 w-4 rounded border-grid text-accent focus:ring-accent"
              />
            </label>
          </div>
        </div>
      </motion.section>

      <motion.section {...panelMotion} className="grid gap-6 lg:grid-cols-2">
        <div className="photon-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Encrypted Export</p>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <input
              type="password"
              placeholder="Passphrase"
              value={exportPassphrase}
              onChange={(event) => setExportPassphrase(event.target.value)}
              className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
            />
            <input
              type="password"
              placeholder="Confirm passphrase"
              value={exportConfirm}
              onChange={(event) => setExportConfirm(event.target.value)}
              className="rounded-xl border border-grid bg-panel2 px-3 py-2 text-sm text-text"
            />
            <button
              type="button"
              onClick={handleExport}
              className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14]"
            >
              Export encrypted
            </button>
          </div>
        </div>

        <div className="photon-panel rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Import Backup</p>
          <div className="mt-4 grid gap-3 text-sm text-muted">
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
              onClick={handleImport}
              className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted"
            >
              Import
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section {...panelMotion} className="photon-panel rounded-3xl p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Threat Model Hints</p>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-muted">
          <li>Keep your device lock enabled when stepping away.</li>
          <li>Avoid storing sensitive plans on shared computers.</li>
          <li>Export an encrypted backup before major changes.</li>
          <li>Private browsing does not protect local device storage.</li>
        </ul>
      </motion.section>

      <motion.section {...panelMotion} className="photon-panel rounded-3xl border border-danger p-6">
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
      </div>
      <Modal title="Settings" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="grid gap-3 text-sm text-muted">
          <p>
            Profile: <span className="text-text">{activeProfile?.name}</span>
          </p>
          <p>
            Storage: <span className="text-text">Local IndexedDB</span>
          </p>
          <button
            onClick={() => {
              setSettingsOpen(false);
              handleResetProfile();
            }}
            className="mt-2 rounded-full border border-grid px-4 py-2 text-xs text-muted transition hover:text-text"
          >
            Reset profile data
          </button>
        </div>
      </Modal>
    </AppShell>
  );
};

export default SafetyCenter;
