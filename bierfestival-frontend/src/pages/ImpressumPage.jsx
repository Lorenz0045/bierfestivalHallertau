import React from 'react';
import styles from './LegalPage.module.css';

const ImpressumPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Impressum</h1>
        <div className={styles.content}>
            <h2>Angaben gemäß § 5 TMG</h2>
            <p>[Name des Veranstalters]<br />[Straße Hausnummer]<br />[PLZ Ort]</p>
            <h2>Kontakt</h2>
            <p>Telefon: [Telefonnummer]<br />E-Mail: [E-Mail-Adresse]</p>
            <h2>Vertreten durch</h2>
            <p>[Name des Vertreters]</p>
            <h2>Umsatzsteuer-ID</h2>
            <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: [USt-IdNr.]</p>
            <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>[Name]<br />[Adresse]</p>
            <h2>Haftungsausschluss</h2>
            <p>Die Inhalte dieser Webseite wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
        </div>
    </div>
);

export default ImpressumPage;
