import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaClipboardList } from 'react-icons/fa';
import styles from './TopBar.module.css';

const TopBar = () => {
    return (
        <header className={styles.topBar}>
            <div className={styles.logoContainer}>
                <img src="/icons/Bierfestival-Logo.png" alt="Bierfestival Logo" className={styles.logoImage} />
                <div className={styles.logoTextWrap}>
                    <span className={styles.logoTextTop}>Hallertauer</span>
                    <span className={styles.logoTextBottom}>Bierfestival</span>
                </div>
            </div>
            <NavLink to="/mein-besuch" className={({ isActive }) => `${styles.userButton} ${isActive ? styles.active : ''}`}>
                <FaClipboardList className={styles.icon} />
                <span>Mein Besuch</span>
            </NavLink>
        </header>
    );
};

export default TopBar;
