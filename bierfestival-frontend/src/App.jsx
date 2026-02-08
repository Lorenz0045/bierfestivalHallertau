import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navigation/Navbar'; // .jsx ist optional beim Import
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage';
import AccountPage from './admin/AccountPage';
import LoginPage from './admin/LoginPage';

import ScrollToTop from './components/UI/ScrollToTop';

// Admin-Page Imports
import AdminRoute from './components/Navigation/AdminRoute';
import ProtectedRoute from './components/Navigation/ProtectedRoute';
import AdminPage from './admin/AdminPage'; 

// leaflet styling
import 'leaflet/dist/leaflet.css';


function App() {
  return (
    <Router>
      <ScrollToTop />
      
        <Navbar /> {/* Navbar immer anzeigen */}
        <main> {/* main content wird dynamisch über die simulierten Routen geladen */}
          <Routes>
            <Route path="/" element={<HomePage />} />
                        {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
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