import React, { useState, useEffect } from 'react';
import { Marker, Popup, Polygon, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import BaseMap from '../components/map/BaseMap';
import { fetchCachedData } from '../services/cacheService';
import { createPoiIcon } from '../components/map/IconFactory';
import { FaLocationArrow, FaBeer } from 'react-icons/fa'; 
import styles from './HomePage.module.css';

// --- Icon Definition (Blauer Punkt für User) ---
const userIcon = L.divIcon({
    className: styles.userLocationDot,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// --- Komponente: MapControls  ---
const MapControls = ({ festivalCoords }) => {
    const [userPosition, setUserPosition] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const map = useMap();

    useEffect(() => {
        map.locate({ watch: true, enableHighAccuracy: true });
        const onLocationFound = (e) => setUserPosition(e.latlng);
        const onLocationError = (e) => console.warn("GPS Fehler:", e.message);

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
            map.stopLocate();
        };
    }, [map]);

    useEffect(() => {
        if (isFollowing && userPosition) {
            map.panTo(userPosition, { animate: true, duration: 1.0 });
        }
    }, [userPosition, isFollowing, map]);

    useMapEvents({
        dragstart: () => setIsFollowing(false),
    });

    const handleLocateClick = () => {
        if (isFollowing) {
            setIsFollowing(false);
            return;
        }
        if (userPosition) {
            setIsFollowing(true);
            map.flyTo(userPosition, 18, { duration: 1.5 });
        } else {
            alert("Suche Standort...");
            map.locate({ setView: true, maxZoom: 18 });
        }
    };

    const handleFestivalClick = () => {
        setIsFollowing(false);
        map.flyTo(festivalCoords, 17, { duration: 1.5 });
    };

    return (
        <>
            {userPosition && (
                <Marker position={userPosition} icon={userIcon}>
                    <Popup>Du bist hier</Popup>
                </Marker>
            )}
            <div className={styles.controlsContainer}>
                <button className={styles.mapButton} onClick={handleFestivalClick}>
                    <FaBeer />
                </button>
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
    const [pois, setPois] = useState([]);
    const festivalPosition = [48.50555005218888, 11.75895927999904];

    // 1. Lade alle platzierten POIs aus dem Cache (schnell für normale User)
    useEffect(() => {
        const loadMapData = async () => {
            const endpoints = [
                { type: 'tavern', url: '/api/taverns' },
                { type: 'stage', url: '/api/stages' },
                { type: 'gastronomy', url: '/api/gastronomies' },
                { type: 'facility', url: '/api/facilities' }
            ];

            let allPlacedPois = [];
            
            for (const ep of endpoints) {
                try {
                    // Nutzt den zentralen Cache, feuert das Backend also nur 1x am Tag ab!
                    const data = await fetchCachedData(ep.url);
                    if (data) {
                        // Filtere nur die heraus, die auch Koordinaten haben
                        const placed = data
                            .filter(item => item.lat && item.lon)
                            .map(item => ({ ...item, type: ep.type }));
                        allPlacedPois = [...allPlacedPois, ...placed];
                    }
                } catch (error) {
                    console.error(`Map: Fehler beim Laden von ${ep.url}`, error);
                }
            }
            setPois(allPlacedPois);
        };

        loadMapData();
    }, []);

    return (
        <div className={styles.mapWrapper}>
            
            <BaseMap center={festivalPosition} zoom={17} className={styles.mapContainer}>
                
                {/* 3. Deine Custom Controls (GPS etc.) als Kind-Element übergeben */}
                <MapControls festivalCoords={festivalPosition} />
                

                {/* 4. Alle POIs dynamisch rendern */}
                {pois.map(poi => (
                    <Marker 
                        key={`${poi.type}-${poi.id}`} 
                        position={[poi.lat, poi.lon]}
                        icon={createPoiIcon(poi)}
                    >
                        <Popup>
                            <div style={{ textAlign: 'center', minWidth: '150px' }}>
                                {/* Falls ein Bild existiert, zeigen wir es im Popup klein an */}
                                {poi.imgUrl && (
                                    <img 
                                        src={poi.imgUrl} 
                                        alt={poi.name} 
                                        style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} 
                                    />
                                )}
                                <strong style={{ display: 'block', fontSize: '1.1rem', color: '#1b4332' }}>{poi.name}</strong>
                                
                                {/* Kategorie-spezifische Zusätze */}
                                {poi.type === 'gastronomy' && poi.type && <span style={{ color: '#64748b' }}>{poi.type.name}</span>}
                                {poi.type === 'facility' && poi.facilityType && <span style={{ color: '#64748b' }}>{poi.facilityType.name}</span>}
                                
                                {/* Quickinfo: Biere bei Schenken */}
                                {poi.type === 'tavern' && poi.beers && poi.beers.length > 0 && (
                                    <div style={{ marginTop: '10px', fontSize: '0.85rem', textAlign: 'left', background: '#f8fafc', padding: '5px', borderRadius: '4px' }}>
                                        <strong>🍺 Ausgeschenkt wird:</strong>
                                        <ul style={{ margin: '5px 0 0 0', paddingLeft: '15px' }}>
                                            {poi.beers.slice(0, 3).map(b => (
                                                <li key={b.beerId}>{b.name}</li>
                                            ))}
                                            {poi.beers.length > 3 && <li><i>+ {poi.beers.length - 3} weitere...</i></li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

            </BaseMap>
        </div>
    );
};

export default HomePage;