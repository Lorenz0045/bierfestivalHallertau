import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  // Extrahiert den Pfadnamen (z.B. "/rezepte", "/dosha-test") aus der aktuellen URL.
  const { pathname } = useLocation();

  // Dieser Effekt wird bei jeder Änderung des Pfadnamens ausgeführt.
  useEffect(() => {
    // Scrollt das Fenster sofort an die oberste linke Ecke.
    window.scrollTo(0, 0);
  }, [pathname]); // Die Abhängigkeit stellt sicher, dass der Effekt nur bei einer URL-Änderung läuft.

  // Die Komponente selbst rendert nichts, sie führt nur den Seiteneffekt aus.
  return null;
};

export default ScrollToTop;