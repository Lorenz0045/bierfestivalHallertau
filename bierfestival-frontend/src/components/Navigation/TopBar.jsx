import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import styles from './TopBar.module.css';

const TopBar = () => {
    return (
        <header className={styles.topBar}>
            <div className={styles.logoContainer}>
                {/* Hier kommt später das echte Logo hin */}
                <h1 className={styles.logoText}>Hallertauer Bierfestival</h1>
            </div>
            <NavLink to="/mein-besuch" className={({ isActive }) => `${styles.userButton} ${isActive ? styles.active : ''}`}>
                <FaUser className={styles.icon} />
                <span>Mein Besuch</span>
            </NavLink>
        </header>
    );
};

export default TopBar;
