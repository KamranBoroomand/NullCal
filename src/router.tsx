import { createBrowserRouter } from 'react-router-dom';
import AppPage from './pages/AppPage';
import SafetyCenter from './pages/SafetyCenter';

const ErrorFallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="photon-panel w-full max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-lg font-semibold text-text">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          The calendar hit an unexpected error. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0f14] shadow-glow transition"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppPage />,
      errorElement: <ErrorFallback />
    },
    {
      path: '/safety',
      element: <SafetyCenter />,
      errorElement: <ErrorFallback />
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export default router;
