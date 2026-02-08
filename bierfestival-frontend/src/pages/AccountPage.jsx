import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import styles from './AccountPage.module.css';
import { FaEnvelope, FaCog, FaUser, FaSignOutAlt,  } from 'react-icons/fa';




const AccountPage = () => {
  const { userProfile, accountManagementUrl, logout } = useUser();


  const handleOpenAccountManagement = () => {
    if (accountManagementUrl) window.open(accountManagementUrl, '_blank');
  };

  return (
    <>
      <div className={styles.AccountContainer}>
            <div className={styles.profileCard}>
              <img src="/img/account/profile.png" alt="Profil Icon" className={styles.profileImage} />
              <div className={styles.profileWrapper}>
                <div className={styles.profileContent}>
                  <div className={styles.name}>
                    <h2>{userProfile?.firstName || 'Dein'}</h2>
                    <h2>{userProfile?.lastName || 'Name'}</h2>
                  </div>
                  <div className={styles.userInfo}><FaUser /><p>{userProfile?.username || 'dein_username'}</p></div>
                  <div className={styles.userInfo}><FaEnvelope /><p>{userProfile?.email || 'deine@email.com'}</p></div>
                </div>
                <div className={styles.profileContent}>
                  <div className={styles.settings} onClick={handleOpenAccountManagement} title="Keycloak Account-Einstellungen"><FaCog /><span>Profil bearbeiten</span></div>
                  <button className={styles.logoutButton} onClick={logout}><FaSignOutAlt /> Logout</button>
                </div>
              </div>
            </div>
      </div>

    </>
  );
};


export default AccountPage;