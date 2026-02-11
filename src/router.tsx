import { createBrowserRouter, Outlet, useLocation, useRouteError } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Suspense, lazy, useEffect } from 'react';

const AppPage = lazy(() => import('./pages/AppPage'));
const SafetyCenter = lazy(() => import('./pages/SafetyCenter'));
const HomePage = lazy(() => import('./pages/Home'));
const AboutPage = lazy(() => import('./pages/About'));
const PrivacyPage = lazy(() => import('./pages/Privacy'));
const ContactPage = lazy(() => import('./pages/Contact'));

const RouteLoading = () => (
  <div className="flex min-h-screen items-center justify-center px-6 text-sm text-muted">Loading route…</div>
);

const RouteErrorScreen = () => {
  const error = useRouteError();
  const location = useLocation();
  const errorDetails = error instanceof Error ? error : null;

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
        {import.meta.env.DEV && errorDetails && (
          <div className="mt-4 rounded-2xl border border-grid bg-panel2 p-4 text-left text-xs text-muted">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Debug details</p>
            <p className="mt-2 font-mono text-[11px] text-text">{errorDetails.message}</p>
            {errorDetails.stack && (
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-muted">{errorDetails.stack}</pre>
            )}
          </div>
        )}
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
          element: (
            <Suspense fallback={<RouteLoading />}>
              <AppPage />
            </Suspense>
          )
        },
        {
          path: '/safety',
          element: (
            <Suspense fallback={<RouteLoading />}>
              <SafetyCenter />
            </Suspense>
          )
        },
        {
          path: '/home',
          element: (
            <Suspense fallback={<RouteLoading />}>
              <HomePage />
            </Suspense>
          )
        },
        {
          path: '/about',
          element: (
            <Suspense fallback={<RouteLoading />}>
              <AboutPage />
            </Suspense>
          )
        },
        {
          path: '/privacy',
          element: (
            <Suspense fallback={<RouteLoading />}>
              <PrivacyPage />
            </Suspense>
          )
        },
        {
          path: '/contact',
          element: (
            <Suspense fallback={<RouteLoading />}>
              <ContactPage />
            </Suspense>
          )
        }
      ]
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export default router;
