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
import EventItem from '../components/UI/EventItem';
import useTracking from '../hooks/useTracking';
import { FaLocationArrow, FaBeer, FaInfoCircle, FaTimes, FaGlobe, FaCalendarAlt, FaAngleRight } from 'react-icons/fa';
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
        if (jumpCoords) { setIsFollowing(false); map.flyTo([jumpCoords.lat, jumpCoords.lon], 19, { duration: 1.5 }); }
    }, [jumpCoords, map]);

    useMapEvents({ dragstart: () => setIsFollowing(false) });

    const handleLocateClick = () => {
        if (isFollowing) { setIsFollowing(false); return; }
        if (userPosition) { setIsFollowing(true); map.flyTo(userPosition, 19, { duration: 1.5 }); }
        else { map.locate({ setView: true, maxZoom: 19 }); }
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

            <div className={styles.stageEventList}>
                {(groups[selectedDay] || []).map(ev => (
                    <EventItem
                        key={ev.id}
                        event={ev}
                        showStage={false} // Versteckt den Bühnen-Namen im Item
                    // Absichtlich kein onJumpToMap übergeben! 
                    // Dadurch wird der Map-Button in der EventItem Komponente automatisch ausgeblendet.
                    />
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
                        const placed = data.filter(item => item.lat && item.lon).map(item => ({
                            ...item,
                            gastronomyType: ep.type === 'gastronomy' ? item.type : item.gastronomyType,
                            type: ep.type
                        }));
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

    // Listener für "Overlays schließen" (Lageplan scrollt nicht, aber schließt BottomSheets)
    useEffect(() => {
        const handleTabReclick = (e) => {
            if (e.detail === '/') {
                setSelectedPoi(null);
                setBreweryDetail(null);
                setShowInfoPanel(false);
            }
        };
        window.addEventListener('bf-tab-reclick', handleTabReclick);
        return () => window.removeEventListener('bf-tab-reclick', handleTabReclick);
    }, []);

    const [events, setEvents] = useState([]);
    const [allBeers, setAllBeers] = useState([]);
    const [taverns, setTaverns] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [breweryDetail, setBreweryDetail] = useState(null);
    useEffect(() => {
        Promise.all([
            fetchCachedData('/api/events'),
            fetchCachedData('/api/beers'),
            fetchCachedData('/api/taverns'),
            fetchCachedData('/api/breweries'),
            fetchCachedData('/api/sponsors'),
        ]).then(([evData, beerData, tavernData, breweryData, sponsorData]) => {
            if (evData) setEvents(evData);
            if (beerData) setAllBeers(beerData);
            if (tavernData) setTaverns(tavernData);
            if (breweryData) setBreweries(breweryData);
            if (sponsorData) setSponsors(sponsorData);
        }).catch(() => { });
    }, []);

    // Brauermarkt: Brauereien mit isBrewersMarket=true
    const brauermarktBreweries = useMemo(() =>
        breweries.filter(b => b.isBrewersMarket).sort((a, b) => a.name.localeCompare(b.name)),
        [breweries]);

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

    const handleMarkerClick = (poi) => {
        const noOverlayNames = ['Kasse', 'WC', 'Festbuero', 'Kinderprogramm', 'Jugendzelt', 'Rotes Kreuz', 'Parkplatz'];

        if (poi.type === 'facility') {
            if (noOverlayNames.includes(poi.facilityType.name)) {
                return;
            }
        }

        setSelectedPoi(poi);
    };

    const handleBreweryClick = (breweryId) => {
        const brewery = breweries.find(b => b.id === breweryId);
        if (brewery) setBreweryDetail(brewery);
    };

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
                <SponsorBanner onSponsorClick={(sponsor) => setSelectedPoi({ ...sponsor, type: 'sponsor' })} />
            </div>

            <button className={styles.infoButton} onClick={() => setShowInfoPanel(!showInfoPanel)} title="Informationen">
                {showInfoPanel ? <FaTimes /> : <FaInfoCircle />}
            </button>

            {showInfoPanel && (
                <div className={styles.infoPanel}>
                    <h4>Informationen</h4>
                    <Link to="/impressum" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Impressum</Link>
                    <Link to="/datenschutz" className={styles.infoLink} onClick={() => setShowInfoPanel(false)}>Datenschutzerklärung</Link>
                    <button 
                        className={styles.infoLink} 
                        style={{ background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                        onClick={() => {
                            setShowInfoPanel(false);
                            window.dispatchEvent(new Event('openCookieSettings'));
                        }}
                    >
                        Datenschutzeinstellungen
                    </button>
                </div>
            )}

            <BaseMap center={festivalPosition} zoom={17} className={styles.mapContainer}>
                <MapControls festivalCoords={festivalPosition} jumpCoords={jumpToPoi} />
                {pois.map(poi => (
                    <Marker key={`${poi.type}-${poi.id}`} position={[poi.lat, poi.lon]} icon={createPoiIcon(poi)} eventHandlers={{ click: () => handleMarkerClick(poi) }} />
                ))}
            </BaseMap>



            {/* POI Detail BottomSheet */}
            <BottomSheet isOpen={!!selectedPoi && !breweryDetail} onClose={() => setSelectedPoi(null)} title={selectedPoi?.name || ''}>
                {selectedPoi && (
                    <div className={styles.poiDetail}>

                        {/* =========================================
                            BRAUERMARKT (Spezialfall)
                            ========================================= */}
                        {selectedPoi.name === 'Brauermarkt' ? (
                            <div style={{ padding: '8px 0' }}>
                                {(() => {
                                    // Filtere nur Sponsoren, deren Tier-Name "Platin" enthält
                                    const platinSponsors = sponsors
                                        .filter(s => s.tier && s.tier.name.toLowerCase().includes('platin'))
                                        .sort((a, b) => (a.tier?.sortOrder || 99) - (b.tier?.sortOrder || 99));

                                    return (
                                        <p className={styles.brauermarktInfoText}>
                                            {platinSponsors.length > 0 && (
                                                <>
                                                    Das Bierfestival wird präsentiert von unseren Platinsponsoren{' '}
                                                    {platinSponsors.map((s, i, arr) => (
                                                        <span key={s.id}>
                                                            <button
                                                                className={styles.inlineLink}
                                                                onClick={() => setSelectedPoi({ ...s, type: 'sponsor' })}
                                                            >
                                                                {s.name}
                                                            </button>
                                                            {i < arr.length - 1 ? (i === arr.length - 2 ? ' und ' : ', ') : ''}
                                                        </span>
                                                    ))}.{' '}
                                                </>
                                            )}
                                            Neben deren Ständen könnt ihr euch auf unserem Brauermarkt auch von folgenden Brauereien überraschen lassen und deren Spezialitäten genießen:
                                        </p>
                                    );
                                })()}

                                <div className={styles.brauermarktBreweryList}>
                                    {brauermarktBreweries.map(brewery => (
                                        <div
                                            key={brewery.id}
                                            className={styles.brauermarktBreweryItem}
                                            onClick={() => handleBreweryClick(brewery.id)}
                                        >
                                            <div className={styles.detailHeaderIconWrapper} style={{ width: '50px', height: '50px' }}>
                                                {brewery.imgUrl ? (
                                                    <img src={brewery.imgUrl} alt={brewery.name} className={styles.detailHeaderImg} />
                                                ) : (
                                                    <div className={styles.detailHeaderFallback} style={{ fontSize: '1rem' }}>
                                                        {brewery.name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <strong style={{ fontSize: '0.9rem', color: 'var(--bf-dark-green)' }}>{brewery.name}</strong>
                                                {brewery.city && (
                                                    <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--bf-text-muted)' }}>📍 {brewery.city.name}</span>
                                                )}
                                            </div>
                                            <FaAngleRight style={{ color: 'var(--bf-text-muted)', flexShrink: 0 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* =========================================
                                    REGULÄRER POI HEADER (Nicht-Sponsor)
                                    ========================================= */}
                                {selectedPoi.type !== 'sponsor' && (
                                    <div className={styles.detailHeaderRow}>
                                        <div className={styles.detailHeaderIconWrapper}>
                                            {selectedPoi.imgUrl || selectedPoi.facilityType?.imgUrl ? (
                                                <img
                                                    src={selectedPoi.imgUrl || selectedPoi.facilityType.imgUrl}
                                                    alt={selectedPoi.name}
                                                    className={styles.detailHeaderImg}
                                                />
                                            ) : (
                                                <div className={styles.detailHeaderFallback}>
                                                    {selectedPoi.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.detailHeaderInfo}>
                                            <span className={styles.detailTypeBadge}>{getPoiTypeLabel(selectedPoi.type)}</span>

                                            {selectedPoi.city && (
                                                <span className={styles.detailMetaText}>📍 {selectedPoi.city.name || selectedPoi.city}</span>
                                            )}
                                            {selectedPoi.district && (
                                                <span className={styles.detailMetaText}>🗺️ {selectedPoi.district.name || selectedPoi.district}</span>
                                            )}

                                            {/* Spezifische Typen */}
                                            {selectedPoi.type === 'gastronomy' && selectedPoi.gastronomyType && (
                                                <span className={styles.detailMetaText}>🍴 {selectedPoi.gastronomyType.name || selectedPoi.type?.name}</span>
                                            )}
                                            {selectedPoi.type === 'facility' && selectedPoi.facilityType && (
                                                <span className={styles.detailMetaText}>ℹ️ {selectedPoi.facilityType.name}</span>
                                            )}
                                        </div>

                                        <div className={styles.detailHeaderActions}>
                                            {selectedPoi.website && (
                                                <div className={styles.actionWrapper}>
                                                    <a href={selectedPoi.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
                                                        <FaGlobe /> Zur Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* =========================================
                            SPONSOR HEADER
                            ========================================= */}
                                {selectedPoi.type === 'sponsor' && (
                                    <div className={styles.detailHeaderRow}>
                                        <div className={styles.detailHeaderIconWrapper}>
                                            {selectedPoi.imgUrl ? (
                                                <img src={selectedPoi.imgUrl} alt={selectedPoi.name} className={styles.detailHeaderImg} />
                                            ) : (
                                                <div className={styles.detailHeaderFallback}>{selectedPoi.name?.substring(0, 2).toUpperCase()}</div>
                                            )}
                                        </div>
                                        <div className={styles.detailHeaderInfo}>
                                            {/* HIER: Tier Name & Icon direkt als grünes Badge! */}
                                            <span className={styles.detailTypeBadge}>
                                                {selectedPoi.tier?.imgUrl && <img src={selectedPoi.tier.imgUrl} alt="Tier" style={{ height: '14px', marginRight: '4px', verticalAlign: 'middle' }} />}
                                                {selectedPoi.tier?.name || 'Sponsor'}
                                            </span>
                                            {selectedPoi.city && <span className={styles.detailMetaText}>📍 {selectedPoi.city.name || selectedPoi.city}</span>}
                                        </div>
                                        <div className={styles.detailHeaderActions}>
                                            {selectedPoi.website && (
                                                <div className={styles.actionWrapper}>
                                                    <a href={selectedPoi.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
                                                        <FaGlobe /> Zur Website
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* =========================================
                            GEMEINSAMER INHALT
                            ========================================= */}
                                {selectedPoi.description && <p className={styles.poiDesc}>{selectedPoi.description}</p>}

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
                                                    onBreweryClick={handleBreweryClick}
                                                    taverns={beerTavernMap[beer.beerId] || []}
                                                    onJumpToMap={handleJumpToMap}
                                                    compact={true}
                                                    hideTavernLinks={true}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </BottomSheet>
            {/* Brauerei Detail Drill-down */}
            <BottomSheet
                isOpen={!!breweryDetail}
                onClose={() => setBreweryDetail(null)}
                onBack={() => setBreweryDetail(null)}
                showBack={true}
                title={breweryDetail?.name || ''}
            >
                {breweryDetail && (() => {
                    // Biere für diese Brauerei filtern
                    const bBeers = allBeers.filter(b => b.brewery?.id === breweryDetail.id);

                    return (
                        <div className={styles.poiDetail}>
                            <div className={styles.detailHeaderRow}>
                                <div className={styles.detailHeaderIconWrapper}>
                                    {breweryDetail.imgUrl ? (
                                        <img src={breweryDetail.imgUrl} alt={breweryDetail.name} className={styles.detailHeaderImg} />
                                    ) : (
                                        <div className={styles.detailHeaderFallback}>{breweryDetail.name?.substring(0, 2).toUpperCase()}</div>
                                    )}
                                </div>

                                <div className={styles.detailHeaderInfo}>
                                    <span className={styles.detailTypeBadge}>Brauerei</span>
                                    {breweryDetail.city && <span className={styles.detailMetaText}>📍 {breweryDetail.city.name || breweryDetail.city}</span>}
                                    {breweryDetail.district && <span className={styles.detailMetaText}>🗺️ {breweryDetail.district.name || breweryDetail.district}</span>}
                                </div>

                                <div className={styles.detailHeaderActions}>
                                    {breweryDetail.website && (
                                        <div className={styles.actionWrapper}>
                                            <a href={breweryDetail.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
                                                <FaGlobe /> Zur Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {breweryDetail.description && <p className={styles.poiDesc}>{breweryDetail.description}</p>}

                            <div className={styles.tavernBeers}>
                                <h4><FaBeer /> Biere dieser Brauerei ({bBeers.length})</h4>
                                {bBeers.map(fullBeer => (
                                    <BeerCard
                                        key={fullBeer.id}
                                        beer={{
                                            beerId: fullBeer.id, name: fullBeer.name,
                                            breweryName: fullBeer.brewery?.name, breweryId: fullBeer.brewery?.id,
                                            typeName: fullBeer.beerType?.name,
                                            alcoholPercentage: fullBeer.alcoholPercentage,
                                            isNonAlcoholic: fullBeer.isNonAlcoholic,
                                            description: fullBeer.description,
                                            originalGravity: fullBeer.originalGravity,
                                        }}
                                        trackingState={getBeerState(fullBeer.id)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        taverns={beerTavernMap[fullBeer.id] || []}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        compact={false}
                                    />
                                ))}
                                {bBeers.length === 0 && <p className={styles.poiMeta}>Derzeit keine Biere gelistet.</p>}
                            </div>
                        </div>
                    );
                })()}
            </BottomSheet>
        </div>
    );
};

export default HomePage;