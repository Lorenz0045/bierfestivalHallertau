import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import keycloakService from '../../services/keycloakService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [keycloak, setKeycloak] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingKeycloak, setLoadingKeycloak] = useState(true);

  const handleAuthentication = useCallback((kcInstance) => {
    setLoadingKeycloak(false);
    
    if (kcInstance && kcInstance.authenticated) {
      setIsLoggedIn(true);
      setKeycloak(kcInstance);
      
      const tokenProfile = {
        keycloakId: kcInstance.subject,
        username: kcInstance.tokenParsed?.preferred_username || 'Admin',
        email: kcInstance.tokenParsed?.email,
        firstName: kcInstance.tokenParsed?.given_name,
        lastName: kcInstance.tokenParsed?.family_name,
      };
      
      setUserProfile(tokenProfile);
    } else {
      setIsLoggedIn(false);
      setKeycloak(null);
      setUserProfile(null);
    }
  }, []);

  const handleAuthError = useCallback((error) => {
    setLoadingKeycloak(false);
    setIsLoggedIn(false);
    setKeycloak(null);
    setUserProfile(null);
    console.error("Keycloak authentication error:", error);
  }, []);

  useEffect(() => {
    keycloakService.initKeycloak(handleAuthentication, handleAuthError);
  }, [handleAuthentication, handleAuthError]);

  const login = keycloakService.login;
  
  const logout = () => {
    keycloakService.logout();
  };

  return (
    <UserContext.Provider value={{
      isLoggedIn,
      userProfile,
      login,
      logout,
      keycloakInstance: keycloak,
      loadingKeycloak
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