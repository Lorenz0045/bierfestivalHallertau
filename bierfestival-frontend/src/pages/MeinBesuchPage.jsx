import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import useTracking from '../hooks/useTracking';
import BeerCard from '../components/UI/BeerCard';
import BottomSheet from '../components/UI/BottomSheet';
import SponsorBanner from '../components/UI/SponsorBanner';
import { FaBookmark, FaBeer, FaStar, FaChevronDown, FaChevronUp, FaGlobe } from 'react-icons/fa';
import styles from './MeinBesuchPage.module.css';

// Nachtfahrt-Regel: 00:00–04:00 → Vortag
const NIGHT_CUTOFF = 4;

const getDay = (ts) => {
    const d = new Date(ts);
    if (d.getHours() < NIGHT_CUTOFF) d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
};

const MeinBesuchPage = () => {
    const [beers, setBeers] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const { trackingData, getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();

    // Filters
    const [dayFilter, setDayFilter] = useState('alle');
    const [showDrunkInMerkliste, setShowDrunkInMerkliste] = useState(true);
    const [showRatedInMerkliste, setShowRatedInMerkliste] = useState(true);

    // Show more states
    const [showAllMerkliste, setShowAllMerkliste] = useState(false);
    const [showAllBest, setShowAllBest] = useState(false);
    const [showAllDrunk, setShowAllDrunk] = useState(false);

    // Brewery drill-down
    const [breweryDetail, setBreweryDetail] = useState(null);

    const INITIAL_COUNT = 5;

    const [taverns, setTaverns] = useState([]); 
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const [beersData, brewData, tavernData] = await Promise.all([
                    fetchCachedData('/api/beers'),
                    fetchCachedData('/api/breweries'),
                    fetchCachedData('/api/taverns'),
                ]);
                setBeers(beersData || []);
                setBreweries(brewData || []);
                setTaverns(tavernData || []);
            } catch (err) {
                console.error('MeinBesuch: Fehler', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Beer lookup
    const beerMap = useMemo(() => {
        const map = {};
        beers.forEach(b => { map[b.id] = b; });
        return map;
    }, [beers]);

    // Lookup für BeerCards: Wo wird welches Bier ausgeschenkt?
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

    const handleJumpToMap = (item) => {
        if (item?.lat && item?.lon) {
            navigate('/', { state: { jumpToPoi: { lat: item.lat, lon: item.lon } } });
        }
    };

    // Available days from tracking data
    const availableDays = useMemo(() => {
        const days = new Set();
        Object.values(trackingData).forEach(state => {
            (state.drinkTimestamps || []).forEach(ts => days.add(getDay(ts)));
        });
        return ['alle', ...Array.from(days).sort()];
    }, [trackingData]);

    // Filter drink timestamps by day
    const getDrinkCountForDay = (timestamps) => {
        if (dayFilter === 'alle') return timestamps.length;
        return timestamps.filter(ts => getDay(ts) === dayFilter).length;
    };

    // Gemerkte Biere
    const merklisteBiere = useMemo(() => {
        return Object.entries(trackingData)
            .filter(([_, state]) => {
                if (!state.isOnMerkliste) return false;
                const hasDrunk = (state.drinkTimestamps || []).length > 0;
                const hasRated = !!state.rating;
                if (!showDrunkInMerkliste && hasDrunk) return false;
                if (!showRatedInMerkliste && hasRated) return false;
                return true;
            })
            .map(([beerId, state]) => ({ beerId: Number(beerId), state, beer: beerMap[Number(beerId)] }))
            .filter(item => item.beer)
            .sort((a, b) => a.beer.name.localeCompare(b.beer.name));
    }, [trackingData, beerMap, showDrunkInMerkliste, showRatedInMerkliste]);

    // Bestbewertete
    const bestRated = useMemo(() => {
        return Object.entries(trackingData)
            .filter(([_, state]) => state.rating > 0)
            .map(([beerId, state]) => ({ beerId: Number(beerId), state, beer: beerMap[Number(beerId)] }))
            .filter(item => item.beer)
            .sort((a, b) => b.state.rating - a.state.rating || a.beer.name.localeCompare(b.beer.name));
    }, [trackingData, beerMap]);

    // Meistgetrunken
    const mostDrunk = useMemo(() => {
        return Object.entries(trackingData)
            .filter(([_, state]) => (state.drinkTimestamps || []).length > 0)
            .map(([beerId, state]) => ({
                beerId: Number(beerId),
                state,
                beer: beerMap[Number(beerId)],
                count: getDrinkCountForDay(state.drinkTimestamps || [])
            }))
            .filter(item => item.beer && item.count > 0)
            .sort((a, b) => b.count - a.count || a.beer.name.localeCompare(b.beer.name));
    }, [trackingData, beerMap, dayFilter]);

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

    const handleBreweryClick = (breweryId) => {
        const brewery = breweries.find(b => b.id === breweryId);
        if (brewery) setBreweryDetail(brewery);
    };

    const renderSection = (title, icon, items, showAll, setShowAll, drinkCountKey = false) => {
        const displayItems = showAll ? items : items.slice(0, INITIAL_COUNT);
        return (
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>{icon} {title} <span className={styles.count}>({items.length})</span></h2>
                {items.length === 0 ? (
                    <p className={styles.empty}>Noch keine Einträge.</p>
                ) : (
                    <>
                        <div className={styles.beerList}>
                            {displayItems.map(item => (
                                <BeerCard
                                    key={item.beerId}
                                    beer={mapBeerForCard(item.beer)}
                                    trackingState={item.state}
                                    onToggleMerkliste={toggleMerkliste}
                                    onLogDrink={logDrink}
                                    onRemoveDrink={removeDrink}
                                    onRate={rateBeer}
                                    onBreweryClick={handleBreweryClick}
                                    drinkCount={drinkCountKey ? item.count : undefined}
                                    compact
                                />
                            ))}
                        </div>
                        {items.length > INITIAL_COUNT && (
                            <button className={styles.toggleMore} onClick={() => setShowAll(!showAll)}>
                                {showAll ? <><FaChevronUp /> Weniger anzeigen</> : <><FaChevronDown /> Alle {items.length} anzeigen</>}
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Daten werden geladen...</div></div>;
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mein Besuch</h1>
                <p className={styles.subtitle}>Deine persönliche Festival-Übersicht</p>
            </div>

            {/* Datums-Filter */}
            <div className={styles.dayFilter}>
                {availableDays.map(day => (
                    <button
                        key={day}
                        className={`${styles.dayBtn} ${dayFilter === day ? styles.dayActive : ''}`}
                        onClick={() => setDayFilter(day)}
                    >
                        {day === 'alle' ? 'Alle Tage' : day}
                    </button>
                ))}
            </div>

            {/* Gemerkte Biere */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}><FaBookmark className={styles.sectionIcon} /> Gemerkte Biere <span className={styles.count}>({merklisteBiere.length})</span></h2>
                <div className={styles.filterToggles}>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={showDrunkInMerkliste} onChange={e => setShowDrunkInMerkliste(e.target.checked)} />
                        Auch getrunkene zeigen
                    </label>
                    <label className={styles.toggleLabel}>
                        <input type="checkbox" checked={showRatedInMerkliste} onChange={e => setShowRatedInMerkliste(e.target.checked)} />
                        Auch bewertete zeigen
                    </label>
                </div>
                {merklisteBiere.length === 0 ? (
                    <p className={styles.empty}>Keine gemerkten Biere. Entdecke Biere im Suche-Tab!</p>
                ) : (
                    <>
                        <div className={styles.beerList}>
                            {(showAllMerkliste ? merklisteBiere : merklisteBiere.slice(0, INITIAL_COUNT)).map(item => (
                                <BeerCard
                                    key={item.beerId}
                                    beer={mapBeerForCard(item.beer)}
                                    trackingState={item.state}
                                    onToggleMerkliste={toggleMerkliste}
                                    onLogDrink={logDrink}
                                    onRemoveDrink={removeDrink}
                                    onRate={rateBeer}
                                    onBreweryClick={handleBreweryClick}
                                    compact
                                />
                            ))}
                        </div>
                        {merklisteBiere.length > INITIAL_COUNT && (
                            <button className={styles.toggleMore} onClick={() => setShowAllMerkliste(!showAllMerkliste)}>
                                {showAllMerkliste ? <><FaChevronUp /> Weniger anzeigen</> : <><FaChevronDown /> Alle {merklisteBiere.length} anzeigen</>}
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Bestbewertete */}
            {renderSection('Meine Bestbewerteten', <FaStar className={styles.sectionIcon} />, bestRated, showAllBest, setShowAllBest)}

            {/* Meistgetrunken */}
            {renderSection('Am meisten getrunken', <FaBeer className={styles.sectionIcon} />, mostDrunk, showAllDrunk, setShowAllDrunk, true)}

            {/* Sponsoren */}
            <div className={styles.sponsorSection}>
                <h3 className={styles.sponsorTitle}>Unterstützt von</h3>
                <SponsorBanner onSponsorClick={(sponsor) => setSelectedSponsor(sponsor)} />
            </div>

            {/* Sponsoren Detail Drill-down */}
            <BottomSheet
                isOpen={!!selectedSponsor}
                onClose={() => setSelectedSponsor(null)}
                showBack={false}
                title={selectedSponsor?.name || ''}
            >
                {selectedSponsor && (
                    <div className={styles.breweryDetail}>
                        <div className={styles.detailHeaderRow}>
                            <div className={styles.detailHeaderIconWrapper}>
                                {selectedSponsor.imgUrl ? (
                                    <img src={selectedSponsor.imgUrl} alt={selectedSponsor.name} className={styles.detailHeaderImg} />
                                ) : (
                                    <div className={styles.detailHeaderFallback}>{selectedSponsor.name?.substring(0, 2).toUpperCase()}</div>
                                )}
                            </div>
                            <div className={styles.detailHeaderInfo}>
                                {/* HIER: Tier Name & Icon direkt als grünes Badge! */}
                                <span className={styles.detailTypeBadge}>
                                    {selectedSponsor.tier?.imgUrl && <img src={selectedSponsor.tier.imgUrl} alt="Tier" style={{ height: '14px', marginRight: '4px', verticalAlign: 'middle' }} />}
                                    {selectedSponsor.tier?.name || 'Sponsor'}
                                </span>
                                {selectedSponsor.city && <span className={styles.detailMetaText}>📍 {selectedSponsor.city.name || selectedSponsor.city}</span>}
                            </div>
                            <div className={styles.detailHeaderActions}>
                                {selectedSponsor.website && (
                                    <div className={styles.actionWrapper}>
                                        <a href={selectedSponsor.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
                                            <FaGlobe /> Zur Website
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedSponsor.description && <p className={styles.breweryDesc}>{selectedSponsor.description}</p>}
                    </div>
                )}
            </BottomSheet>

            {/* Brauerei Detail */}
            <BottomSheet
                isOpen={!!breweryDetail}
                onClose={() => setBreweryDetail(null)}
                showBack={false}
                title={breweryDetail?.name || ''}
            >
                {breweryDetail && (() => {
                    // NEU: Biere für diese Brauerei filtern
                    const bBeers = beers.filter(b => b.brewery?.id === breweryDetail.id);

                    return (
                        <div className={styles.breweryDetail}>
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
                            
                            {breweryDetail.description && <p className={styles.breweryDesc}>{breweryDetail.description}</p>}

                            {/* NEU: Biere der Brauerei */}
                            <div className={styles.beerList} style={{ marginTop: '16px' }}>
                                <h4 style={{ fontSize: '0.95rem', color: 'var(--bf-dark-green)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaBeer /> Biere dieser Brauerei ({bBeers.length})
                                </h4>
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
                                        onJumpToMap={handleJumpToMap}
                                        compact={true}
                                    />
                                ))}
                                {bBeers.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--bf-text-muted)' }}>Derzeit keine Biere gelistet.</p>}
                            </div>
                        </div>
                    );
                })()}
            </BottomSheet>
        </div>
    );
};

export default MeinBesuchPage;
