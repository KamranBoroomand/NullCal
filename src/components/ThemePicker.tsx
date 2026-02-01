import { useState } from 'react';
import type { ThemePack } from '../theme/themePacks';

type ThemePickerProps = {
  themes: ThemePack[];
  activeId: string;
  onSelect: (id: string) => void;
};

const ThemePicker = ({ themes, activeId, onSelect }: ThemePickerProps) => {
  const [showAll, setShowAll] = useState(false);
  const visibleThemes = showAll ? themes : themes.slice(0, 6);
  const canToggle = themes.length > 6;

  return (
    <div className="space-y-3">
      <div className="flex max-w-full gap-3 overflow-x-auto pb-1 pr-1 sm:grid sm:overflow-visible sm:pb-0 sm:pr-0 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleThemes.map((theme) => {
          const isActive = theme.id === activeId;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              title={theme.description}
              aria-label={`${theme.name} theme pack`}
              className={`group min-w-[220px] rounded-2xl border px-3 py-2 text-left text-xs transition sm:min-w-0 ${
                isActive
                  ? 'border-accent bg-[color-mix(in srgb,var(--accent) 15%, transparent)] text-text'
                  : 'border-grid bg-panel2 text-muted hover:text-text'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold normal-case text-text">{theme.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted">
                    <span className="rounded-full border border-grid px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]">
                      {theme.mode === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {theme.preview.map((color) => (
                    <span
                      key={`${theme.id}-${color}`}
                      className="h-3 w-3 rounded-full border border-grid"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {canToggle && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="rounded-full border border-grid px-4 py-2 text-xs uppercase tracking-[0.2em] text-muted transition hover:text-text"
        >
          {showAll ? 'Show less' : 'Browse all'}
        </button>
      )}
    </div>
  );
};

export default ThemePicker;
