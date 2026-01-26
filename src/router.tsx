import { createBrowserRouter } from 'react-router-dom';
import AppPage from './pages/AppPage';

const ErrorFallback = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="photon-panel w-full max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/70">
          The calendar hit an unexpected error. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-glow transition hover:bg-accentSoft"
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
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export default router;
