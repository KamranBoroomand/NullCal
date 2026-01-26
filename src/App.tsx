import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));

const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <div className="app-shell">
      <Header />
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Suspense>
      <Footer />
    </div>
  </BrowserRouter>
);

export default App;
