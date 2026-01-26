import { useEffect, useState } from 'react';
import { format } from 'date-fns';

const Clock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="text-right text-xs">
      <div className="font-mono text-sm text-text">
        {format(now, 'HH')}
        <span className="px-0.5 text-accent">:</span>
        {format(now, 'mm')}
        <span className="px-0.5 text-accent">:</span>
        {format(now, 'ss')}
      </div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted">{format(now, 'EEE, MMM d')}</div>
    </div>
  );
};

export default Clock;
