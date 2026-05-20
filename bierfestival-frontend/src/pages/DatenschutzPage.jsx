import React from 'react';
import styles from './LegalPage.module.css';

const DatenschutzPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Datenschutzerklärung</h1>
        <div className={styles.content}>
            <h2>1. Datenschutz auf einen Blick</h2>
            <h3>Allgemeine Hinweise</h3>
            <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.</p>
            <h2>2. Datenerfassung auf dieser Website</h2>
            <p>[Weitere Datenschutzhinweise einfügen]</p>
        </div>
    </div>
);

export default DatenschutzPage;
