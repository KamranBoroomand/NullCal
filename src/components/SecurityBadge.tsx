type SecurityBadgeProps = {
  networkLocked: boolean;
};

const SecurityBadge = ({ networkLocked }: SecurityBadgeProps) => (
  <div className="flex min-w-0 shrink items-center gap-2 whitespace-nowrap rounded-full border border-grid bg-panel px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-muted">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-accent">
      <path
        d="M12 3 20 6v6c0 5.25-3.5 8.8-8 10-4.5-1.2-8-4.75-8-10V6l8-3Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
    <span>Local-only</span>
    <span className={networkLocked ? 'text-accent' : 'text-danger'}>
      {networkLocked ? 'Network locked' : 'Network open'}
    </span>
  </div>
);

export default SecurityBadge;
