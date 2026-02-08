import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navigation/Navbar'; // .jsx ist optional beim Import
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';

import ScrollToTop from './components/UI/ScrollToTop';

// Admin-Page Imports
import AdminRoute from './components/Navigation/AdminRoute';
import ProtectedRoute from './components/Navigation/ProtectedRoute';
import AdminPage from './pages/AdminPage'; 

function App() {
  return (
    <Router>
      <ScrollToTop />
      
        <Navbar /> {/* Navbar immer anzeigen */}
        <main> {/* main content wird dynamisch über die simulierten Routen geladen */}
          <Routes>
            <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
            {/* <Route path="/impressum" element={<ImpressumPage />} /> */}
            <Route path="/account" element={<ProtectedRoute />}>
              <Route path="" element={<AccountPage />} />
            </Route>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="" element={<AdminPage />}> 
                <Route index element={<Navigate to="dashboard" replace />} /> 
              </Route>
            </Route>
            {/* Fallback-Route für nicht gefundene Pfade */}
            <Route path="*" element={<div>404 Seite nicht gefunden</div>} /> 
          </Routes>
        </main>
        <Footer /> {/* Footer immer anzeigen */}
      
    </Router>
  );
}

export default App;