import { Fragment } from 'react';
import type { ReactNode } from 'react';

type SegmentedItem = {
  key: string;
  label: ReactNode;
  onClick: () => void;
  active?: boolean;
  icon?: ReactNode;
};

type SegmentedProps = {
  items: SegmentedItem[];
  ariaLabel: string;
};

const Segmented = ({ items, ariaLabel }: SegmentedProps) => (
  <div
    role="group"
    aria-label={ariaLabel}
    className="inline-flex h-9 overflow-hidden rounded-full border border-grid bg-panel"
  >
    {items.map((item, index) => (
      <Fragment key={item.key}>
        {index > 0 && <span className="h-full w-px bg-grid" aria-hidden="true" />}
        <button
          type="button"
          onClick={item.onClick}
          aria-pressed={item.active}
          className={`inline-flex h-9 items-center justify-center gap-2 px-4 text-xs uppercase tracking-[0.18em] transition ${
            item.active ? 'bg-accent text-[var(--accentText)]' : 'text-muted hover:bg-panel2 hover:text-text'
          }`}
        >
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          <span className={item.icon ? 'sr-only' : undefined}>{item.label}</span>
        </button>
      </Fragment>
    ))}
  </div>
);

export default Segmented;
