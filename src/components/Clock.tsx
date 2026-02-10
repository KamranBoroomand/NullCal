import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import Modal from './Modal';
import { useAppStore } from '../app/AppStore';

const Clock = () => {
  const [now, setNow] = useState(() => new Date());
  const [neofetchOpen, setNeofetchOpen] = useState(false);
  const clickCountRef = useRef(0);
  const resetTimer = useRef<number | null>(null);
  const { state } = useAppStore();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const userAgentData = (
    navigator as Navigator & { userAgentData?: { brands?: { brand: string; version: string }[]; platform?: string } }
  ).userAgentData;
  const platform = userAgentData?.platform ?? navigator.platform ?? 'Unknown';
  const userAgent = navigator.userAgent || 'Unknown';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  const locale = navigator.language || 'Unknown';
  const screenInfo = `${window.screen.width}×${window.screen.height}`;
  const deviceType = navigator.maxTouchPoints > 0 ? 'Touch device' : 'Desktop';
  const cpuCores = navigator.hardwareConcurrency || 0;
  const colorDepth = window.screen.colorDepth;
  const connectionType = (
    navigator as Navigator & { connection?: { effectiveType?: string } }
  ).connection?.effectiveType;
  const secureModeStatus = state?.settings.secureMode ? 'Enabled' : 'Off';
  const maskedIp = useMemo(() => {
    const bytes = new Uint8Array(3);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      bytes[0] = Math.floor(Math.random() * 254) + 1;
      bytes[1] = Math.floor(Math.random() * 254) + 1;
      bytes[2] = Math.floor(Math.random() * 254) + 1;
    }
    return `10.${bytes[0]}.${bytes[1]}.x`;
  }, []);
  const osLabel = useMemo(() => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) {
      return 'Windows';
    }
    if (ua.includes('mac')) {
      return 'macOS';
    }
    if (ua.includes('linux')) {
      return 'Linux';
    }
    if (ua.includes('android')) {
      return 'Android';
    }
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
      return 'iOS';
    }
    return 'Unknown';
  }, [userAgent]);

  const browserLabel = useMemo(() => {
    if (userAgentData?.brands?.length) {
      return userAgentData.brands.map((brand) => `${brand.brand} ${brand.version}`).join(', ');
    }
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg/')) {
      return 'Microsoft Edge';
    }
    if (ua.includes('chrome/')) {
      return 'Chrome';
    }
    if (ua.includes('safari/') && !ua.includes('chrome/')) {
      return 'Safari';
    }
    if (ua.includes('firefox/')) {
      return 'Firefox';
    }
    return 'Unknown';
  }, [userAgent, userAgentData]);

  const uptime = useMemo(() => {
    const totalSeconds = Math.floor(performance.now() / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [now]);

  const handleClockClick = () => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= 6) {
      setNeofetchOpen(true);
      clickCountRef.current = 0;
    }
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
    resetTimer.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);
  };

  return (
    <>
      <div
        className="cursor-pointer text-right text-[11px] leading-tight"
        onClick={handleClockClick}
        role="button"
        tabIndex={0}
        aria-label="Open system snapshot"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleClockClick();
          }
        }}
      >
        <div className="font-mono text-[13px] text-text">
          {format(now, 'HH')}
          <span className="clock-colon px-0.5 text-accent">:</span>
          {format(now, 'mm')}
          <span className="clock-colon px-0.5 text-accent">:</span>
          {format(now, 'ss')}
        </div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted">{format(now, 'EEE, MMM d')}</div>
      </div>
      <Modal title="NullID Terminal" open={neofetchOpen} onClose={() => setNeofetchOpen(false)}>
        <div className="space-y-3 text-xs text-muted">
          <div className="rounded-2xl border border-grid bg-black/80 p-4 font-mono text-[11px] text-emerald-200">
            <div className="flex flex-wrap items-start gap-6">
              <div className="text-emerald-300">
                <pre className="whitespace-pre">
{`      __
  ___( o )__
 / __/  __ \\
 \\__ \\_/  /
    \\__/`}
                </pre>
              </div>
              <div className="min-w-[220px] space-y-1 text-emerald-200">
                <div>
                  <span className="text-emerald-400">NullID Terminal:</span> connected
                </div>
                <div>
                  <span className="text-emerald-400">IP (masked):</span> {maskedIp}
                </div>
                <div>
                  <span className="text-emerald-400">Uptime:</span> {uptime}
                </div>
                <div>
                  <span className="text-emerald-400">Browser:</span> {browserLabel}
                </div>
                <div>
                  <span className="text-emerald-400">User agent:</span> {userAgent}
                </div>
                <div>
                  <span className="text-emerald-400">Platform:</span> {platform}
                </div>
                <div>
                  <span className="text-emerald-400">OS:</span> {osLabel}
                </div>
                <div>
                  <span className="text-emerald-400">Locale:</span> {locale} · {timeZone}
                </div>
                <div>
                  <span className="text-emerald-400">Screen:</span> {screenInfo} · {deviceType}
                </div>
                <div>
                  <span className="text-emerald-400">Memory:</span>{' '}
                  {deviceMemory ? `${deviceMemory} GB` : 'Unavailable'}
                </div>
                <div>
                  <span className="text-emerald-400">CPU cores:</span> {cpuCores || 'Unavailable'}
                </div>
                <div>
                  <span className="text-emerald-400">Color depth:</span> {colorDepth}-bit
                </div>
                <div>
                  <span className="text-emerald-400">Connection:</span>{' '}
                  {connectionType ? connectionType.toUpperCase() : 'Unknown'}
                </div>
                <div>
                  <span className="text-emerald-400">Secure mode:</span> {secureModeStatus}
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted">
            Privacy note: data is local-only, masked, and non-identifiable. No personal data is stored or transmitted.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default Clock;
