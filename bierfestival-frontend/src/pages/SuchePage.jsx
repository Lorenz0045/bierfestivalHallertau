import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import useTracking from '../hooks/useTracking';
import BeerCard from '../components/UI/BeerCard';
import BottomSheet from '../components/UI/BottomSheet';
import { FaBeer, FaMapMarkerAlt, FaSearch, FaGlobe, FaLocationArrow, FaMapMarkedAlt, FaCalendarAlt } from 'react-icons/fa';
import styles from './SuchePage.module.css';

// Icons von public/icons/ – Pfade relativ zu public root
const CATEGORY_ICONS = {
    alle: '/icons/Bierfestival-Logo.png',
    schenke: null,           // Schenken haben eigene hochgeladene Icons
    buehne: '/icons/Bühne_ms.webp',
    gastro: '/icons/Gastro_os.webp',
    brauerei: null,          // Brauereien haben Logos
    sponsor: null,           // Sponsoren haben Logos
    marktstand: '/icons/Marktstand.ms.webp',
};

// Event-Helper: Tagesname aus ISO-String (ohne Timezone-Shift)
const getEventDay = (isoStr) => {
    if (!isoStr) return 'Sonstige';
    return isoStr.substring(0, 10); // z.B. "2026-06-12"
};
const formatTime = (isoString) => {
    if (!isoString) return '';
    return isoString.substring(11, 16) + ' Uhr';
};

const SuchePage = () => {
    const [mode, setMode] = useState('bier'); // 'bier' | 'orte'

    // Data
    const [beers, setBeers] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [beerTypes, setBeerTypes] = useState([]);
    const [taverns, setTaverns] = useState([]);
    const [stages, setStages] = useState([]);
    const [gastronomies, setGastronomies] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [craftMarkets, setCraftMarkets] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters - Bier
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [alcFilter, setAlcFilter] = useState('alle');
    const [hallertauOnly, setHallertauOnly] = useState(false);
    const [selectedBrewery, setSelectedBrewery] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Filters - Orte
    const [ortCategory, setOrtCategory] = useState('alle');

    // Overlay stack for navigation
    const [overlayStack, setOverlayStack] = useState([]); // [{type, data, title}]

    const { getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();
    const navigate = useNavigate();

    useEffect(() => {
        const loadAll = async () => {
            try {
                const results = await Promise.all([
                    fetchCachedData('/api/beers'),
                    fetchCachedData('/api/breweries'),
                    fetchCachedData('/api/beer-types'),
                    fetchCachedData('/api/taverns'),
                    fetchCachedData('/api/stages'),
                    fetchCachedData('/api/gastronomies'),
                    fetchCachedData('/api/sponsors'),
                    fetchCachedData('/api/craft-markets'),
                    fetchCachedData('/api/facilities'),
                    fetchCachedData('/api/events'),
                ]);
                setBeers(results[0] || []);
                setBreweries(results[1] || []);
                setBeerTypes(results[2] || []);
                setTaverns(results[3] || []);
                setStages(results[4] || []);
                setGastronomies(results[5] || []);
                setSponsors(results[6] || []);
                setCraftMarkets(results[7] || []);
                setFacilities(results[8] || []);
                setEvents(results[9] || []);
            } catch (err) {
                console.error('Suche: Fehler beim Laden', err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    // Derived: unique cities, districts from breweries
    const cities = useMemo(() => {
        const set = new Set();
        breweries.forEach(b => { if (b.city?.name) set.add(b.city.name); });
        return Array.from(set).sort();
    }, [breweries]);

    const districts = useMemo(() => {
        const set = new Set();
        breweries.forEach(b => { if (b.district?.name) set.add(b.district.name); });
        return Array.from(set).sort();
    }, [breweries]);

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

    // Filtered beers
    const filteredBeers = useMemo(() => {
        return beers.filter(beer => {
            if (searchText && !beer.name.toLowerCase().includes(searchText.toLowerCase()) &&
                !(beer.brewery?.name || '').toLowerCase().includes(searchText.toLowerCase())) return false;
            if (selectedType && beer.beerType?.id?.toString() !== selectedType) return false;
            if (alcFilter === 'nein' && !beer.isNonAlcoholic) return false;
            if (alcFilter === 'ja' && beer.isNonAlcoholic) return false;
            if (selectedBrewery && beer.brewery?.id?.toString() !== selectedBrewery) return false;
            if (selectedCity && beer.brewery?.city?.name !== selectedCity) return false;
            if (selectedDistrict && beer.brewery?.district?.name !== selectedDistrict) return false;
            if (hallertauOnly && !(beer.brewery?.district?.name || '').toLowerCase().includes('hallertau') &&
                !(beer.brewery?.district?.name || '').toLowerCase().includes('freising') &&
                !(beer.brewery?.district?.name || '').toLowerCase().includes('pfaffenhofen') &&
                !(beer.brewery?.district?.name || '').toLowerCase().includes('kelheim')) return false;
            return true;
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [beers, searchText, selectedType, alcFilter, hallertauOnly, selectedBrewery, selectedCity, selectedDistrict]);

    // Filtered orte (Handwerker → Marktstand)
    const filteredOrte = useMemo(() => {
        const all = [];
        if (ortCategory === 'alle' || ortCategory === 'schenke') taverns.forEach(t => all.push({ ...t, ortType: 'Schenke' }));
        if (ortCategory === 'alle' || ortCategory === 'buehne') stages.forEach(s => all.push({ ...s, ortType: 'Bühne' }));
        if (ortCategory === 'alle' || ortCategory === 'gastro') gastronomies.forEach(g => all.push({ ...g, ortType: 'Gastronomie' }));
        if (ortCategory === 'alle' || ortCategory === 'sponsor') sponsors.forEach(s => all.push({ ...s, ortType: 'Sponsor' }));
        if (ortCategory === 'alle' || ortCategory === 'marktstand') craftMarkets.forEach(c => all.push({ ...c, ortType: 'Marktstand' }));
        if (ortCategory === 'alle' || ortCategory === 'brauerei') breweries.forEach(b => all.push({ ...b, ortType: 'Brauerei' }));
        return all.sort((a, b) => a.name.localeCompare(b.name));
    }, [ortCategory, taverns, stages, gastronomies, sponsors, craftMarkets, breweries]);

    // Overlay helpers
    const currentOverlay = overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : null;

    const pushOverlay = (type, data, title) => {
        setOverlayStack(prev => [...prev, { type, data, title: title || data?.name || '' }]);
    };

    const popOverlay = () => {
        setOverlayStack(prev => prev.slice(0, -1));
    };

    const closeAllOverlays = () => {
        setOverlayStack([]);
    };

    // Navigation handlers
    const handleBreweryClick = (breweryId) => {
        const brewery = breweries.find(b => b.id === breweryId);
        if (brewery) pushOverlay('brauerei', brewery);
    };

    const handleTavernClick = (tavern) => {
        const fullTavern = taverns.find(t => t.id === tavern.id) || tavern;
        pushOverlay('schenke', fullTavern);
    };

    const handleJumpToMap = (item) => {
        if (item?.lat && item?.lon) {
            navigate('/', { state: { jumpToPoi: { lat: item.lat, lon: item.lon } } });
        }
    };

    const handleOrtClick = (ort) => {
        pushOverlay('ort', ort);
    };

    const mapBeerForCard = (beer) => ({
        beerId: beer.id,
        name: beer.name,
        breweryName: beer.brewery?.name,
        breweryId: beer.brewery?.id,
        typeName: beer.beerType?.name,
        alcoholPercentage: beer.alcoholPercentage,
        isNonAlcoholic: beer.isNonAlcoholic,
        description: beer.description,
        originalGravity: beer.originalGravity,
    });

    // Get icon for ort type
    const getOrtIcon = (ort) => {
        if (ort.imgUrl) return ort.imgUrl;
        if (ort.ortType === 'Bühne') return '/icons/Bühne_ms.webp';
        if (ort.ortType === 'Gastronomie') return '/icons/Gastro_os.webp';
        if (ort.ortType === 'Marktstand') return '/icons/Marktstand.ms.webp';
        return null;
    };

    // Group events by day for a stage
    const getStageEventsByDay = (stageId) => {
        const stageEvents = events.filter(e => e.stage?.id === stageId);
        const groups = {};
        stageEvents.forEach(ev => {
            const day = ev.dayName || getEventDay(ev.startTime);
            if (!groups[day]) groups[day] = [];
            groups[day].push(ev);
        });
        Object.values(groups).forEach(arr => arr.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')));
        return { groups, days: Object.keys(groups).sort((a, b) => {
            const tA = groups[a][0]?.startTime ? new Date(groups[a][0].startTime).getTime() : 0;
            const tB = groups[b][0]?.startTime ? new Date(groups[b][0].startTime).getTime() : 0;
            return tA - tB;
        })};
    };

    // Get brewery beers for a brewery
    const getBreweryBeers = (breweryId) => beers.filter(b => b.brewery?.id === breweryId);

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Daten werden geladen...</div></div>;
    }

    // Render overlay content based on type
    const renderOverlayContent = () => {
        if (!currentOverlay) return null;
        const { type, data } = currentOverlay;

        if (type === 'ort' || type === 'schenke') {
            const ort = data;
            const ortIcon = getOrtIcon(ort);
            return (
                <div className={styles.ortDetail}>
                    {ortIcon && <img src={ortIcon} alt={ort.name} className={styles.ortDetailIcon} />}
                    <span className={styles.ortDetailType}>{ort.ortType}</span>
                    {ort.description && <p className={styles.ortDetailDesc}>{ort.description}</p>}
                    {ort.website && (
                        <a href={ort.website} target="_blank" rel="noopener noreferrer" className={styles.ortWebsite}>
                            <FaGlobe /> Website
                        </a>
                    )}
                    {(ort.lat && ort.lon) && (
                        <button className={styles.ortMapLink} onClick={() => handleJumpToMap(ort)}>
                            <FaLocationArrow /> Auf dem Lageplan anzeigen
                        </button>
                    )}
                    {ort.city && <p className={styles.ortDetailMeta}>📍 {ort.city.name || ort.city}</p>}

                    {/* Schenke: Biere */}
                    {(ort.ortType === 'Schenke' || type === 'schenke') && ort.beers?.length > 0 && (
                        <div className={styles.ortBeers}>
                            <h4><FaBeer /> Ausgeschenkte Biere ({ort.beers.length})</h4>
                            {ort.beers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(b => {
                                const fullBeer = beers.find(ab => ab.id === b.beerId);
                                return (
                                    <BeerCard
                                        key={b.beerId}
                                        beer={fullBeer ? mapBeerForCard(fullBeer) : { beerId: b.beerId, name: b.name, breweryName: b.breweryName, typeName: b.typeName, alcoholPercentage: b.alcoholPercentage, isNonAlcoholic: b.isNonAlcoholic }}
                                        trackingState={getBeerState(b.beerId)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        onBreweryClick={handleBreweryClick}
                                        compact
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Bühne: Programm mit Tagesaufteilung */}
                    {ort.ortType === 'Bühne' && (() => {
                        const { groups, days } = getStageEventsByDay(ort.id);
                        if (days.length === 0) return <p className={styles.emptyNote}>Derzeit kein Programm gelistet.</p>;
                        return (
                            <StageEventsByDay groups={groups} days={days} />
                        );
                    })()}

                    {/* Gastronomie: Typ */}
                    {ort.ortType === 'Gastronomie' && ort.type && (
                        <p className={styles.ortDetailMeta}>🍴 {ort.type.name}</p>
                    )}

                    {/* Brauerei-Biere (wenn Ort eine Brauerei ist) */}
                    {ort.ortType === 'Brauerei' && (() => {
                        const bBeers = getBreweryBeers(ort.id);
                        return (
                            <div className={styles.ortBeers}>
                                <h4><FaBeer /> Biere dieser Brauerei ({bBeers.length})</h4>
                                {bBeers.map(fullBeer => (
                                    <BeerCard
                                        key={fullBeer.id}
                                        beer={mapBeerForCard(fullBeer)}
                                        trackingState={getBeerState(fullBeer.id)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        taverns={beerTavernMap[fullBeer.id] || []}
                                        onTavernClick={handleTavernClick}
                                        onJumpToMap={handleJumpToMap}
                                        compact
                                    />
                                ))}
                                {bBeers.length === 0 && <p className={styles.emptyNote}>Derzeit keine Biere gelistet.</p>}
                            </div>
                        );
                    })()}
                </div>
            );
        }

        if (type === 'brauerei') {
            const brewery = data;
            const bBeers = getBreweryBeers(brewery.id);
            return (
                <div className={styles.ortDetail}>
                    {brewery.imgUrl && <img src={brewery.imgUrl} alt={brewery.name} className={styles.ortDetailIcon} />}
                    <span className={styles.ortDetailType}>Brauerei</span>
                    {brewery.description && <p className={styles.ortDetailDesc}>{brewery.description}</p>}
                    {brewery.city && <p className={styles.ortDetailMeta}>📍 {brewery.city.name || brewery.city}</p>}
                    {brewery.district && <p className={styles.ortDetailMeta}>🗺️ Landkreis {brewery.district.name || brewery.district}</p>}
                    {brewery.website && (
                        <a href={brewery.website} target="_blank" rel="noopener noreferrer" className={styles.ortWebsite}>
                            <FaGlobe /> Website besuchen
                        </a>
                    )}
                    <div className={styles.ortBeers}>
                        <h4><FaBeer /> Biere dieser Brauerei ({bBeers.length})</h4>
                        {bBeers.map(fullBeer => (
                            <BeerCard
                                key={fullBeer.id}
                                beer={mapBeerForCard(fullBeer)}
                                trackingState={getBeerState(fullBeer.id)}
                                onToggleMerkliste={toggleMerkliste}
                                onLogDrink={logDrink}
                                onRemoveDrink={removeDrink}
                                onRate={rateBeer}
                                taverns={beerTavernMap[fullBeer.id] || []}
                                onTavernClick={handleTavernClick}
                                onJumpToMap={handleJumpToMap}
                                compact
                            />
                        ))}
                        {bBeers.length === 0 && <p className={styles.emptyNote}>Derzeit keine Biere gelistet.</p>}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className={styles.page}>
            {/* Header (same style as Anreise) */}
            <div className={styles.header}>
                <FaSearch className={styles.headerIcon} />
                <h1 className={styles.title}>Suche</h1>
                <p className={styles.subtitle}>Biere, Brauereien & Orte entdecken</p>
            </div>

            {/* Mode Toggle */}
            <div className={styles.modeToggle}>
                <button className={`${styles.toggleBtn} ${mode === 'bier' ? styles.toggleActive : ''}`} onClick={() => setMode('bier')}>
                    <FaBeer /> Biere
                </button>
                <button className={`${styles.toggleBtn} ${mode === 'orte' ? styles.toggleActive : ''}`} onClick={() => setMode('orte')}>
                    <FaMapMarkerAlt /> Orte
                </button>
            </div>

            {/* ========== BIER SUCHE ========== */}
            {mode === 'bier' && (
                <>
                    <div className={styles.filterSection}>
                        <div className={styles.searchBox}>
                            <FaSearch className={styles.searchIcon} />
                            <input type="text" placeholder="Bier oder Brauerei suchen…" value={searchText} onChange={e => setSearchText(e.target.value)} className={styles.searchInput} />
                        </div>
                        <div className={styles.filterRow}>
                            <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className={styles.filterSelect}>
                                <option value="">Alle Biertypen</option>
                                {beerTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <select value={alcFilter} onChange={e => setAlcFilter(e.target.value)} className={styles.filterSelect}>
                                <option value="alle">Alkohol: Alle</option>
                                <option value="ja">Mit Alkohol</option>
                                <option value="nein">Alkoholfrei</option>
                            </select>
                        </div>
                        <div className={styles.filterRow}>
                            <select value={selectedBrewery} onChange={e => setSelectedBrewery(e.target.value)} className={styles.filterSelect}>
                                <option value="">Alle Brauereien</option>
                                {breweries.sort((a, b) => a.name.localeCompare(b.name)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                            <label className={styles.checkLabel}>
                                <input type="checkbox" checked={hallertauOnly} onChange={e => setHallertauOnly(e.target.checked)} />
                                Hallertau
                            </label>
                        </div>
                        <div className={styles.filterRow}>
                            <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} className={styles.filterSelect}>
                                <option value="">Alle Orte</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)} className={styles.filterSelect}>
                                <option value="">Alle Landkreise</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.resultCount}>{filteredBeers.length} Biere gefunden</div>

                    <div className={styles.beerGrid}>
                        {filteredBeers.map(beer => (
                            <BeerCard
                                key={beer.id}
                                beer={mapBeerForCard(beer)}
                                trackingState={getBeerState(beer.id)}
                                onToggleMerkliste={toggleMerkliste}
                                onLogDrink={logDrink}
                                onRemoveDrink={removeDrink}
                                onRate={rateBeer}
                                onBreweryClick={handleBreweryClick}
                                taverns={beerTavernMap[beer.id] || []}
                                onTavernClick={handleTavernClick}
                                onJumpToMap={handleJumpToMap}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* ========== ORTE SUCHE ========== */}
            {mode === 'orte' && (
                <>
                    <div className={styles.filterSection}>
                        <div className={styles.categoryFilters}>
                            {[
                                { key: 'alle', label: 'Alle' },
                                { key: 'schenke', label: 'Schenken' },
                                { key: 'buehne', label: 'Bühnen' },
                                { key: 'gastro', label: 'Gastronomie' },
                                { key: 'brauerei', label: 'Brauereien' },
                                { key: 'sponsor', label: 'Sponsoren' },
                                { key: 'marktstand', label: 'Marktstände' },
                            ].map(cat => (
                                <button
                                    key={cat.key}
                                    className={`${styles.catBtn} ${ortCategory === cat.key ? styles.catActive : ''}`}
                                    onClick={() => setOrtCategory(cat.key)}
                                >
                                    {CATEGORY_ICONS[cat.key] && (
                                        <img src={CATEGORY_ICONS[cat.key]} alt="" className={styles.catIcon} />
                                    )}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.resultCount}>{filteredOrte.length} Orte gefunden</div>

                    <div className={styles.ortGrid}>
                        {filteredOrte.map((ort, idx) => {
                            const icon = getOrtIcon(ort);
                            return (
                                <div key={`${ort.ortType}-${ort.id}-${idx}`} className={styles.ortCard} onClick={() => handleOrtClick(ort)}>
                                    {icon ? (
                                        <img src={icon} alt={ort.name} className={styles.ortIconImg} />
                                    ) : (
                                        <div className={styles.ortIconFallback}>{ort.name?.substring(0, 2).toUpperCase()}</div>
                                    )}
                                    <div className={styles.ortInfo}>
                                        <h4 className={styles.ortName}>{ort.name}</h4>
                                        <span className={styles.ortType}>{ort.ortType}</span>
                                        {ort.city && <span className={styles.ortCity}>{ort.city.name || ort.city}</span>}
                                    </div>
                                    {(ort.lat && ort.lon) && (
                                        <button className={styles.ortMapBtn} onClick={e => { e.stopPropagation(); handleJumpToMap(ort); }} title="Auf Karte zeigen">
                                            <FaMapMarkedAlt />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Central Overlay BottomSheet – navigierbar mit Zurück-Pfeil */}
            <BottomSheet
                isOpen={overlayStack.length > 0}
                onClose={closeAllOverlays}
                onBack={overlayStack.length > 1 ? popOverlay : undefined}
                showBack={overlayStack.length > 1}
                title={currentOverlay?.title || ''}
            >
                {renderOverlayContent()}
            </BottomSheet>
        </div>
    );
};

// Sub-component: Stage events grouped by day
const StageEventsByDay = ({ groups, days }) => {
    const [selectedDay, setSelectedDay] = useState(days[0] || '');

    return (
        <div className={styles.stageProgram}>
            <h4><FaCalendarAlt /> Programm</h4>
            <div className={styles.dayTabs}>
                {days.map(day => (
                    <button
                        key={day}
                        className={`${styles.dayTab} ${selectedDay === day ? styles.dayActive : ''}`}
                        onClick={() => setSelectedDay(day)}
                    >
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

export default SuchePage;
