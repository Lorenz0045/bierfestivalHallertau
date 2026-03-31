import L from 'leaflet';
import styles from './MapIcons.module.css';

// Farb-Mapping für die verschiedenen Typen
const TYPE_COLORS = {
    tavern: '#8B4513',      // Braun für Schenken
    stage: '#6A5ACD',       // Lila für Bühnen
    gastronomy: '#FF4500',  // Orange für Essen
    facility: '#4682B4'     // Blau für Einrichtungen (WCs etc.)
};

export const createPoiIcon = (item) => {
    // 1. Wenn ein Bild vorhanden ist (Fallback für FacilityType inkludiert)
    const imageUrl = item.imgUrl || (item.facilityType && item.facilityType.imgUrl);
    
    if (imageUrl) {
        return L.divIcon({
            className: styles.imageIcon,
            html: `<img src="${imageUrl}" class="${styles.imageIconInner}" alt="${item.name}" />`,
            iconSize: [44, 44],
            iconAnchor: [22, 22], // Zentriert
            popupAnchor: [0, -22]
        });
    }

    // 2. Fallback: Kreissymbol mit Initialen
    const color = TYPE_COLORS[item.type] || '#333333';
    // Nimmt die ersten 2 Buchstaben, z.B. "Hauptbühne" -> "HA", "WC Nord" -> "WC"
    const initials = item.name ? item.name.substring(0, 2).toUpperCase() : '??';

    return L.divIcon({
        className: styles.fallbackIcon,
        html: `<div class="${styles.fallbackIconInner}" style="background-color: ${color}">${initials}</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19]
    });
};