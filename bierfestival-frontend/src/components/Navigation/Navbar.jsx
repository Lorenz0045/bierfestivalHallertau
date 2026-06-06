import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { 
    FaSearch,
    FaBus,
    FaMapMarkedAlt,
    FaCalendarAlt,
    FaBeer
} from 'react-icons/fa';

const Navbar = () => {
    const location = useLocation();

    // Funktion feuert ein Event, wenn man auf den bereits aktiven Link tippt
    const handleReclick = (path) => {
        if (location.pathname === path || (path === '/' && location.pathname === '/')) {
            window.dispatchEvent(new CustomEvent('bf-tab-reclick', { detail: path }));
        }
    };

    return (
        <nav className={styles.bottomNav}>
            <NavLink to="/suche" onClick={() => handleReclick('/suche')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaSearch className={styles.icon} />
                <span className={styles.label}>Suche</span>
            </NavLink>
            
            <NavLink to="/anreise" onClick={() => handleReclick('/anreise')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaBus className={styles.icon} />
                <span className={styles.label}>Anreise</span>
            </NavLink>

            {/* Prominenter Lageplan-Button in der Mitte */}
            <NavLink to="/" end onClick={() => handleReclick('/')} className={({ isActive }) => `${styles.navLink} ${styles.centerLink} ${isActive ? styles.activeCenterLink : ''}`}>
                <div className={styles.centerButton}>
                    <FaMapMarkedAlt className={styles.centerIcon} />
                </div>
                <span className={styles.label}>Lageplan</span>
            </NavLink>

            <NavLink to="/programm" onClick={() => handleReclick('/programm')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaCalendarAlt className={styles.icon} />
                <span className={styles.label}>Programm</span>
            </NavLink>

            <NavLink to="/schenken" onClick={() => handleReclick('/schenken')} className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaBeer className={styles.icon} />
                <span className={styles.label}>Schenken</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;