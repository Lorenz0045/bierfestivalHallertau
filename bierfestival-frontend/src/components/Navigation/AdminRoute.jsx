import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUser } from '../../admin/contexts/UserContext';
import keycloakService from '../../services/keycloakService';

const AdminRoute = () => {
    const { keycloakInstance, loadingKeycloak } = useUser();

    if (loadingKeycloak) {
        return <div style={{ padding: '2rem' }}>Prüfe Authentifizierung...</div>;
    }

    if (!keycloakInstance?.authenticated) {
        // Hier ist der entscheidende Fix für Localhost!
        keycloakService.login({ redirectUri: window.location.origin + '/admin/analytics' });
        return <div style={{ padding: '2rem' }}>Leite zum Login weiter...</div>;
    }

    if (!keycloakInstance.hasRealmRole('admin')) {
        return <div style={{ padding: '2rem', color: 'red' }}>Zugriff verweigert. Admin-Rechte erforderlich.</div>;
    }

    return <Outlet />;
};

export default AdminRoute;