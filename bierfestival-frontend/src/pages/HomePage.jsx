import React from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // WICHTIG: Sonst ist die Karte kaputt (Kacheln durcheinander)
import styles from './HomePage.module.css';

const HomePage = () => {
  // Start-Koordinaten 
    const centerPosition = [48.1351, 11.5495]; // Latitude, Longitude

    // Ein einfaches Viereck (Polygon), das eine "Area" markiert
    const stageArea = [
        [48.1351, 11.5495],
        [48.1360, 11.5495],
        [48.1360, 11.5510],
        [48.1351, 11.5510],
    ];

    const stageStyle = { color: 'purple', fillColor: 'purple', fillOpacity: 0.4 };

    return (
        <div className={styles.mapWrapper}>
            <MapContainer 
                center={centerPosition} 
                zoom={15} 
                scrollWheelZoom={true} 
                className={styles.mapContainer}
            >
                {/* 1. Die Basiskarte (OpenStreetMap - kostenlos) */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* 2. Test-Objekt: Ein lila Bereich (klickbar!) */}
                <Polygon pathOptions={stageStyle} positions={stageArea}>
                    <Popup>
                        <div style={{ textAlign: 'center' }}>
                            <strong>🍻 Festzelt "Zur Post"</strong><br/>
                            Hier gibt es Helles und Brezn.<br/>
                            <em style={{fontSize: '0.8rem'}}>Klick für Details...</em>
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