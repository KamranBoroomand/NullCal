import type { ReactNode } from 'react';
import { Component } from 'react';

type CalendarErrorBoundaryProps = {
  children: ReactNode;
};

type CalendarErrorBoundaryState = {
  hasError: boolean;
};

class CalendarErrorBoundary extends Component<CalendarErrorBoundaryProps, CalendarErrorBoundaryState> {
  state: CalendarErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="photon-panel rounded-3xl p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Calendar</p>
          <h2 className="mt-3 text-xl font-semibold text-text">Calendar failed to load</h2>
          <p className="mt-2 text-sm text-muted">
            Something went wrong while rendering the calendar. Reload the page to try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-accent px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14]"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CalendarErrorBoundary;
