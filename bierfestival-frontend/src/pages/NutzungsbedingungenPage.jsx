import React from 'react';
import styles from './LegalPage.module.css';

const NutzungsbedingungenPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Nutzungsbedingungen</h1>
        <div className={styles.content}>
            <h2>1. Geltungsbereich</h2>
            <p>Diese Nutzungsbedingungen gelten für die Nutzung der Webapplikation des Hallertauer Bierfestivals.</p>
            <h2>2. Nutzung der App</h2>
            <p>Die App dient der Information über das Festival, der Anreiseplanung und der persönlichen Verwaltung Ihres Besuchs (Merkliste, Bewertungen).</p>
            <h2>3. Datenspeicherung</h2>
            <p>Persönliche Interaktionen wie Merkliste, Getrunken-Zähler und Bewertungen werden lokal auf Ihrem Gerät gespeichert. Bei Löschung der Browser-Daten gehen diese Informationen verloren.</p>
            <h2>4. Haftung</h2>
            <p>Alle Angaben zu Fahrplänen, Programm und Bierangebot sind ohne Gewähr. Änderungen vorbehalten.</p>
            <h2>5. Urheberrecht</h2>
            <p>Die Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.</p>
        </div>
    </div>
);

export default NutzungsbedingungenPage;
