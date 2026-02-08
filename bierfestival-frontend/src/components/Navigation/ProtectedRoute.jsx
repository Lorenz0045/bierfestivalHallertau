import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const ProtectedRoute = () => {
  const { isLoggedIn, loadingKeycloak } = useUser();

  if (loadingKeycloak) {
    return <div>Authentifizierung wird geprüft...</div>;
  }

  if (!isLoggedIn) {
    // Leite zur Login-Seite weiter, wenn der Benutzer nicht eingeloggt ist.
    // 'replace' ersetzt den aktuellen Eintrag in der History,
    // damit der User mit dem Zurück-Button nicht wieder hier landet.
    return <Navigate to="/login" replace />;
  }

  // Wenn eingeloggt, rendere die angeforderte Komponente (z.B. ProfilPage)
  return <Outlet />;
};

export default ProtectedRoute;