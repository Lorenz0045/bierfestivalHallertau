import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';
import { 
    FaSearch,
    FaBus,
    FaMapMarkedAlt,
    FaCalendarAlt,
    FaBeer
} from 'react-icons/fa';

const Navbar = () => {
    return (
        <nav className={styles.bottomNav}>
            <NavLink to="/suche" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaSearch className={styles.icon} />
                <span className={styles.label}>Suche</span>
            </NavLink>
            
            <NavLink to="/anreise" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaBus className={styles.icon} />
                <span className={styles.label}>Anreise</span>
            </NavLink>

            {/* Prominenter Lageplan-Button in der Mitte */}
            <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${styles.centerLink} ${isActive ? styles.activeCenterLink : ''}`}>
                <div className={styles.centerButton}>
                    <FaMapMarkedAlt className={styles.centerIcon} />
                </div>
                <span className={styles.label}>Lageplan</span>
            </NavLink>

            <NavLink to="/programm" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaCalendarAlt className={styles.icon} />
                <span className={styles.label}>Programm</span>
            </NavLink>

            <NavLink to="/schenken" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.activeLink : ''}`}>
                <FaBeer className={styles.icon} />
                <span className={styles.label}>Schenken</span>
            </NavLink>
        </nav>
    );
};

export default Navbar;