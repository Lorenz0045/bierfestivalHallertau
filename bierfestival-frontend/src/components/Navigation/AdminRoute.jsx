import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useUser } from '../../admin/contexts/UserContext';
import keycloakService from '../../services/keycloakService';

const AdminRoute = () => {
    const { keycloakInstance, loadingKeycloak } = useUser();

    useEffect(() => {
        if (!loadingKeycloak) {
            const isAuthenticated = keycloakInstance?.authenticated;
            
            if (!isAuthenticated) {
                keycloakService.login();
            }
        }
    }, [loadingKeycloak, keycloakInstance]);

    // 1. Lade-Zustand
    if (loadingKeycloak) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Prüfe Authentifizierung...</div>;
    }

    // 2. Nicht authentifiziert (Der useEffect feuert parallel den Login ab)
    if (!keycloakInstance?.authenticated) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Weiterleitung zum Login...</div>;
    }

    // 3. Authentifiziert, aber keine Admin-Rolle
    if (!keycloakInstance.hasRealmRole('admin')) {
        return (
            <div style={{ padding: '2rem', color: '#e63946', textAlign: 'center' }}>
                Zugriff verweigert. Admin-Rechte erforderlich.
            </div>
        );
    }

    // 4. Alles im grünen Bereich: Zeige den Admin-Bereich
    return <Outlet />;
};

export default AdminRoute;