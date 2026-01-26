import { createBrowserRouter } from 'react-router-dom';
import AppPage from './pages/AppPage';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppPage />
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
);

export default router;
