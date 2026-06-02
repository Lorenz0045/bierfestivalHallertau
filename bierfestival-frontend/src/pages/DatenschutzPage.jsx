import React from 'react';
import styles from './LegalPage.module.css';

const DatenschutzPage = () => (
    <div className={styles.page}>
        <h1 className={styles.title}>Datenschutzerklärung</h1>
        <div className={styles.content}>
            <p><strong>Hallertauer Bierfestival App – Gemeinde Attenkirchen</strong></p>

            <h2>1. Verantwortliche Stelle</h2>
            <p>
                Gemeinde Attenkirchen<br />
                Rathaus Attenkirchen<br />
                Hauptstraße 5<br />
                85395 Attenkirchen
            </p>
            <p>
                Telefon: 08168 / 90490<br />
                E-Mail: <a href="mailto:rathaus@vg-zolling.de">rathaus@vg-zolling.de</a><br />
                Website: <a href="https://www.attenkirchen.de" target="_blank" rel="noopener noreferrer">www.attenkirchen.de</a>
            </p>
            <p>Vertreten durch: Erster Bürgermeister Mathias Kern</p>

            <h2>2. Datenschutzbeauftragter</h2>
            <p>Der zuständige behördliche Datenschutzbeauftragte für die Gemeinde Attenkirchen ist:</p>
            <p>
                Datenschutzbeauftragter der Kommunen des Landkreises Freising<br />
                Landratsamt Freising<br />
                Landshuter Str. 31<br />
                85356 Freising<br />
                Telefon: 08161 / 600 442<br />
                E-Mail: <a href="mailto:datenschutz-gemeinden@kreis-fs.de">datenschutz-gemeinden@kreis-fs.de</a>
            </p>

            <h2>3. Allgemeines zur Datenverarbeitung</h2>
            <p>Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Wir verarbeiten Ihre Daten ausschließlich auf Grundlage der gesetzlichen Bestimmungen, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bayerischen Datenschutzgesetzes (BayDSG).</p>
            <p>Diese Web-App ist ein rein informatives Angebot der Gemeinde Attenkirchen zum Hallertauer Bierfestival. Es besteht keine Pflicht zur Registrierung oder zum Login. Es werden keine Nutzerkonten angelegt.</p>

            <h2>4. Hosting durch Hetzner</h2>
            <p>Diese Web-App wird auf Servern der Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen gehostet. Wenn Sie unsere App aufrufen, werden Ihre Daten auf den Servern von Hetzner verarbeitet. Wir haben mit Hetzner einen Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO geschlossen.</p>
            
            <h3>Erfassung von Server-Logfiles</h3>
            <p>Bei jedem Aufruf der App erfasst der Provider der Seiten automatisch Informationen in sogenannten Server-Logfiles, die Ihr Browser automatisch an uns übermittelt. Dies sind: IP-Adresse, Browsertyp/-version, verwendetes Betriebssystem, Referrer-URL, Hostname des zugreifenden Rechners und Uhrzeit der Serveranfrage.</p>
            <p>Diese Daten werden nicht mit anderen Datenquellen zusammengeführt. Die Erfassung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Wir haben ein berechtigtes Interesse an der technisch fehlerfreien Darstellung und der Optimierung unserer App – hierzu müssen die Server-Logfiles erfasst werden.</p>

            <h2>5. Kartenmaterial und Standortnutzung</h2>
            <p>Diese Web-App ist ein Online-Angebot und erfordert eine aktive Internetverbindung zur Nutzung. Das in der App dargestellte Kartenmaterial wird über den Hosting-Server bereitgestellt. Es werden dabei keine Standortdaten oder Nutzerdaten an externe Kartenanbieter übertragen.</p>
            <p>Sofern Sie die Standortfunktion Ihres Geräts aktivieren, um sich auf der Karte zu orten, erfolgt die Verarbeitung des Standorts ausschließlich lokal auf Ihrem Endgerät und wird nicht an Server übertragen. Rechtsgrundlage ist in diesem Fall Art. 6 Abs. 1 lit. a DSGVO (Ihre ausdrückliche Einwilligung durch Aktivierung der Standortfunktion im Browser). Sie können die Standortfreigabe jederzeit in den Einstellungen Ihres Browsers oder Geräts widerrufen.</p>

            <h2>6. Lokale Speicherung (LocalStorage) und Nutzerdaten</h2>
            <p>Um die Funktionalität der App auch bei schlechter Internetverbindung (als Offline-App) zu gewährleisten, speichern wir Veranstaltungsdaten und Ihre persönlichen "Gemerkten Biere" lokal im sogenannten "LocalStorage" Ihres Browsers. Diese technisch notwendige lokale Speicherung erfolgt ohne vorherige Einwilligung gemäß § 25 Abs. 2 TDDDG. Es findet hierbei keine Datenübertragung an unsere Server statt.</p>
            
            <h3>Bewertungen und Abstimmung (Einwilligung)</h3>
            <p>Wenn Sie über das beim Start angezeigte Datenschutz-Banner der "Bier-Bewertung (Server-Sync)" zustimmen, generieren wir eine anonyme Kennnummer (UUID) und speichern diese im LocalStorage Ihres Geräts. Diese UUID dient ausschließlich dazu, Ihre abgegebenen Bewertungen (z. B. für das beste Bier des Festivals) sicher an unseren Server zu übertragen, Ihrer Sitzung zuzuordnen und Ihnen eine nachträgliche Änderung Ihrer Stimme zu ermöglichen.</p>
            <p>Bei dieser Funktion handelt es sich um eine Verarbeitung pseudonymisierter Daten. Die Speicherung der UUID und die Übertragung an den Server erfolgen ausschließlich auf Grundlage Ihrer ausdrücklichen Einwilligung nach § 25 Abs. 1 TDDDG i.V.m. Art. 6 Abs. 1 lit. a DSGVO. Sie können diese Einwilligung jederzeit über die "Datenschutz-Einstellungen" in der App widerrufen (die UUID wird dann gelöscht). Alle Bewertungsdaten auf unserem Server werden spätestens vier Wochen nach Ende des Festivals vollständig anonymisiert oder gelöscht.</p>

            <h2>7. Allgemeine Bewertungsstatistiken</h2>
            <p>Bewertungen, die Nutzer in der App abgeben, fließen in eine anonymisierte Gesamtstatistik ein (z. B. Gesamtanzahl der Likes oder Durchschnittsbewertung eines Bieres). Diese aggregierten Auswertungen enthalten keinen Personenbezug und werden über die Festivaldauer hinaus als statistische Daten gespeichert.</p>

            <h2>8. Kontaktaufnahme</h2>
            <p>Diese App stellt kein Kontaktformular bereit. Wenn Sie uns per E-Mail kontaktieren (<a href="mailto:rathaus@vg-zolling.de">rathaus@vg-zolling.de</a>), verarbeiten wir Ihre Angaben (Name, E-Mail-Adresse, Nachrichteninhalt) ausschließlich zur Bearbeitung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Bearbeitung von Nutzeranfragen). Ihre Daten werden nicht an Dritte weitergegeben und nach abschließender Bearbeitung der Anfrage gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>

            <h2>9. Ihre Rechte als betroffene Person</h2>
            <p>Sie haben gegenüber der Gemeinde Attenkirchen als verantwortlicher Stelle folgende Rechte:</p>
            <ul>
                <li>Auskunftsrecht (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
            </ul>
            <p>Zur Ausübung Ihrer Rechte wenden Sie sich bitte an: <a href="mailto:rathaus@vg-zolling.de">rathaus@vg-zolling.de</a></p>

            <h2>10. Beschwerderecht bei der Aufsichtsbehörde</h2>
            <p>Sie haben das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren:</p>
            <p>
                Der Bayerische Landesbeauftragte für den Datenschutz (BayLfD)<br />
                Postfach 22 12 19, 80502 München<br />
                Wagmüllerstraße 18, 80538 München<br />
                Telefon: 089 212672-0<br />
                E-Mail: <a href="mailto:poststelle@datenschutz-bayern.de">poststelle@datenschutz-bayern.de</a><br />
                Website: <a href="https://www.datenschutz-bayern.de" target="_blank" rel="noopener noreferrer">www.datenschutz-bayern.de</a>
            </p>

            <h2>11. Aktualität dieser Datenschutzerklärung</h2>
            <p>Diese Datenschutzerklärung ist aktuell gültig und hat den Stand Juni 2026. Durch die Weiterentwicklung der App oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es notwendig werden, diese Datenschutzerklärung anzupassen. Die jeweils aktuelle Datenschutzerklärung ist jederzeit in der App abrufbar.</p>
            
            <p><em>Stand: Juni 2026</em></p>
        </div>
    </div>
);

export default DatenschutzPage;