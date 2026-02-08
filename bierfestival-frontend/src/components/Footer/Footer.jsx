import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import { useUser } from '../../contexts/UserContext';

const Footer = () => {
  const { keycloakInstance, loadingKeycloak } = useUser();
  const isAuthenticated = !loadingKeycloak && keycloakInstance && keycloakInstance.authenticated;

  return (
    <footer className={styles.footerContainer}>
      {/* TODO: */}
    </footer>
  );
};

export default Footer;