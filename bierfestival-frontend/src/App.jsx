import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicLayout from './pages/PublicLayout';
import HomePage from './pages/HomePage';
import ScrollToTop from './components/UI/ScrollToTop';
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
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="*" element={<div>404 Seite nicht gefunden</div>} />
          </Route>
          
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;