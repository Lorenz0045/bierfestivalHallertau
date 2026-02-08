import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useUser } from '../../contexts/UserContext';
import { 
    FaHome, FaClipboardList, FaUtensils, FaSpa, FaSignInAlt, FaUserCircle, 
    FaBars, FaTimes, FaShoppingBag, FaHeartbeat, FaChevronDown, FaChevronUp, FaCaretUp 
} from 'react-icons/fa';

const Navbar = () => {
    const { keycloakInstance, loadingKeycloak, login, logout, doshaType } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLifestyleMobileOpen, setIsLifestyleMobileOpen] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const navRef = useRef();
    const mobileMenuPopupRef = useRef();
    const location = useLocation();

    const isAuthenticated = !loadingKeycloak && keycloakInstance && keycloakInstance.authenticated;
    const isAdmin = isAuthenticated && keycloakInstance.hasRealmRole('admin');
    const showDoshaTestLink = !isAuthenticated || !doshaType;

    useEffect(() => {
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        setIsStandalone(mediaQuery.matches);
        const handleChange = (e) => setIsStandalone(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => {
        setMenuOpen(false);
        setIsLifestyleMobileOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (navRef.current && !navRef.current.contains(event.target) &&
                mobileMenuPopupRef.current && !mobileMenuPopupRef.current.contains(event.target)) {
                closeMenu();
            }
        };
        if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        setIsLifestyleMobileOpen(false);
    }, [location]);

    if (loadingKeycloak) {
        return <nav className={styles.navContainer}><div className={styles.logo}>qordio</div></nav>;
    }

    return (
        <>
            {/* --- Obere Navigationsleiste --- */}
            <nav className={styles.navContainer} ref={navRef}>
                <NavLink to="/" className={styles.logo} onClick={closeMenu}>qordio</NavLink>

                {/* --- Desktop Links --- */}
                <div className={`${styles.links} ${styles.desktopOnly}`}>
                    <NavLink to="/" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Home</NavLink>
                    <NavLink to="/locations" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Locations</NavLink>
                    <NavLink to="/bar" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Bar</NavLink>
                    <NavLink to="/cart" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Cart</NavLink>
                    <NavLink to="/meals" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Meals</NavLink>
                    {isAuthenticated && <div className={styles.dropdownContainer}>
                        <NavLink to="/account" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>Account</NavLink>
                        {isAdmin && <div className={styles.dropdownMenu}>
                            <NavLink to="/admin" className={({ isActive }) => `${styles.dropdownLink} ${isActive ? styles.activeDropdownLink : ''}`}>Admin</NavLink>
                        </div>}
                    </div>}
                    
                </div>
                
                <div className={`${styles.login} ${styles.desktopOnly}`}>
                    {!isAuthenticated ? <button onClick={login} className={styles.loginButton}>Login</button> : <button onClick={logout} className={styles.loginButton}>Logout</button>}
                </div>

                {/* --- Burger-Icon für Mobile Browser --- */}
                {!isStandalone && <div className={styles.mobileMenuIcon} onClick={toggleMenu}>{menuOpen ? <FaTimes /> : <FaBars />}</div>}
            </nav>

            {/* --- Aufklappbares Burger-Menü (Mobile Browser) --- */}
            {!isStandalone && menuOpen && (
                <div className={styles.mobileMenuPopup} ref={mobileMenuPopupRef}>
                    <NavLink to="/" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Home</NavLink>
                    <NavLink to="/locations" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Locations</NavLink>
                    <NavLink to="/bar" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Bar</NavLink>
                    <NavLink to="/cart" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Cart</NavLink>
                    <NavLink to="/meals" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Meals</NavLink>
                    {isAuthenticated && <div className={styles.mobileDropdownContainer}>
                        <div className={styles.mobileDropdownToggle}>
                            <NavLink to="/account" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Account</NavLink>
                            {isAdmin &&<button onClick={() => setIsLifestyleMobileOpen(!isLifestyleMobileOpen)}>{isLifestyleMobileOpen ? <FaChevronUp /> : <FaChevronDown />}</button>}
                        </div>
                        {isLifestyleMobileOpen && (
                            <div className={styles.mobileSubMenu}>
                                {isAdmin && <NavLink to="/admin" className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`} onClick={closeMenu}>Admin</NavLink>}
                            </div>
                        )}
                    </div>}
                    
                    {!isAuthenticated ? <button onClick={() => { closeMenu(); login(); }} className={styles.mobileMenuLoginButton}>Login</button> : <button onClick={() => { closeMenu(); logout(); }} className={styles.mobileMenuLoginButton}>Logout</button>}
                </div>
            )}

            {/* --- Mobile Bottom Navigation (PWA) --- */}
            {isStandalone && (
                <nav className={styles.mobileBottomNav}>
                    <NavLink to="/" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaHome className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Home</span></NavLink>                        
                    <NavLink to="/locations" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaUtensils className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Locations</span></NavLink>                        
                    <NavLink to="/bar" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaUtensils className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Bar</span></NavLink>
                    <NavLink to="/cart" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaUtensils className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Cart</span></NavLink>
                    <NavLink to="/meals" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaUtensils className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Meals</span></NavLink>
                    {isAuthenticated ? 
                        <NavLink to="/account" className={({ isActive }) => `${styles.mobileNavLink} ${isActive ? styles.activeMobile : ''}`}><FaUserCircle className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Account</span></NavLink>
                        :
                        <div onClick={() => { closeMenu(); login(); }} className={styles.mobileNavLink}><FaSignInAlt className={styles.mobileNavIcon} /><span className={styles.mobileNavText}>Login</span></div>
                    }
                </nav>
            )}
        </>
    );
};

export default Navbar;