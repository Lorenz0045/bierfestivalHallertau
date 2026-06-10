import React, { useState, useEffect } from 'react';
import { bulkSyncToBackend } from '../../services/trackingService';
import styles from './CookieBanner.module.css';

export const CONSENT_KEY = 'bierfestival_consents';

const CookieBanner = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    // Variablen-Namen beibehalten, damit nichts anderes bricht
    const [statsConsent, setStatsConsent] = useState(true);
    const [marketingConsent, setMarketingConsent] = useState(false); // Default auf false, da es eh nicht mehr genutzt wird

    useEffect(() => {
        const consentData = localStorage.getItem(CONSENT_KEY);
        if (!consentData) {
            setShowBanner(true);
        } else {
            try {
                // Prüft nur noch, ob das JSON lesbar ist, falls ja -> Banner bleibt versteckt
                JSON.parse(consentData);
            } catch (e) {
                setShowBanner(true);
            }
        }

        const handleOpenSettings = () => {
            setShowBanner(true);
            setShowSettings(true);
        };
        window.addEventListener('openCookieSettings', handleOpenSettings);
        return () => window.removeEventListener('openCookieSettings', handleOpenSettings);
    }, []);

    

    const saveConsents = (marketing, festivalSync) => {
        
        const previousData = localStorage.getItem(CONSENT_KEY);
        const previousConsents = previousData ? JSON.parse(previousData) : {};
        const wasSyncedBefore = previousConsents.festivalSync === true;

        const consents = { marketing, festivalSync, necessary: true };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
        
        setShowBanner(false);

        if (festivalSync && !wasSyncedBefore) {
            bulkSyncToBackend();
        }
    };

    const handleAcceptAll = () => saveConsents(true, true); // Google-Analytics wurde entfernt, platzhalter dafür existiert bereits mit marketing... zustimmung -> aktuell macht das nichts.
    const handleDeclineAll = () => saveConsents(false, false);
    const handleSaveSettings = () => saveConsents(marketingConsent, statsConsent);

    if (!showBanner) return null;

    return (
        <div className={styles.banner}>
            {!showSettings ? (
                <div className={styles.content}>
                    <p className={styles.text}>
                        Wir speichern notwendige Daten lokal auf deinem Gerät, damit die App reibungslos funktioniert. Wenn du am Ende für das beste Bier abstimmen möchtest, benötigen wir deine Zustimmung, um deine (anonymen) Bewertungen an unseren Server zu senden. <a href="/datenschutz">Datenschutz</a> | <a href="/impressum">Impressum</a>.
                    </p>
                    <div className={styles.buttons}>
                        <button onClick={() => setShowSettings(true)} className={styles.settingsButton}>Einstellungen</button>
                        <button onClick={handleDeclineAll} className={styles.declineButton}>Nur Notwendige</button>
                        <button onClick={handleAcceptAll} className={styles.acceptButton}>Alle Akzeptieren</button>
                    </div>
                </div>
            ) : (
                <div className={styles.settingsContent}>
                    <h3 className={styles.settingsTitle}>Einstellungen</h3>
                    
                    <div className={styles.category}>
                        <div className={styles.categoryHeader}>
                            <strong>Notwendig (Lokale Speicherung)</strong>
                            <input type="checkbox" checked={true} disabled />
                        </div>
                        <p className={styles.categoryDesc}>Speichert Basisdaten lokal, damit die App funktioniert. Es werden keine Daten gesendet.</p>
                    </div>

                    <div className={styles.category}>
                        <div className={styles.categoryHeader}>
                            <strong>Bier-Bewertungen (Statistik)</strong>
                            <input type="checkbox" checked={statsConsent} onChange={(e) => setStatsConsent(e.target.checked)} />
                        </div>
                        <p className={styles.categoryDesc}>Speichert eine anonyme ID und sendet deine Bewertungen, damit deine Stimme für das beste Bier gezählt wird.</p>
                    </div>
                    
                    <div className={styles.buttons} style={{ marginTop: '16px' }}>
                        <button onClick={handleSaveSettings} className={styles.acceptButton}>Auswahl speichern</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CookieBanner;