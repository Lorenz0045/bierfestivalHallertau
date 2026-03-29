// src/data/festivalData.js

// --- DUMMY DATEN ---
export const biere = [
  { id: 'b1', name: 'Hallertauer Gold', brauerei: 'Brauerei Hopfengold', sorte: 'Helles', alkohol: 5.2, beschreibung: 'Ein klassisches Hallertauer Helles...', geschmack: ['malzig', 'hopfig'], herkunft: 'Wolnzach' },
  // ... restliche Biere ...
];

export const schenken = [
  { id: 's1', name: 'Schenke Hopfengold', beschreibung: 'Traditionelle Schenke...', biere: [biere[0]], position: { x: 25, y: 35 } },
  // ... restliche Schenken ...
];

export const programm = [
  { id: 'p1', kuenstler: 'Die Hopfenrocker', buehne: 'Hauptbühne', startzeit: '18:00', endzeit: '19:30', tag: 'Samstag', highlight: true, beschreibung: 'Rockmusik...' },
  // ... restliches Programm ...
];

// WICHTIG: Datenstruktur für die Map vorbereitet
export const pois = [
  { id: 'poi-s1', name: 'Schenke Hopfengold', kategorie: 'schenke', position: { x: 25, y: 35 }, linkTo: { tab: 'schenke', id: 's1' }, beschreibung: 'Leckeres Bier' },
  { id: 'poi-b1', name: 'Hauptbühne', kategorie: 'buehne', position: { x: 50, y: 20 }, linkTo: { tab: 'programm', id: 'Hauptbühne' }, beschreibung: 'Live Musik' },
  { id: 'poi-wc1', name: 'WC Nord', kategorie: 'wc', position: { x: 80, y: 15 }, beschreibung: 'Toiletten' },
  { id: 'poi-essen1', name: 'Brathendl', kategorie: 'essen', position: { x: 40, y: 30 }, beschreibung: 'Essen' },
  { id: 'poi-info', name: 'Info Point', kategorie: 'info', position: { x: 55, y: 85 }, beschreibung: 'Hilfe' },
];

// --- BACKEND VORBEREITUNG (Caching Logic) ---
const STORAGE_KEY = 'festival_data_v1';

export const DataManager = {
  // Lädt Daten: Erst LocalStorage, Fallback auf statische Datei
  loadData: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Ladefehler Cache", e);
    }
    // Fallback auf die Konstanten oben
    return { biere, schenken, programm, pois };
  },

  // Simuliert den Backend-Abruf beim Klick auf "Aktualisieren"
  fetchUpdate: async () => {
    console.log("Suche nach Updates...");
    // Hier später: const res = await fetch('https://api.../data');
    // const newData = await res.json();
    
    // Simulation: Wir speichern einfach die aktuellen Daten neu
    const newData = { biere, schenken, programm, pois, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    return newData;
  }
};