import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';
import { 
    FaSearch,       // Suche
    FaRoute,        // Anreise
    FaMapMarkedAlt, // Lageplan (Zentrum)
    FaCalendarAlt,  // Programm
    FaBeer          // Schenken
} from 'react-icons/fa';

const Navbar = () => {
    return (
        <nav className={styles.bottomNav}>
            <NavLink to="/suche" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.activeMobile : ''}`}>
                <FaSearch className={styles.icon} />
                <span className={styles.label}>Suche</span>
            </NavLink>
            
            <NavLink to="/anreise" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.activeMobile : ''}`}>
                <FaRoute className={styles.icon} />
                <span className={styles.label}>Anreise</span>
            </NavLink>

            {/* Der Haupt-Button (Mitte) */}
            <NavLink to="/" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.activeMobile : ''}`}>
                <FaMapMarkedAlt className={styles.icon} />
                <span className={styles.label}>Lageplan</span>
            </NavLink>

            <NavLink to="/programm" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.activeMobile : ''}`}>
                <FaCalendarAlt className={styles.icon} />
                <span className={styles.label}>Programm</span>
            </NavLink>

            <NavLink to="/schenken" className={({ isActive }) => `${styles.mobileLink} ${isActive ? styles.activeMobile : ''}`}>
                <FaBeer className={styles.icon} />
                <span className={styles.label}>Schenken</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;