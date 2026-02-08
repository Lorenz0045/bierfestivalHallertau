import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';
import { 
    FaSearch,       // Suche
    FaRoute,        // Anreise
    FaMapMarkedAlt, // Lageplan (Zentrum)
    FaCalendarAlt,  // Programm
    FaGift,         // Schenken
    FaBars, FaTimes // Mobile Menu
} from 'react-icons/fa';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <nav className={styles.navContainer}>
                
                {/* --- LINKS (1 & 2) --- */}
                <div className={styles.leftGroup}>
                    <NavLink to="/suche" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <FaSearch /> <span className={styles.linkText}>Suche</span>
                    </NavLink>
                    <NavLink to="/anreise" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <FaRoute /> <span className={styles.linkText}>Anreise</span>
                    </NavLink>
                </div>

                {/* --- ZENTRUM (3) - Lageplan / Landing --- */}
                <NavLink to="/" className={styles.logo} onClick={closeMenu}>
                    <FaMapMarkedAlt /> <span className={styles.logoText}>Lageplan</span>
                </NavLink>

                {/* --- RECHTS (4 & 5) --- */}
                <div className={styles.rightGroup}>
                    <NavLink to="/programm" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <FaCalendarAlt /> <span className={styles.linkText}>Programm</span>
                    </NavLink>
                    <NavLink to="/schenken" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
                        <FaGift /> <span className={styles.linkText}>Schenken</span>
                    </NavLink>
                </div>

                {/* --- Mobile Toggle --- */}
                <div className={styles.mobileMenuIcon} onClick={toggleMenu}>
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </div>
            </nav>

            {/* --- Mobile Menu Overlay --- */}
            {menuOpen && (
                <div className={styles.mobileMenuPopup}>
                    <NavLink to="/" onClick={closeMenu} className={styles.link}>Lageplan</NavLink>
                    <NavLink to="/anreise" onClick={closeMenu} className={styles.link}>Anreise</NavLink>
                    <NavLink to="/suche" onClick={closeMenu} className={styles.link}>Suche</NavLink>
                    <NavLink to="/programm" onClick={closeMenu} className={styles.link}>Programm</NavLink>
                    <NavLink to="/schenken" onClick={closeMenu} className={styles.link}>Schenken</NavLink>
                </div>
            )}
        </>
    );
};

export default Navbar;