import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import styles from './AdminPage.module.css';

const AdminPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hilfsfunktion, um zu prüfen, ob ein Pfad aktiv ist (inkl. Unterpfade)
  const isActive = (basePath) => location.pathname.startsWith(`/admin/${basePath}`);
  // Hilfsfunktion für exakte Pfadübereinstimmung
  const isExactActive = (path) => location.pathname === `/admin/${path}`;

  useEffect(() => {
    // Wenn /admin aufgerufen wird, direkt zu recipes weiterleiten
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
        navigate('dashboard', { replace: true });
    }
    // Wenn /admin/content aufgerufen wird, auch zu recipes weiterleiten
    else if (location.pathname === '/admin/content') {
      navigate('content/cocktail', { replace: true });
    }
    // Weiterleitung für /admin/lookups (bleibt bestehen)
    else if (location.pathname === '/admin/lookups') {
      navigate('lookups/todo', { replace: true });
    }
  }, [location.pathname, navigate]);


  return (
    <div className={styles.adminContainer}>
      <header className={styles.adminHeader}>
        <h1>Admin Dashboard</h1>
        <nav className={styles.adminNav}>
          <NavLink
            to="dashboard" 
            className={() => `${styles.navLink} ${isActive('dashboard') ? styles.activeLink : ''}`}
          >
            Übersicht
          </NavLink>
          <NavLink
            to="content/cocktail" 
            className={() => `${styles.navLink} ${isActive('content') ? styles.activeLink : ''}`}
          >
            Content Management
          </NavLink>
          <NavLink
            to="lookups/todo"
            className={() => `${styles.navLink} ${isActive('lookups') ? styles.activeLink : ''}`}
          >
            Lookup Tabellen
          </NavLink>
        </nav>
      </header>

      {isActive('lookups') && (
        <nav className={styles.adminSubNav}> 
          <NavLink to="lookups/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
          <NavLink to="lookups/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
          <NavLink to="lookups/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
        </nav>
      )}

      {isActive('content') && !isActive('lookups') && ( // Nur anzeigen, wenn wir in Content sind, aber nicht in Lookups
        <nav className={styles.adminSubNav}>
          <NavLink to="content/cocktail" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>Cocktail</NavLink>
          <NavLink to="content/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
          <NavLink to="content/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
          <NavLink to="content/todo" className={({isActive: isSubActive}) => isSubActive ? `${styles.subLink} ${styles.activeSubLink}` : styles.subLink}>TODO</NavLink>
        </nav>
      )}

      <main className={styles.adminContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminPage;