import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './pages/PublicLayout';
import HomePage from './pages/HomePage';
import ProgrammPage from './pages/ProgrammPage';
import ScrollToTop from './components/UI/ScrollToTop';
import CookieBanner from './components/UI/CookieBanner';
import 'leaflet/dist/leaflet.css';

const AdminApp = lazy(() => import('./admin/AdminApp'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#2d6a4f' }}>
    Lade...
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <CookieBanner />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/programm" element={<ProgrammPage />} />
            <Route path="*" element={<div>404 Seite nicht gefunden</div>} />
          </Route>
          
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;