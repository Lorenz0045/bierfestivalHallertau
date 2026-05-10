import React from 'react';
import styles from './LegalPage.module.css';

const DatenschutzPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Datenschutzerklärung</h1>
        <div className={styles.content}>
            <h2>1. Datenschutz auf einen Blick</h2>
            <h3>Allgemeine Hinweise</h3>
            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>
            <h2>2. Hosting</h2>
            <p>[Informationen zum Hosting-Anbieter]</p>
            <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
            <h3>Datenschutz</h3>
            <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
            <h2>4. Cookies und lokale Speicherung</h2>
            <p>Diese Webseite verwendet lokale Speicherung (localStorage) im Browser, um Ihre persönlichen Bier-Interaktionen (Merkliste, Getrunken, Bewertungen) zu speichern. Diese Daten werden ausschließlich auf Ihrem Gerät gespeichert und dienen der Verbesserung Ihres Festival-Erlebnisses.</p>
            <h2>5. Datenerfassung auf dieser Website</h2>
            <p>[Weitere Datenschutzhinweise einfügen]</p>
        </div>
    </div>
);

export default DatenschutzPage;
