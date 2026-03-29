import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import keycloakService from '../services/keycloakService';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const handleLogout = () => {
    // Nach dem Logout werfen wir den Admin auf die öffentliche Startseite
    keycloakService.logout({ redirectUri: window.location.origin });
  };

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div>
            <div className={styles.brand}>
            <h2>Bierfestival</h2>
            <span className={styles.badge}>Admin</span>
            </div>
            <nav className={styles.nav}>
            {/* Absolute Pfade verhindern leere Screens bei Routing-Konflikten */}
            <NavLink 
                to="/admin/analytics" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
                Auswertungen
            </NavLink>
            <NavLink 
                to="/admin/master-data" 
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
            >
                Stammdaten
            </NavLink>
            </nav>
        </div>
        
        {/* Logout Button ganz unten */}
        <div className={styles.logoutWrapper}>
            <button onClick={handleLogout} className={styles.logoutButton}>
                Abmelden
            </button>
        </div>
      </aside>
      
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;