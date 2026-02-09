import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, LayersControl, AttributionControl, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; 
import { FaCrosshairs } from 'react-icons/fa'; // Icon für den Button
import styles from './HomePage.module.css';

// --- Definition des CSS-Icons (Blauer Punkt) ---
const userIcon = L.divIcon({
    className: styles.userLocationDot, // Zugriff auf Module CSS Klasse
    iconSize: [20, 20],
    iconAnchor: [10, 10], // Mitte des Punktes
    popupAnchor: [0, -10]
});

// --- Komponente: Handhabt Geolocation ---
const UserLocationMarker = () => {
    const [position, setPosition] = useState(null);
    const map = useMap();

    useEffect(() => {
        // 1. Beim Starten: Standort abfragen & beobachten (watch: true)
        map.locate({ 
            setView: true, // Zoomt am Anfang automatisch hin
            maxZoom: 25,
            watch: true,   // Live-Update wenn man läuft
            enableHighAccuracy: true 
        });

        // 2. Event Listener: Wenn Standort gefunden
        const onLocationFound = (e) => {
            setPosition(e.latlng);
            // map.flyTo(e.latlng, map.getZoom()); // Optional: Verfolgen
        };

        // 3. Event Listener: Wenn Fehler (z.B. User verweigert)
        const onLocationError = (e) => {
            console.warn("Standort Zugriff verweigert oder nicht verfügbar", e.message);
        };

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
            map.stopLocate(); // GPS aus, wenn Komponente entladen wird (Batterie sparen)
        };
    }, [map]);

    // Funktion für den "Zentrieren" Button
    const handleRecenter = () => {
        if (position) {
            map.flyTo(position, 25);
        } else {
            // Versuch es neu zu starten
            map.locate({ setView: true, maxZoom: 25 }); 
        }
    };

    return (
        <>
            {/* Der Blaue Punkt auf der Karte */}
            {position && (
                <Marker position={position} icon={userIcon}>
                    <Popup>Du bist hier</Popup>
                </Marker>
            )}

            {/* Button zum Zentrieren (schwebend über der Karte) */}
            <button 
                className={styles.locateButton} 
                onClick={handleRecenter}
                title="Meinen Standort finden"
            >
                <FaCrosshairs />
            </button>
        </>
    );
};

const HomePage = () => {
  // Fallback, falls GPS abgelehnt wird
    const centerPosition = [48.50555005218888, 11.75895927999904]; // Latitude, Longitude

    // Ein einfaches Viereck (Polygon), das eine "Area" markiert
    const stageArea = [
        [48.50555, 11.75896],  // Startpunkt (dein Zentrum)
        [48.50600, 11.75896],  // Etwas nach Norden
        [48.50600, 11.76000],  // Etwas nach Osten
        [48.50555, 11.76000],  // Zurück nach Süden
    ];

    const stageStyle = { color: 'purple', fillColor: 'purple', fillOpacity: 0.4 };

    return (
        <div className={styles.mapWrapper}>
            <MapContainer 
                attributionControl={false}
                center={centerPosition} 
                zoom={25} 
                scrollWheelZoom={true} 
                className={styles.mapContainer}
            >
              <AttributionControl prefix={false} position="bottomright" />
                <LayersControl position="topright">
                    
                    {/* Option 1: Standard Straßenkarte (Standard ausgewählt) */}
                    <LayersControl.BaseLayer checked name="Straßenkarte">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>

                    {/* Option 2: Satellit (Esri World Imagery) */}
                    <LayersControl.BaseLayer name="Satellit">
                        <TileLayer
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>

                </LayersControl>

                <UserLocationMarker />

                {/* Das lila Test-Zelt */}
                <Polygon pathOptions={stageStyle} positions={stageArea}>
                    <Popup>
                        <div style={{ textAlign: 'center' }}>
                            <strong>📍 Dein Standort-Test</strong><br/>
                            Koordinaten: 48.505, 11.759<br/>
                            <em style={{fontSize: '0.8rem'}}>Funktioniert!</em>
                        </div>
                    </Popup>
                </Polygon>

                {/* --- SPÄTER: Marker mit Icons ---
                <Marker position={[48.1355, 11.5500]} icon={beerIcon}>
                    <Popup>Bierausschank Mitte</Popup>
                </Marker> 
                */}

            </MapContainer>
        </div>
    );
};

export default HomePage;