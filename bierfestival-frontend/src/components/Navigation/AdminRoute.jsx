import React from 'react';
import { Outlet } from 'react-router-dom';
import { useUser } from '../../admin/contexts/UserContext';
import keycloakService from '../../services/keycloakService';

const AdminRoute = () => {
    const { keycloakInstance, loadingKeycloak } = useUser();

    if (loadingKeycloak) {
        return <div className="admin-loading">Verifying authentication...</div>;
    }

    if (!keycloakInstance?.authenticated) {
        keycloakService.login();
        return <div className="admin-loading">Redirecting to login...</div>;
    }

    if (!keycloakInstance.hasRealmRole('admin')) {
        return <div className="admin-error">Access denied. Administrator privileges required.</div>;
    }

    return <Outlet />;
};

export default AdminRoute;