import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navigation/Navbar'; // .jsx ist optional beim Import
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage';
import LocationsPage from './pages/LocationsPage';
import LocationsDetailPage from './pages/LocationsDetailPage';
import BarPage from './pages/BarPage';
import CartPage from './pages/CartPage';
import MealsPage from './pages/MealsPage';
import AccountPage from './pages/AccountPage';
import LoginPage from './pages/LoginPage';
import { UserProvider } from './contexts/UserContext';
import ScrollToTop from './components/UI/ScrollToTop';
// Admin-Page Imports
import AdminRoute from './components/Navigation/AdminRoute';
import DashboardOverview from './components/Admin/DashboardOverview';
import ManageCocktails from './components/Admin/ManageCocktailsPage';
import ProtectedRoute from './components/Navigation/ProtectedRoute';
import AdminPage from './pages/AdminPage'; 

function App() {
  return (
    <Router>
      <ScrollToTop />
      <UserProvider> {/* UserContext umschließt alles */}
        <Navbar /> {/* Navbar immer anzeigen */}
        <main> {/* main content wird dynamisch über die simulierten Routen geladen */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/locations/:locationId" element={<LocationsDetailPage />} />
            <Route path="/bar" element={<BarPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/meals" element={<MealsPage />} />
            <Route path="/login" element={<LoginPage />} />
            {/* <Route path="/impressum" element={<ImpressumPage />} /> */}
            <Route path="/account" element={<ProtectedRoute />}>
              <Route path="" element={<AccountPage />} />
            </Route>
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute />}>
              <Route path="" element={<AdminPage />}> {/* Layout-Route */}
                <Route index element={<Navigate to="dashboard" replace />} /> {/* Standard für /admin */}
                <Route path="dashboard" element={<DashboardOverview />} />
                
                {/* Content Management - Hauptseite und Unterrouten */}
                <Route path="content" element={<Outlet/>}> {/* Wrapper für Content-Unterrouten */}
                   <Route index element={<Navigate to="cocktail" replace />} /> {/* Standard für /admin/content */}
                   <Route path="cocktail" element={<ManageCocktails />} /> 
                </Route>

                {/* Lookup Tabellen Management - Hauptseite und Unterrouten */}
                <Route path="lookups" element={<Outlet/>}> {/* Nur Outlet für Unterrouten */}
                    {/* TODO: */}
                </Route>
              </Route>
            </Route>
            {/* Fallback-Route für nicht gefundene Pfade */}
            <Route path="*" element={<div>404 Seite nicht gefunden</div>} /> 
          </Routes>
        </main>
        <Footer /> {/* Footer immer anzeigen */}
      </UserProvider>
    </Router>
  );
}

export default App;