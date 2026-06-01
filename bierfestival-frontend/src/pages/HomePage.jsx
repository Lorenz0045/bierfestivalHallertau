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
import { FaLocationArrow, FaBeer, FaInfoCircle, FaTimes, FaGlobe, FaCalendarAlt } from 'react-icons/fa';
import styles from './HomePage.module.css';

// --- User Location Icon ---
const userIcon = L.divIcon({
    className: styles.userLocationDot,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

// Event-Helper: Tagesname ohne Timezone-Shift
const getEventDay = (isoStr) => {
    if (!isoStr) return 'Sonstige';
    return isoStr.substring(0, 10);
};

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
        return () => { map.off('locationfound', onLocationFound); map.off('locationerror', onLocationError); map.stopLocate(); };
    }, [map]);

    useEffect(() => {
        if (isFollowing && userPosition) map.panTo(userPosition, { animate: true, duration: 1.0 });
    }, [userPosition, isFollowing, map]);

    useEffect(() => {
        if (jumpCoords) { setIsFollowing(false); map.flyTo([jumpCoords.lat, jumpCoords.lon], 18, { duration: 1.5 }); }
    }, [jumpCoords, map]);

    useMapEvents({ dragstart: () => setIsFollowing(false) });

    const handleLocateClick = () => {
        if (isFollowing) { setIsFollowing(false); return; }
        if (userPosition) { setIsFollowing(true); map.flyTo(userPosition, 18, { duration: 1.5 }); }
        else { map.locate({ setView: true, maxZoom: 18 }); }
    };

    return (
        <>
            {userPosition && <Marker position={userPosition} icon={userIcon}><Popup>Du bist hier</Popup></Marker>}
            <div className={styles.controlsContainer}>
                <button className={`${styles.mapButton} ${isFollowing ? styles.activeButton : ''}`} onClick={handleLocateClick} title="Mein Standort">
                    <FaLocationArrow />
                </button>
            </div>
        </>
    );
};

// Sub-component: Stage events grouped by day
const StageEventsByDay = ({ events, stageId }) => {
    const stageEvents = events.filter(e => e.stage?.id === stageId);
    const groups = {};
    stageEvents.forEach(ev => {
        const day = ev.dayName || getEventDay(ev.startTime);
        if (!groups[day]) groups[day] = [];
        groups[day].push(ev);
    });
    Object.values(groups).forEach(arr => arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
    const days = Object.keys(groups).sort((a, b) => {
        const tA = groups[a][0]?.startTime ? new Date(groups[a][0].startTime).getTime() : 0;
        const tB = groups[b][0]?.startTime ? new Date(groups[b][0].startTime).getTime() : 0;
        return tA - tB;
    });

    const [selectedDay, setSelectedDay] = useState(days[0] || '');

    if (days.length === 0) return <p className={styles.poiMeta}>Derzeit kein Programm gelistet.</p>;

    return (
        <div className={styles.stageProgram}>
            <h4><FaCalendarAlt /> Programm auf dieser Bühne</h4>
            <div className={styles.dayTabs}>
                {days.map(day => (
                    <button key={day} className={`${styles.dayTab} ${selectedDay === day ? styles.dayActive : ''}`} onClick={() => setSelectedDay(day)}>
                        {day}
                    </button>
                ))}
            </div>
            <div className={styles.eventList}>
                {(groups[selectedDay] || []).map(ev => (
                    <div key={ev.id} className={styles.eventItem}>
                        <span className={styles.eventTime}>
                            {ev.startTime ? ev.startTime.substring(11, 16) + ' Uhr' : ''}
                            {ev.endTime ? ` – ${ev.endTime.substring(11, 16)} Uhr` : ''}
                        </span>
                        <span className={styles.eventName}>{ev.name}</span>
                    </div>
                ))}
            </div>
        </div>
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
                        const placed = data.filter(item => item.lat && item.lon).map(item => ({ ...item, type: ep.type }));
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

    const [events, setEvents] = useState([]);
    const [allBeers, setAllBeers] = useState([]);
    const [taverns, setTaverns] = useState([]);
    useEffect(() => {
        Promise.all([
            fetchCachedData('/api/events'),
            fetchCachedData('/api/beers'),
            fetchCachedData('/api/taverns'),
        ]).then(([evData, beerData, tavernData]) => {
            if (evData) setEvents(evData);
            if (beerData) setAllBeers(beerData);
            if (tavernData) setTaverns(tavernData);
        }).catch(() => { });
    }, []);

    // Build beer→tavern lookup
    const beerTavernMap = useMemo(() => {
        const map = {};
        taverns.forEach(t => {
            (t.beers || []).forEach(b => {
                if (!map[b.beerId]) map[b.beerId] = [];
                map[b.beerId].push({ id: t.id, name: t.name, lat: t.lat, lon: t.lon });
            });
        });
        return map;
    }, [taverns]);

    const handleMarkerClick = (poi) => setSelectedPoi(poi);

    const handleJumpToMap = (item) => {
        if (item?.lat && item?.lon) {
            navigate('/', { state: { jumpToPoi: { lat: item.lat, lon: item.lon } } });
        }
    };

    const getPoiTypeLabel = (type) => {
        const labels = { tavern: 'Schenke', stage: 'Bühne', gastronomy: 'Gastronomie', facility: 'Einrichtung', craftmarket: 'Marktstand' };
        return labels[type] || type;
    };

    // Determine if icon should be large (120px) for Schenken/Bühnen
    const isLargeIcon = (type) => type === 'tavern' || type === 'stage';

    return (
        <div className={styles.mapWrapper}>
            
            <div className={styles.sponsorOverlay}>
                <SponsorBanner />
            </div>

            <button className={styles.infoButton} onClick={() => setShowInfoPanel(!showInfoPanel)} title="Informationen">
                {showInfoPanel ? <FaTimes /> : <FaInfoCircle />}
            </button>

            {showInfoPanel && (
                <div className={styles.infoPanel}>
                    <h4>Informationen</h4>
                    <Link to="/impressum" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Impressum</Link>
                    <Link to="/datenschutz" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Datenschutzerklärung</Link>
                </div>
            )}

            <BaseMap center={festivalPosition} zoom={17} className={styles.mapContainer}>
                <MapControls festivalCoords={festivalPosition} jumpCoords={jumpToPoi} />
                {pois.map(poi => (
                    <Marker key={`${poi.type}-${poi.id}`} position={[poi.lat, poi.lon]} icon={createPoiIcon(poi)} eventHandlers={{ click: () => handleMarkerClick(poi) }} />
                ))}
            </BaseMap>

            

            {/* POI Detail BottomSheet */}
            <BottomSheet isOpen={!!selectedPoi} onClose={() => setSelectedPoi(null)} title={selectedPoi?.name || ''}>
                {selectedPoi && (
                    <div className={styles.poiDetail}>
                        {selectedPoi.imgUrl && (
                            <img
                                src={selectedPoi.imgUrl}
                                alt={selectedPoi.name}
                                className={isLargeIcon(selectedPoi.type) ? styles.poiImgLarge : styles.poiImgSmall}
                            />
                        )}
                        <span className={styles.poiType}>{getPoiTypeLabel(selectedPoi.type)}</span>

                        {selectedPoi.description && <p className={styles.poiDesc}>{selectedPoi.description}</p>}
                        {selectedPoi.website && (
                            <a href={selectedPoi.website} target="_blank" rel="noopener noreferrer" className={styles.poiWebsite}>
                                <FaGlobe /> Website besuchen
                            </a>
                        )}

                        {selectedPoi.type === 'gastronomy' && selectedPoi.type && (
                            <p className={styles.poiMeta}>🍴 {selectedPoi.gastronomyType?.name || selectedPoi.type?.name}</p>
                        )}
                        {selectedPoi.type === 'facility' && selectedPoi.facilityType && (
                            <p className={styles.poiMeta}>ℹ️ {selectedPoi.facilityType.name}</p>
                        )}

                        {/* Bühne: Programm mit Tagesaufteilung */}
                        {selectedPoi.type === 'stage' && (
                            <StageEventsByDay events={events} stageId={selectedPoi.id} />
                        )}

                        {/* Schenke: Biere */}
                        {selectedPoi.type === 'tavern' && selectedPoi.beers?.length > 0 && (
                            <div className={styles.tavernBeers}>
                                <h4><FaBeer /> Ausgeschenkte Biere ({selectedPoi.beers.length})</h4>
                                {selectedPoi.beers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(beer => {
                                    const fullBeer = allBeers.find(b => b.id === beer.beerId);
                                    return (
                                        <BeerCard
                                            key={beer.beerId}
                                            beer={fullBeer ? {
                                                beerId: fullBeer.id, name: fullBeer.name,
                                                breweryName: fullBeer.brewery?.name, breweryId: fullBeer.brewery?.id,
                                                typeName: fullBeer.beerType?.name,
                                                alcoholPercentage: fullBeer.alcoholPercentage,
                                                isNonAlcoholic: fullBeer.isNonAlcoholic,
                                                description: fullBeer.description,
                                                originalGravity: fullBeer.originalGravity,
                                            } : {
                                                beerId: beer.beerId, name: beer.name,
                                                breweryName: beer.breweryName, typeName: beer.typeName,
                                                alcoholPercentage: beer.alcoholPercentage,
                                                isNonAlcoholic: beer.isNonAlcoholic,
                                            }}
                                            trackingState={getBeerState(beer.beerId)}
                                            onToggleMerkliste={toggleMerkliste}
                                            onLogDrink={logDrink}
                                            onRemoveDrink={removeDrink}
                                            onRate={rateBeer}
                                            taverns={beerTavernMap[beer.beerId] || []}
                                            onJumpToMap={handleJumpToMap}
                                            compact
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};

export default HomePage;