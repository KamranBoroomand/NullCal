import type { ThemePack } from '../theme/themePacks';

type ThemePickerProps = {
  themes: ThemePack[];
  activeId: string;
  onSelect: (id: string) => void;
};

const ThemePicker = ({ themes, activeId, onSelect }: ThemePickerProps) => (
  <div className="flex max-w-full flex-nowrap items-center gap-3 overflow-x-auto pb-1 pr-1">
    {themes.map((theme) => {
      const isActive = theme.id === activeId;
      return (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme.id)}
          title={theme.description}
          aria-label={`${theme.name} theme pack`}
          className={`group shrink-0 rounded-2xl border px-3 py-2 text-left text-[11px] uppercase tracking-[0.22em] transition ${
            isActive
              ? 'border-accent bg-[color-mix(in srgb,var(--accent) 15%, transparent)] text-text'
              : 'border-grid bg-panel2 text-muted hover:text-text'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {theme.preview.map((color) => (
                <span
                  key={`${theme.id}-${color}`}
                  className="h-3 w-3 rounded-full border border-grid"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-1 leading-none">
              <span className="whitespace-nowrap text-[11px]">{theme.name}</span>
              <span className="text-[9px] tracking-[0.2em] text-muted">{theme.mode}</span>
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

export default ThemePicker;
