import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';
import styles from './CookieBanner.module.css';

export const CONSENT_KEY = 'bierfestival_consents';

const CookieBanner = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    const [statsConsent, setStatsConsent] = useState(true);
    const [marketingConsent, setMarketingConsent] = useState(true);

    useEffect(() => {
        const consentData = localStorage.getItem(CONSENT_KEY);
        if (!consentData) {
            setShowBanner(true);
        } else {
            try {
                const parsed = JSON.parse(consentData);
                if (parsed.marketing) {
                    ReactGA.initialize('G-XXXXXXXXXX');
                    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
                }
            } catch (e) {
                setShowBanner(true);
            }
        }
    }, []);

    const saveConsents = (marketing, festivalSync) => {
        const consents = { marketing, festivalSync, necessary: true };
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
        
        if (marketing) {
            ReactGA.initialize('G-XXXXXXXXXX');
            ReactGA.send({ hitType: "pageview", page: window.location.pathname });
        }
        
        setShowBanner(false);
    };

    const handleAcceptAll = () => saveConsents(true, true);
    const handleDeclineAll = () => saveConsents(false, false);
    const handleSaveSettings = () => saveConsents(marketingConsent, statsConsent);

    if (!showBanner) return null;

    return (
        <div className={styles.banner}>
            {!showSettings ? (
                <div className={styles.content}>
                    <p className={styles.text}>
                        Diese Website nutzt Technologien (z.B. Cookies und Local Storage), um Kernfunktionen bereitzustellen und die Nutzung zu analysieren. Deine (anonymen) Bewertungen helfen uns außerdem dabei, am Ende die besten Biere des Festivals zu küren! Du kannst deine Zustimmung widerrufen oder anpassen. <a href="/datenschutz">Datenschutzerklärung</a> | <a href="/impressum">Impressum</a>.
                    </p>
                    <div className={styles.buttons}>
                        <button onClick={() => setShowSettings(true)} className={styles.settingsButton}>Einstellungen</button>
                        <button onClick={handleDeclineAll} className={styles.declineButton}>Nur Notwendige</button>
                        <button onClick={handleAcceptAll} className={styles.acceptButton}>Alle Akzeptieren</button>
                    </div>
                </div>
            ) : (
                <div className={styles.settingsContent}>
                    <h3 className={styles.settingsTitle}>Cookie-Einstellungen</h3>
                    
                    <div className={styles.category}>
                        <div className={styles.categoryHeader}>
                            <strong>Notwendig (Berechtigungen & Speicherung)</strong>
                            <input type="checkbox" checked={true} disabled />
                        </div>
                        <p className={styles.categoryDesc}>Speichert deine Daten ausschließlich lokal auf deinem Gerät, um dir den Bereich "Mein Festivalbesuch" zu ermöglichen. Zudem nutzt die App (nach nativer Browser-Freigabe) deine Geo-Location, damit du dich auf der Karte orientieren kannst. Es findet keine ungefragte Datenübertragung an Server statt.</p>
                    </div>

                    <div className={styles.category}>
                        <div className={styles.categoryHeader}>
                            <strong>Festival Auswertung (Statistik)</strong>
                            <input type="checkbox" checked={statsConsent} onChange={(e) => setStatsConsent(e.target.checked)} />
                        </div>
                        <p className={styles.categoryDesc}>Synchronisiert deine getrunkenen Biere und Bewertungen anonym mit unserem Server, um am Ende das Gewinner-Bier zu küren.</p>
                    </div>

                    <div className={styles.category}>
                        <div className={styles.categoryHeader}>
                            <strong>Marketing & Analysen (Google)</strong>
                            <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
                        </div>
                        <p className={styles.categoryDesc}>Wir nutzen Google Analytics 4, um zu verstehen, wie unsere Seite genutzt wird. Ohne diese Zustimmung wird GA blockiert.</p>
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
