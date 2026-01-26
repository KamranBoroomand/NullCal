import IconButton from '../components/IconButton';

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
    <path
      d="M9.999 6.1a3.9 3.9 0 1 0 0 7.8 3.9 3.9 0 0 0 0-7.8Zm8.1 3.9a7.9 7.9 0 0 0-.08-1.12l1.87-1.45-1.88-3.26-2.27.88a7.9 7.9 0 0 0-1.94-1.12l-.35-2.4H7.59l-.35 2.4a7.9 7.9 0 0 0-1.94 1.12l-2.27-.88-1.88 3.26 1.87 1.45a8.35 8.35 0 0 0 0 2.24L1.15 12.7l1.88 3.26 2.27-.88c.6.46 1.25.84 1.94 1.12l.35 2.4h4.77l.35-2.4a7.9 7.9 0 0 0 1.94-1.12l2.27.88 1.88-3.26-1.87-1.46c.05-.37.08-.74.08-1.12Z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d={direction === 'left' ? 'M7.5 2.25 4.5 6l3 3.75' : 'M4.5 2.25 7.5 6l-3 3.75'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type ProfileOption = {
  id: string;
  name: string;
};

type TopBarProps = {
  view: 'timeGridWeek' | 'dayGridMonth';
  onViewChange: (view: 'timeGridWeek' | 'dayGridMonth') => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  profiles: ProfileOption[];
  activeProfileId: string;
  onProfileChange: (id: string) => void;
  onCreateProfile: () => void;
  onOpenSettings: () => void;
};

const TopBar = ({
  view,
  onViewChange,
  onToday,
  onPrev,
  onNext,
  search,
  onSearchChange,
  profiles,
  activeProfileId,
  onProfileChange,
  onCreateProfile,
  onOpenSettings
}: TopBarProps) => (
  <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-4 text-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.4em] text-white">
        NULLCAL
      </div>
      <button
        onClick={onToday}
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
      >
        Today
      </button>
      <div className="flex items-center gap-2">
        <IconButton label="Previous" onClick={onPrev}>
          <ChevronIcon direction="left" />
        </IconButton>
        <IconButton label="Next" onClick={onNext}>
          <ChevronIcon direction="right" />
        </IconButton>
      </div>
    </div>
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
      <button
        onClick={() => onViewChange('timeGridWeek')}
        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
          view === 'timeGridWeek' ? 'bg-accent text-white shadow-glow' : 'text-white/60'
        }`}
      >
        Week
      </button>
      <button
        onClick={() => onViewChange('dayGridMonth')}
        className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] transition ${
          view === 'dayGridMonth' ? 'bg-accent text-white shadow-glow' : 'text-white/60'
        }`}
      >
        Month
      </button>
    </div>
    <div className="ml-auto flex items-center gap-3">
      <div className="relative">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search events"
          className="h-10 w-56 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/80 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={activeProfileId}
          onChange={(event) => onProfileChange(event.target.value)}
          className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/80"
        >
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id} className="bg-[#0f141b]">
              {profile.name}
            </option>
          ))}
        </select>
        <button
          onClick={onCreateProfile}
          className="h-10 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/70 transition hover:text-white"
        >
          + Profile
        </button>
      </div>
      <IconButton label="Settings" onClick={onOpenSettings}>
        <SettingsIcon />
      </IconButton>
    </div>
  </div>
);

export default TopBar;
