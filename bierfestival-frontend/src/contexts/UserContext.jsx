import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import keycloakService from '../services/keycloakService';
import userService from '../services/userService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null); // Backend-Profil: { keycloakId, username, email, firstName, lastName, locationLimit }
  const [loadingKeycloak, setLoadingKeycloak] = useState(true); 

  

  const fetchAndSetUserProfile = async (kcInstance) => {
    if (kcInstance && kcInstance.authenticated && kcInstance.token) {
      try {
        console.log("UserContext: Authenticated, fetching user profile from backend...");
        const profileFromBackend = await userService.fetchUserProfile(kcInstance.token);
        setUserProfile(profileFromBackend);
        console.log("UserContext: Profile from backend:", profileFromBackend);

      } catch (error) {
        console.error("UserContext: Failed to fetch user profile from backend:", error);
        // Fallback: Basis-Benutzerdaten aus dem Token nehmen
        const tokenProfile = {
          keycloakId: kcInstance.subject,
          username: kcInstance.tokenParsed?.preferred_username || 'User',
          email: kcInstance.tokenParsed?.email,
          firstName: kcInstance.tokenParsed?.given_name,
          lastName: kcInstance.tokenParsed?.family_name,
          locationLimit: null,
        };
        setUserProfile(tokenProfile);
      }
    } else if (!kcInstance || !kcInstance.authenticated) {
        // User ist nicht (mehr) eingeloggt
        setUserProfile(null); // Kein Profil, wenn nicht eingeloggt
    }
  };

  const handleAuthentication = useCallback(async (kcInstance) => {
    setLoadingKeycloak(false);
    if (kcInstance && kcInstance.authenticated) {
      setIsLoggedIn(true);
      setKeycloak(kcInstance);
      await fetchAndSetUserProfile(kcInstance); // Profil laden
    } else {
      setIsLoggedIn(false);
      setKeycloak(null);
      setUserProfile(null); // User ist nicht eingeloggt, kein Profil
    }
  }, []);

  const handleAuthError = useCallback((error) => {
    setLoadingKeycloak(false);
    setIsLoggedIn(false);
    setKeycloak(null);
    setUserProfile(null);
    console.error("UserContext: Keycloak authentication error:", error);
  }, []);

  useEffect(() => {
    keycloakService.initKeycloak(handleAuthentication, handleAuthError);
  }, [handleAuthentication, handleAuthError]);

  
  const login = keycloakService.login;
  const logout = () => {
    keycloakService.logout(); // Keycloak-Logout leitet weiter und löst dann neuen Init-Flow aus
    // Lokale States werden durch den neuen Init-Flow nach Logout zurückgesetzt
  };
  const register = keycloakService.register;

  return (
    <UserContext.Provider value={{
      isLoggedIn,
      userProfile,
      login,
      logout,
      register,
      keycloakInstance: keycloak,
      loadingKeycloak,
      accountManagementUrl: keycloak?.authenticated ? keycloak.createAccountUrl() : null
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};