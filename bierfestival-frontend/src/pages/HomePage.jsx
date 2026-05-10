import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import BaseMap from '../components/map/BaseMap';
import { fetchCachedData } from '../services/cacheService';
import { createPoiIcon } from '../components/map/IconFactory';
import BottomSheet from '../components/UI/BottomSheet';
import BeerCard from '../components/UI/BeerCard';
import SponsorBanner from '../components/UI/SponsorBanner';
import useTracking from '../hooks/useTracking';
import { FaLocationArrow, FaBeer, FaInfoCircle, FaTimes, FaGlobe, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import styles from './HomePage.module.css';

// --- User Location Icon ---
const userIcon = L.divIcon({
    className: styles.userLocationDot,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// --- Map Controls ---
const MapControls = ({ festivalCoords, jumpCoords }) => {
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

    useEffect(() => {
        if (jumpCoords) {
            setIsFollowing(false);
            map.flyTo([jumpCoords.lat, jumpCoords.lon], 18, { duration: 1.5 });
        }
    }, [jumpCoords, map]);

    useMapEvents({
        dragstart: () => setIsFollowing(false),
    });

    const handleLocateClick = () => {
        if (isFollowing) { setIsFollowing(false); return; }
        if (userPosition) {
            setIsFollowing(true);
            map.flyTo(userPosition, 18, { duration: 1.5 });
        } else {
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
                <button className={styles.mapButton} onClick={handleFestivalClick} title="Festival-Zentrum">
                    <FaBeer />
                </button>
                <button 
                    className={`${styles.mapButton} ${isFollowing ? styles.activeButton : ''}`} 
                    onClick={handleLocateClick}
                    title="Mein Standort"
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
    const [selectedPoi, setSelectedPoi] = useState(null);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const festivalPosition = [48.50555005218888, 11.75895927999904];
    const jumpToPoi = location.state?.jumpToPoi;

    const { getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();

    // Lade alle POIs
    useEffect(() => {
        const loadMapData = async () => {
            const endpoints = [
                { type: 'tavern', url: '/api/taverns' },
                { type: 'stage', url: '/api/stages' },
                { type: 'gastronomy', url: '/api/gastronomies' },
                { type: 'facility', url: '/api/facilities' },
                { type: 'craftmarket', url: '/api/craft-markets' },
            ];

            let allPlacedPois = [];
            for (const ep of endpoints) {
                try {
                    const data = await fetchCachedData(ep.url);
                    if (data) {
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

    // Events für Bühnen laden
    const [events, setEvents] = useState([]);
    useEffect(() => {
        fetchCachedData('/api/events').then(d => d && setEvents(d)).catch(() => {});
    }, []);

    const stageEvents = useMemo(() => {
        if (!selectedPoi || selectedPoi.type !== 'stage') return [];
        return events
            .filter(e => e.stage?.id === selectedPoi.id)
            .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    }, [selectedPoi, events]);

    const formatTime = (iso) => iso ? iso.substring(11, 16) + ' Uhr' : '';

    const handleMarkerClick = (poi) => {
        setSelectedPoi(poi);
    };

    const getPoiTypeLabel = (type) => {
        const labels = { tavern: 'Schenke', stage: 'Bühne', gastronomy: 'Gastronomie', facility: 'Einrichtung', craftmarket: 'Handwerkerstand' };
        return labels[type] || type;
    };

    return (
        <div className={styles.mapWrapper}>
            {/* (i) Info Button */}
            <button className={styles.infoButton} onClick={() => setShowInfoPanel(!showInfoPanel)} title="Informationen">
                {showInfoPanel ? <FaTimes /> : <FaInfoCircle />}
            </button>

            {showInfoPanel && (
                <div className={styles.infoPanel}>
                    <h4>Informationen</h4>
                    <Link to="/impressum" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Impressum</Link>
                    <Link to="/datenschutz" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Datenschutzerklärung</Link>
                    <Link to="/nutzungsbedingungen" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Nutzungsbedingungen</Link>
                </div>
            )}

            <BaseMap center={festivalPosition} zoom={17} className={styles.mapContainer}>
                <MapControls festivalCoords={festivalPosition} jumpCoords={jumpToPoi} />

                {pois.map(poi => (
                    <Marker
                        key={`${poi.type}-${poi.id}`}
                        position={[poi.lat, poi.lon]}
                        icon={createPoiIcon(poi)}
                        eventHandlers={{ click: () => handleMarkerClick(poi) }}
                    />
                ))}
            </BaseMap>

            {/* Sponsor Banner */}
            <div className={styles.sponsorOverlay}>
                <SponsorBanner />
            </div>

            {/* POI Detail BottomSheet */}
            <BottomSheet
                isOpen={!!selectedPoi}
                onClose={() => setSelectedPoi(null)}
                title={selectedPoi?.name || ''}
            >
                {selectedPoi && (
                    <div className={styles.poiDetail}>
                        {selectedPoi.imgUrl && (
                            <img src={selectedPoi.imgUrl} alt={selectedPoi.name} className={styles.poiImg} />
                        )}
                        <span className={styles.poiType}>{getPoiTypeLabel(selectedPoi.type)}</span>

                        {selectedPoi.description && (
                            <p className={styles.poiDesc}>{selectedPoi.description}</p>
                        )}

                        {selectedPoi.website && (
                            <a href={selectedPoi.website} target="_blank" rel="noopener noreferrer" className={styles.poiWebsite}>
                                <FaGlobe /> Website besuchen
                            </a>
                        )}

                        {/* Gastronomie-Typ */}
                        {selectedPoi.type === 'gastronomy' && selectedPoi.gastronomyType && (
                            <p className={styles.poiMeta}>🍴 {selectedPoi.gastronomyType.name}</p>
                        )}

                        {/* Einrichtung-Typ */}
                        {selectedPoi.type === 'facility' && selectedPoi.facilityType && (
                            <p className={styles.poiMeta}>ℹ️ {selectedPoi.facilityType.name}</p>
                        )}

                        {/* Bühne: Programm */}
                        {selectedPoi.type === 'stage' && stageEvents.length > 0 && (
                            <div className={styles.stageProgram}>
                                <h4><FaCalendarAlt /> Programm</h4>
                                {stageEvents.map(ev => (
                                    <div key={ev.id} className={styles.eventItem}>
                                        <span className={styles.eventTime}>{formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ''}</span>
                                        <span className={styles.eventName}>{ev.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Schenke: Biere */}
                        {selectedPoi.type === 'tavern' && selectedPoi.beers?.length > 0 && (
                            <div className={styles.tavernBeers}>
                                <h4><FaBeer /> Ausgeschenkte Biere ({selectedPoi.beers.length})</h4>
                                {selectedPoi.beers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(beer => (
                                    <BeerCard
                                        key={beer.beerId}
                                        beer={{
                                            beerId: beer.beerId,
                                            name: beer.name,
                                            breweryName: beer.breweryName,
                                            typeName: beer.typeName,
                                            alcoholPercentage: beer.alcoholPercentage,
                                            isNonAlcoholic: beer.isNonAlcoholic,
                                        }}
                                        trackingState={getBeerState(beer.beerId)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        compact
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};

export default HomePage;