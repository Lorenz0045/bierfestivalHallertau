import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const { keycloakInstance, isLoggedIn, loadingKeycloak, login, register } = useUser(); // login und register aus dem Context holen
  const navigate = useNavigate();
  const location = useLocation();

  // Wenn der User bereits eingeloggt ist, leite ihn von der Login-Seite weg
  useEffect(() => {
    if (!loadingKeycloak && isLoggedIn) {
      const from = location.state?.from?.pathname || '/account'; // Zurück zur vorherigen Seite oder /account
      navigate(from, { replace: true });
    }
  }, [isLoggedIn, loadingKeycloak, navigate, location.state]);

  const handleLoginClick = () => {
    // Ruft die login Funktion aus dem UserContext auf, die keycloakService.login() ausführt
    login();
  };

  const handleRegisterClick = () => {
    // Ruft die register Funktion aus dem UserContext auf, die keycloakService.register() ausführt
    register();
  };

  if (loadingKeycloak) {
    return <div className={styles.loadingContainer}>Authentifizierung wird geladen...</div>;
  }

  if (isLoggedIn) {
     return <div className={styles.loadingContainer}>Sie sind bereits eingeloggt. Weiterleitung...</div>;
  }

  return (
    <div className={styles.loginPageContainer}>
      <div className={styles.loginFormWrapper}>
        <h1>Willkommen bei qordio</h1>
        <p>Bitte melde dich an oder erstelle ein neues Konto, um fortzufahren.</p>
        <div className={styles.buttonGroup}>
          <button onClick={handleLoginClick} className={styles.actionButton}>
            Anmelden
          </button>
          <button onClick={handleRegisterClick} className={`${styles.actionButton} ${styles.registerButton}`}>
            Registrieren
          </button>
        </div>
        <p className={styles.infoText}>
          Du wirst zur sicheren Anmelde- bzw. Registrierungsseite weitergeleitet.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;