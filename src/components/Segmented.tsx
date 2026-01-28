import { Fragment } from 'react';
import type { ReactNode } from 'react';

type SegmentedItem = {
  key: string;
  label: string;
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
    className="inline-flex h-9 overflow-hidden rounded-full border border-white/10 bg-white/5"
  >
    {items.map((item, index) => (
      <Fragment key={item.key}>
        {index > 0 && <span className="h-full w-px bg-white/10" aria-hidden="true" />}
        <button
          type="button"
          onClick={item.onClick}
          aria-pressed={item.active}
          className={`inline-flex h-9 items-center justify-center gap-2 px-4 text-xs uppercase tracking-[0.18em] transition ${
            item.active
              ? 'bg-accent text-slate-950'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
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
