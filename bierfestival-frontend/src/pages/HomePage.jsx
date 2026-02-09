import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, LayersControl, AttributionControl, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import { FaLocationArrow, FaBeer } from 'react-icons/fa'; // Neue Icons
import styles from './HomePage.module.css';

// --- Icon Definition (Blauer Punkt) ---
const userIcon = L.divIcon({
    className: styles.userLocationDot,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// --- Neue Komponente: MapControls ---
// Vereint Standort-Toggle und Festival-Jump
const MapControls = ({ festivalCoords }) => {
    const [position, setPosition] = useState(null);
    const [isTracking, setIsTracking] = useState(false); // Default: Aus
    const map = useMap();

    // Effekt: Reagiert auf den "isTracking" Schalter
    useEffect(() => {
        // Event Handler definieren
        const onLocationFound = (e) => {
            setPosition(e.latlng);
        };
        
        const onLocationError = (e) => {
            console.warn("GPS Fehler:", e.message);
            setIsTracking(false); // Bei Fehler ausschalten
        };

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        if (isTracking) {
            // Tracking starten
            map.locate({ 
                watch: true, 
                enableHighAccuracy: true 
            });
        } else {
            // Tracking stoppen
            map.stopLocate();
            setPosition(null); // Punkt entfernen, wenn aus
        }

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
            map.stopLocate();
        };
    }, [map, isTracking]);

    // Button 1: Tracking umschalten
    const toggleTracking = () => {
        if (!isTracking) {
            setIsTracking(true);
            // Optional: Beim Einschalten einmal kurz hinzoomen
            map.locate({ setView: true, maxZoom: 18 });
        } else {
            setIsTracking(false);
        }
    };

    // Button 2: Zum Festival fliegen
    const goToFestival = () => {
        // Wir schalten das Tracking lieber aus, sonst kämpft es gegen den FlyTo
        setIsTracking(false); 
        map.flyTo(festivalCoords, 18, {
            duration: 1.5 // Schöne Flug-Animation (Sekunden)
        });
    };

    return (
        <>
            {/* Der Blaue Punkt (nur sichtbar wenn Tracking an + Position gefunden) */}
            {isTracking && position && (
                <Marker position={position} icon={userIcon}>
                    <Popup>Du bist hier</Popup>
                </Marker>
            )}

            {/* Die Buttons unten rechts */}
            <div className={styles.controlsContainer}>
                
                {/* 1. Zum Festival Button */}
                <button 
                    className={styles.mapButton} 
                    onClick={goToFestival}
                    title="Zum Festival springen"
                >
                    <FaBeer /> {/* Bier-Icon für das Festival */}
                </button>

                {/* 2. GPS Toggle Button */}
                <button 
                    className={`${styles.mapButton} ${isTracking ? styles.activeButton : ''}`} 
                    onClick={toggleTracking}
                    title={isTracking ? "Standort deaktivieren" : "Standort aktivieren"}
                >
                    <FaLocationArrow />
                </button>
            </div>
        </>
    );
};

const HomePage = () => {
    // Attenkirchen Koordinaten
    const festivalPosition = [48.50555005218888, 11.75895927999904];

    // Das lila Test-Zelt (Polygon)
    const stageArea = [
        [48.50555, 11.75896], 
        [48.50600, 11.75896], 
        [48.50600, 11.76000], 
        [48.50555, 11.76000], 
    ];

    const stageStyle = { color: 'purple', fillColor: 'purple', fillOpacity: 0.4 };

    return (
        <div className={styles.mapWrapper}>
            <MapContainer 
                attributionControl={false}
                center={festivalPosition} 
                zoom={17} 
                zoomControl={false} // Zoom Buttons ausblenden für cleaneren Look (optional)
                className={styles.mapContainer}
            >
                <AttributionControl prefix={false} position="bottomleft" /> {/* Links verschoben wegen Buttons rechts */}
                
                <LayersControl position="topright"> {/* Oben links, damit es nicht mit Buttons kollidiert */}
                    <LayersControl.BaseLayer checked name="Straßenkarte">
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxNativeZoom={19}
                            maxZoom={25}
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellit">
                        <TileLayer
                            attribution='Tiles &copy; Esri'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            maxNativeZoom={18} 
                            maxZoom={25}
                        />
                    </LayersControl.BaseLayer>
                </LayersControl>

                {/* Hier unsere neuen Controls einbinden und Koordinaten übergeben */}
                <MapControls festivalCoords={festivalPosition} />

                <Polygon pathOptions={stageStyle} positions={stageArea}>
                    <Popup>
                        <div style={{ textAlign: 'center' }}>
                            <strong>📍 Festzelt Attenkirchen</strong><br/>
                            Hier spielt die Musik!
                        </div>
                    </Popup>
                </Polygon>

            </MapContainer>
        </div>
    );
};

export default HomePage;