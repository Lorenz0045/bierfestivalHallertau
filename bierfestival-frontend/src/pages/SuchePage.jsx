import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import useTracking from '../hooks/useTracking';
import BeerCard from '../components/UI/BeerCard';
import BottomSheet from '../components/UI/BottomSheet';
import EventItem from '../components/UI/EventItem';
import { FaBeer, FaMapMarkerAlt, FaSearch, FaGlobe, FaLocationArrow, FaMapMarkedAlt, FaCalendarAlt } from 'react-icons/fa';
import styles from './SuchePage.module.css';


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
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);

    // Filters - Bier
    const [searchText, setSearchText] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [alcFilter, setAlcFilter] = useState('alle'); // 'alle' | 'ja' | 'nein'
    const [hallertauOnly, setHallertauOnly] = useState(false);
    const [selectedBrewery, setSelectedBrewery] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');

    // Filters - Orte
    const [ortCategory, setOrtCategory] = useState('alle');

    // Detail overlays
    const [selectedOrt, setSelectedOrt] = useState(null);
    const [breweryDetail, setBreweryDetail] = useState(null);
    const [overlayStack, setOverlayStack] = useState([]); // for back navigation

    const { getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();
    const navigate = useNavigate();

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [beersData, breweriesData, typesData, tavernsData, stagesData, gastroData, sponsorsData, craftData, facilData] = await Promise.all([
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
                setBeers(beersData || []);
                setBreweries(breweriesData || []);
                setBeerTypes(typesData || []);
                setTaverns(tavernsData || []);
                setStages(stagesData || []);
                setGastronomies(gastroData || []);
                setSponsors(sponsorsData || []);
                setCraftMarkets(craftData || []);
                setFacilities(facilData || []);
                setEvents(eventsData || []);
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

    // Filtered orte
    const filteredOrte = useMemo(() => {
        const all = [];
        if (ortCategory === 'alle' || ortCategory === 'schenke') taverns.forEach(t => all.push({ ...t, ortType: 'Schenke', ortIcon: '🍺' }));
        if (ortCategory === 'alle' || ortCategory === 'buehne') stages.forEach(s => all.push({ ...s, ortType: 'Bühne', ortIcon: '🎵' }));
        if (ortCategory === 'alle' || ortCategory === 'gastro') gastronomies.forEach(g => all.push({ ...g, ortType: 'Gastronomie', ortIcon: '🍴' }));
        if (ortCategory === 'alle' || ortCategory === 'sponsor') sponsors.forEach(s => all.push({ ...s, ortType: 'Sponsor', ortIcon: '⭐' }));
        if (ortCategory === 'alle' || ortCategory === 'handwerker') craftMarkets.forEach(c => all.push({ ...c, ortType: 'Handwerkerstand', ortIcon: '🔨' }));
        if (ortCategory === 'alle' || ortCategory === 'brauerei') breweries.forEach(b => all.push({ ...b, ortType: 'Brauerei', ortIcon: '🏭' }));
        return all.sort((a, b) => a.name.localeCompare(b.name));
    }, [ortCategory, taverns, stages, gastronomies, sponsors, craftMarkets, breweries]);

    const handleBreweryClick = (breweryId) => {
        const brewery = breweries.find(b => b.id === breweryId);
        if (brewery) {
            setOverlayStack(prev => [...prev, { type: 'ort', data: selectedOrt }]);
            setBreweryDetail(brewery);
        }
    };

    const handleBackFromBrewery = () => {
        setBreweryDetail(null);
        const prev = overlayStack.pop();
        setOverlayStack([...overlayStack]);
    };

    const handleJumpToMap = (item) => {
        if (item?.lat && item?.lon) {
            navigate('/', { state: { jumpToPoi: { lat: item.lat, lon: item.lon } } });
        }
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

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Daten werden geladen...</div></div>;
    }

    return (
        <div className={styles.page}>
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
                                { key: 'alle', label: 'Alle', icon: '📍' },
                                { key: 'schenke', label: 'Schenken', icon: '🍺' },
                                { key: 'buehne', label: 'Bühnen', icon: '🎵' },
                                { key: 'gastro', label: 'Gastronomie', icon: '🍴' },
                                { key: 'brauerei', label: 'Brauereien', icon: '🏭' },
                                { key: 'sponsor', label: 'Sponsoren', icon: '⭐' },
                                { key: 'handwerker', label: 'Handwerker', icon: '🔨' },
                            ].map(cat => (
                                <button
                                    key={cat.key}
                                    className={`${styles.catBtn} ${ortCategory === cat.key ? styles.catActive : ''}`}
                                    onClick={() => setOrtCategory(cat.key)}
                                >
                                    <span>{cat.icon}</span> {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.resultCount}>{filteredOrte.length} Orte gefunden</div>

                    <div className={styles.ortGrid}>
                        {filteredOrte.map((ort, idx) => (
                            <div key={`${ort.ortType}-${ort.id}-${idx}`} className={styles.ortCard} onClick={() => setSelectedOrt(ort)}>
                                <div className={styles.ortIcon}>{ort.ortIcon}</div>
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
                        ))}
                    </div>
                </>
            )}

            {/* ========== ORT DETAIL OVERLAY ========== */}
            <BottomSheet
                isOpen={!!selectedOrt && !breweryDetail}
                onClose={() => { setSelectedOrt(null); setOverlayStack([]); }}
                title={selectedOrt?.name || ''}
            >
                {selectedOrt && (
                    <div className={styles.ortDetail}>
                        {selectedOrt.imgUrl && <img src={selectedOrt.imgUrl} alt={selectedOrt.name} className={styles.ortDetailImg} />}
                        <span className={styles.ortDetailType}>{selectedOrt.ortType}</span>
                        {selectedOrt.description && <p className={styles.ortDetailDesc}>{selectedOrt.description}</p>}
                        {selectedOrt.website && (
                            <a href={selectedOrt.website} target="_blank" rel="noopener noreferrer" className={styles.ortWebsite}>
                                <FaGlobe /> Website
                            </a>
                        )}
                        {(selectedOrt.lat && selectedOrt.lon) && (
                            <button className={styles.ortMapLink} onClick={() => handleJumpToMap(selectedOrt)}>
                                <FaLocationArrow /> Auf dem Lageplan anzeigen
                            </button>
                        )}
                        {/* Biere bei Schenken */}
                        {selectedOrt.ortType === 'Schenke' && selectedOrt.beers?.length > 0 && (
                            <div className={styles.ortBeers}>
                                <h4>Ausgeschenkte Biere</h4>
                                {selectedOrt.beers.map(b => {
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
                                            compact={false}
                                        />
                                    )
                                })}
                            </div>
                        )}

                        {selectedOrt.ortType === 'Bühne' && (
                            <div className={styles.ortEvents}>
                                <h4 style={{ marginTop: '15px', color: 'var(--bf-dark-green)' }}><FaCalendarAlt /> Programm auf dieser Bühne</h4>
                                {events.filter(e => e.stage?.id === selectedOrt.id)
                                    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                    .map(ev => (
                                        <EventItem key={ev.id} event={ev} />
                                    ))}
                                {events.filter(e => e.stage?.id === selectedOrt.id).length === 0 && (
                                    <p>Derzeit kein Programm gelistet.</p>
                                )}
                            </div>
                        )}

                        {selectedOrt.ortType === 'Brauerei' && (
                            <div className={styles.ortBeers}>
                                <h4 style={{ marginTop: '15px', color: 'var(--bf-dark-green)' }}><FaBeer /> Biere dieser Brauerei auf dem Festival</h4>
                                {beers.filter(b => b.brewery?.id === selectedOrt.id).map(fullBeer => (
                                    <BeerCard
                                        key={fullBeer.id}
                                        beer={mapBeerForCard(fullBeer)}
                                        trackingState={getBeerState(fullBeer.id)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        compact={false}
                                    />
                                ))}
                                {beers.filter(b => b.brewery?.id === selectedOrt.id).length === 0 && (
                                    <p>Derzeit keine Biere gelistet.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </BottomSheet>

            {/* ========== BRAUEREI DETAIL OVERLAY (Drilldown) ========== */}
            <BottomSheet
                isOpen={!!breweryDetail}
                onClose={() => { setBreweryDetail(null); setOverlayStack([]); }}
                onBack={handleBackFromBrewery}
                showBack={true}
                title={breweryDetail?.name || ''}
            >
                {breweryDetail && (
                    <div className={styles.ortDetail}>
                        {breweryDetail.imgUrl && <img src={breweryDetail.imgUrl} alt={breweryDetail.name} className={styles.ortDetailImg} />}
                        <span className={styles.ortDetailType}>Brauerei</span>
                        {breweryDetail.description && <p className={styles.ortDetailDesc}>{breweryDetail.description}</p>}
                        {breweryDetail.city && <p className={styles.ortDetailMeta}>📍 {breweryDetail.city.name}</p>}
                        {breweryDetail.district && <p className={styles.ortDetailMeta}>🗺️ Landkreis {breweryDetail.district.name}</p>}
                        {breweryDetail.website && (
                            <a href={breweryDetail.website} target="_blank" rel="noopener noreferrer" className={styles.ortWebsite}>
                                <FaGlobe /> Website besuchen
                            </a>
                        )}
                        {selectedOrt.ortType === 'Brauerei' && (
                            <div className={styles.ortBeers}>
                                <h4 style={{ marginTop: '15px', color: 'var(--bf-dark-green)' }}><FaBeer /> Biere dieser Brauerei auf dem Festival</h4>
                                {beers.filter(b => b.brewery?.id === selectedOrt.id).map(fullBeer => (
                                    <BeerCard
                                        key={fullBeer.id}
                                        beer={mapBeerForCard(fullBeer)}
                                        trackingState={getBeerState(fullBeer.id)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        compact={false}
                                    />
                                ))}
                                {beers.filter(b => b.brewery?.id === selectedOrt.id).length === 0 && (
                                    <p>Derzeit keine Biere gelistet.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};

export default SuchePage;
