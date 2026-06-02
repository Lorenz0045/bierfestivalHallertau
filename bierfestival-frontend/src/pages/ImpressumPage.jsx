import React from 'react';
import styles from './LegalPage.module.css';

const ImpressumPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Impressum</h1>
        <div className={styles.content}>
            <h2>Angaben gemäß § 5 DDG</h2>
            <p>
                Gemeinde Attenkirchen<br />
                Hauptstraße 5<br />
                85395 Attenkirchen
            </p>
            <p>
                Die Gemeinde Attenkirchen ist eine Körperschaft des öffentlichen Rechts.<br />
                Sie wird vertreten durch den Ersten Bürgermeister Mathias Kern.
            </p>

            <h2>Kontakt</h2>
            <p>
                Telefon: 08168 / 90490<br />
                Telefax: 08167 / 9023<br />
                E-Mail: <a href="mailto:rathaus@vg-zolling.de">rathaus@vg-zolling.de</a><br />
                Website: <a href="https://www.attenkirchen.de" target="_blank" rel="noopener noreferrer">www.attenkirchen.de</a>
            </p>

            <h2>Aufsichtsbehörde</h2>
            <p>
                Landratsamt Freising<br />
                Landshuter Str. 31<br />
                85356 Freising
            </p>

            <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
                Mathias Kern (Erster Bürgermeister)<br />
                Hauptstraße 5<br />
                85395 Attenkirchen
            </p>

            <h2>Haftungshinweis</h2>
            <p>
                Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber verantwortlich.
            </p>
        </div>
    </div>
);

export default ImpressumPage;