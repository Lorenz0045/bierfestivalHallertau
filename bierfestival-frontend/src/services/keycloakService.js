import Keycloak from 'keycloak-js';

// KC_HOSTNAME aus docker-compose.yml ist hier wichtig für die URL
const keycloakConfig = {
  url: 'https://keycloak.qordio.de',                                    
  realm: 'qordio', 
  clientId: 'qordio-frontend', // Frontend-Client-ID in Keycloak
};

const kc = new Keycloak(keycloakConfig);
let initialized = false; // Flag, um Mehrfachinitialisierung zu verhindern

/**
 * Initialisiert die Keycloak-Instanz.
 * @param {function} onAuthenticated Callback, der nach erfolgreicher Authentifizierung aufgerufen wird.
 * @param {function} onAuthError Callback, der bei einem Authentifizierungsfehler aufgerufen wird.
 */
const initKeycloak = (onAuthenticated, onAuthError) => {
  if (initialized) {
    console.warn("Keycloak instance already initialized or initialization in progress.");
    if (kc.authenticated !== undefined) { // Prüft, ob eine vorherige init() einen Zustand gesetzt hat
        onAuthenticated(kc.authenticated ? kc : null);
    }
    return;
  }
  initialized = true; // Setze das Flag sofort, um parallele Aufrufe zu blockieren
  
    kc.init({
    onLoad: 'check-sso', // Prüft, ob der Benutzer bereits eine SSO-Sitzung hat
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    pkceMethod: 'S256', // Empfohlen für Public Clients
  })
    .then((authenticated) => {
      if (authenticated) {
        console.log("User is authenticated");
        onAuthenticated(kc);
      } else {
        console.log("User is not authenticated");
        onAuthenticated(null); // Kein Keycloak-Objekt übergeben, wenn nicht authentifiziert
      }
    })
    .catch((error) => {
      console.error("Keycloak init failed:", error);
      initialized = false; 
      onAuthError(error);
    });

  kc.onTokenExpired = () => {
    kc.updateToken(30) // Versucht, Token 30 Sekunden vor Ablauf zu erneuern
      .then(refreshed => {
        if (refreshed) {
          console.log('Token was successfully refreshed');
        } else {
          console.log('Token is still valid');
        }
      })
      .catch(() => {
        console.error('Failed to refresh token or session expired');
        // Hier Logout erzwingen
        kc.logout();
      });
  };
};

const login = () => kc.login();
const logout = (redirectUri = window.location.origin) => kc.logout({ redirectUri });
const register = () => kc.register();
const accountManagement = () => kc.accountManagement(); 

const getToken = () => kc.token;
const getTokenParsed = () => kc.tokenParsed;
const isAuthenticated = () => !!kc.token; 
const updateToken = (minValidity) => kc.updateToken(minValidity);

export default {
  initKeycloak,
  login,
  logout,
  register,
  accountManagement,
  getToken,
  getTokenParsed,
  isAuthenticated,
  updateToken,
  keycloakInstance: kc, 
  isInitialized: () => initialized, 
};