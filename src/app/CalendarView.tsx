import { useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventInput } from '@fullcalendar/core';

const buildEventStyles = (event: EventInput & { accentColor?: string }) => ({
  backgroundColor: event.backgroundColor,
  borderColor: event.borderColor,
  color: event.textColor,
  borderLeft: event.accentColor ? `4px solid ${event.accentColor}` : undefined
});

type CalendarViewProps = {
  events: EventInput[];
  view: 'timeGridWeek' | 'dayGridMonth';
  date: Date;
  secureMode: boolean;
  blurSensitive: boolean;
  onDateChange: (date: Date) => void;
  onSelectRange: (start: Date, end: Date, allDay: boolean) => void;
  onDateClick: (date: Date) => void;
  onEventClick: (id: string) => void;
  onEventChange: (id: string, start: Date, end: Date) => void;
};

const CalendarView = ({
  events,
  view,
  date,
  secureMode,
  blurSensitive,
  onDateChange,
  onSelectRange,
  onDateClick,
  onEventClick,
  onEventChange
}: CalendarViewProps) => {
  const calendarRef = useRef<FullCalendar | null>(null);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }
    api.changeView(view);
  }, [view]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }
    const current = api.getDate();
    if (current.getTime() === date.getTime()) {
      return;
    }
    api.gotoDate(date);
  }, [date]);

  return (
    <div className={`photon-panel rounded-3xl p-4 ${secureMode ? 'secure-mode' : ''} ${blurSensitive ? 'blur-sensitive' : ''}`}>
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        height="auto"
        events={events}
        nowIndicator
        selectable
        editable
        dayMaxEvents
        allDaySlot={view === 'timeGridWeek'}
        slotMinTime="06:00:00"
        slotMaxTime="24:00:00"
        initialDate={new Date()}
        datesSet={(info) => {
          const next = info.view.calendar.getDate();
          if (next.getTime() !== date.getTime()) {
            onDateChange(next);
          }
        }}
        select={(info) => onSelectRange(info.start, info.end, info.allDay)}
        dateClick={(info) => onDateClick(info.date)}
        eventClick={(info) => onEventClick(info.event.id)}
        eventDrop={(info) => {
          if (info.event.start && info.event.end) {
            onEventChange(info.event.id, info.event.start, info.event.end);
          }
        }}
        eventResize={(info) => {
          if (info.event.start && info.event.end) {
            onEventChange(info.event.id, info.event.start, info.event.end);
          }
        }}
        eventContent={(arg) => {
          const accentColor = arg.event.extendedProps.accentColor as string | undefined;
          return (
            <div
              className="rounded-lg px-2 py-1"
              style={buildEventStyles({
                backgroundColor: arg.event.backgroundColor,
                borderColor: arg.event.borderColor,
                textColor: arg.event.textColor,
                accentColor
              })}
            >
              <div className="text-[11px] font-semibold leading-snug" style={{ color: arg.event.textColor }}>
                {arg.event.title}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default CalendarView;
