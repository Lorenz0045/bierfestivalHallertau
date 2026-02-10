import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, LayersControl, AttributionControl, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import { FaLocationArrow, FaBeer } from 'react-icons/fa'; 
import styles from './HomePage.module.css';

// --- Icon Definition (Blauer Punkt) ---
const userIcon = L.divIcon({
    className: styles.userLocationDot,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// --- Komponente: MapControls ---
const MapControls = ({ festivalCoords }) => {
    const [userPosition, setUserPosition] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false); // Verfolgen wir gerade?
    const map = useMap();

    // 1. Initiale GPS-Abfrage (läuft IMMER im Hintergrund)
    useEffect(() => {
        map.locate({ 
            watch: true, 
            enableHighAccuracy: true 
        });

        const onLocationFound = (e) => {
            setUserPosition(e.latlng);
        };

        const onLocationError = (e) => {
            console.warn("GPS Fehler:", e.message);
        };

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
            map.stopLocate();
        };
    }, [map]);

    // 2. Effekt: Wenn sich die Position ändert UND wir im "Following"-Modus sind
    useEffect(() => {
        if (isFollowing && userPosition) {
            // Wir bewegen die Karte sanft zum User, behalten aber den aktuellen Zoom bei
            // (außer beim ersten Klick, das macht die handleLocateClick Funktion)
            map.panTo(userPosition, { animate: true, duration: 1.0 });
        }
    }, [userPosition, isFollowing, map]);

    // 3. Event Listener: Wenn der User die Karte manuell verschiebt -> Tracking aus!
    // Wir nutzen useMapEvents für sauberere React-Integration
    useMapEvents({
        dragstart: () => {
            // Sobald der User zieht (Drag), stoppen wir das automatische Verfolgen
            setIsFollowing(false);
        },
        // Zoom-Events ignorieren wir absichtlich, damit Zoomen das Tracking NICHT beendet.
    });

    // Button 1: Tracking aktivieren (Click)
    const handleLocateClick = () => {
        // FALL A: Wir folgen bereits -> BEENDEN
        if (isFollowing) {
            setIsFollowing(false);
            return; // Hier abbrechen
        }

        // FALL B: Wir folgen noch nicht -> STARTEN
        if (userPosition) {
            setIsFollowing(true);
            // Hart ranzoomen beim Aktivieren
            map.flyTo(userPosition, 18, { duration: 1.5 });
        } else {
            // Falls noch keine Position da ist (GPS lädt noch)
            alert("Suche Standort...");
            map.locate({ setView: true, maxZoom: 18 });
        }
    };

    // Button 2: Zum Festival
    const handleFestivalClick = () => {
        setIsFollowing(false); // Tracking aus, wir wollen ja wegsehen
        map.flyTo(festivalCoords, 17, { duration: 1.5 });
    };

    return (
        <>
            {/* Der Punkt ist IMMER da, wenn Position bekannt */}
            {userPosition && (
                <Marker position={userPosition} icon={userIcon}>
                    <Popup>Du bist hier</Popup>
                </Marker>
            )}

            <div className={styles.controlsContainer}>
                {/* Zum Festival */}
                <button 
                    className={styles.mapButton} 
                    onClick={handleFestivalClick}
                >
                    <FaBeer />
                </button>

                {/* Zum User (Toggle-Optik, aber Verhalten wie beschrieben) */}
                <button 
                    className={`${styles.mapButton} ${isFollowing ? styles.activeButton : ''}`} 
                    onClick={handleLocateClick}
                >
                    <FaLocationArrow />
                </button>
            </div>
        </>
    );
};

// --- Haupt-Page ---
const HomePage = () => {
    // Attenkirchen Koordinaten
    const festivalPosition = [48.50555005218888, 11.75895927999904];

    // Dein Test-Rechteck
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
                zoomControl={false} 
                className={styles.mapContainer}
            >
                <AttributionControl prefix={false} position="bottomleft" />
                
                <LayersControl position="topright">
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