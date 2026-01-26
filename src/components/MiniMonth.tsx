import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek
} from 'date-fns';

const weekLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type MiniMonthProps = {
  selectedDate: Date;
  onSelect: (date: Date) => void;
};

const MiniMonth = ({ selectedDate, onSelect }: MiniMonthProps) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="rounded-2xl border border-grid bg-panel p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-muted">
        <span>{format(selectedDate, 'MMMM')}</span>
        <span>{format(selectedDate, 'yyyy')}</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] text-muted">
        {weekLabels.map((label) => (
          <div key={label} className="text-center">
            {label}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1 text-[11px]">
        {days.map((date) => {
          const isCurrentMonth = isSameMonth(date, selectedDate);
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={`h-7 rounded-lg text-center transition ${
                isSelected
                  ? 'bg-accent text-[#0b0f14] shadow-glow'
                  : isCurrentMonth
                    ? 'text-text hover:bg-panel2'
                    : 'text-muted hover:bg-panel2'
              }`}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniMonth;
