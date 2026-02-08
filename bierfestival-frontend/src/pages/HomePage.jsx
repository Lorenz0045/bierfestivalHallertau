import React from 'react';
import { MapContainer, TileLayer, Polygon, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // WICHTIG: Sonst ist die Karte kaputt (Kacheln durcheinander)
import styles from './HomePage.module.css';

const HomePage = () => {
  // Start-Koordinaten 
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
                center={centerPosition} 
                zoom={20} 
                scrollWheelZoom={true} 
                className={styles.mapContainer}
            >
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