import { createBrowserRouter, Outlet, useLocation, useRouteError } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import AppPage from './pages/AppPage';
import SafetyCenter from './pages/SafetyCenter';

const RouteErrorScreen = () => {
  const error = useRouteError();
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error('[NullCal] Router error', { route: location.pathname, error });
    }
  }, [error, location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="photon-panel w-full max-w-lg rounded-3xl p-8 text-center">
        <h1 className="text-lg font-semibold text-text">NullCal hit an unexpected error</h1>
        <p className="mt-2 text-sm text-muted">
          Something went wrong while loading this route. Try reloading the page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-full bg-accent px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accentText)] shadow-glow transition"
        >
          Reload
        </button>
      </div>
    </div>
  );
};

const RouteTransitionShell = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
};

const router = createBrowserRouter(
  [
    {
      element: <RouteTransitionShell />,
      errorElement: <RouteErrorScreen />,
      children: [
        {
          path: '/',
          element: <AppPage />
        },
        {
          path: '/safety',
          element: <SafetyCenter />
        }
      ]
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export default router;
