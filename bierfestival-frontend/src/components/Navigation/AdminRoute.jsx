import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const AdminRoute = () => {
    const { keycloakInstance, loadingKeycloak } = useUser();

    // Zustand 1: Keycloak lädt noch. Zeige eine Ladeanzeige.
    // Prüfung von '!keycloakInstance' fängt den Moment ab, in dem das Laden zwar fertig ist, die Instanz aber noch nicht im State angekommen ist.
    if (loadingKeycloak || !keycloakInstance) {
        return <div>Lade Benutzerinformationen...</div>;
    }

    // Zustand 2: Laden beendet, Instanz ist da.
    const isAuthenticated = keycloakInstance.authenticated;
    const isAdmin = isAuthenticated && keycloakInstance.hasRealmRole('admin');

    // Zustand 2a: Nicht authentifiziert -> zur Login-Seite.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Zustand 2b: Authentifiziert, aber kein Admin -> zu Account
    if (!isAdmin) {
        return <Navigate to="/account" replace />;
    }

    // Zustand 2c: Authentifiziert und Admin -> Zugriff gewähren.
    return <Outlet />;
};

export default AdminRoute;