import type { ThemePack } from '../theme/themePacks';

type ThemePickerProps = {
  themes: ThemePack[];
  activeId: string;
  onSelect: (id: string) => void;
};

const ThemePicker = ({ themes, activeId, onSelect }: ThemePickerProps) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {themes.map((theme) => {
      const isActive = theme.id === activeId;
      return (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          className={`min-w-0 rounded-2xl border px-4 py-3 text-left text-xs uppercase tracking-[0.25em] transition ${
            isActive
              ? 'border-accent bg-[color-mix(in srgb,var(--accent) 15%, transparent)] text-text'
              : 'border-grid bg-panel2 text-muted hover:text-text'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px]">{theme.name}</span>
            <span className="text-[9px] tracking-[0.2em] text-muted">{theme.mode}</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {theme.preview.map((color) => (
              <span
                key={`${theme.id}-${color}`}
                className="h-3 w-3 rounded-full border border-grid"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </button>
      );
    })}
  </div>
);

export default ThemePicker;
