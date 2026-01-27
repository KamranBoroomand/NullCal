import type { ReactNode } from 'react';
import { Component } from 'react';

type RouteErrorBoundaryProps = {
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="photon-panel rounded-3xl p-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">NullCal</p>
          <h2 className="mt-3 text-xl font-semibold text-text">NullCal hit an unexpected error</h2>
          <p className="mt-2 text-sm text-muted">
            Something went wrong while rendering this view. Reload the page to try again.
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

export default RouteErrorBoundary;
