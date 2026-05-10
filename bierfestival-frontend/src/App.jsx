import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './pages/PublicLayout';
import HomePage from './pages/HomePage';
import ProgrammPage from './pages/ProgrammPage';
import SchenkenPage from './pages/SchenkenPage';
import SuchePage from './pages/SuchePage';
import AnreisePage from './pages/AnreisePage';
import MeinBesuchPage from './pages/MeinBesuchPage';
import ImpressumPage from './pages/ImpressumPage';
import DatenschutzPage from './pages/DatenschutzPage';
import NutzungsbedingungenPage from './pages/NutzungsbedingungenPage';
import ScrollToTop from './components/UI/ScrollToTop';
import CookieBanner from './components/UI/CookieBanner';
import 'leaflet/dist/leaflet.css';

// Nur der Admin-Bereich wird lazy geladen
const AdminApp = lazy(() => import('./admin/AdminApp'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#1B5E20' }}>
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
            <Route path="/suche" element={<SuchePage />} />
            <Route path="/anreise" element={<AnreisePage />} />
            <Route path="/programm" element={<ProgrammPage />} />
            <Route path="/schenken" element={<SchenkenPage />} />
            <Route path="/mein-besuch" element={<MeinBesuchPage />} />
            <Route path="/impressum" element={<ImpressumPage />} />
            <Route path="/datenschutz" element={<DatenschutzPage />} />
            <Route path="/nutzungsbedingungen" element={<NutzungsbedingungenPage />} />
            <Route path="*" element={<div style={{ padding: 40, textAlign: 'center' }}>404 – Seite nicht gefunden</div>} />
          </Route>
          
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;