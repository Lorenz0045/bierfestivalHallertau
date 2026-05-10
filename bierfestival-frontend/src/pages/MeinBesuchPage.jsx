import React, { useState, useEffect, useMemo } from 'react';
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

    useEffect(() => {
        const load = async () => {
            try {
                const [beersData, brewData] = await Promise.all([
                    fetchCachedData('/api/beers'),
                    fetchCachedData('/api/breweries'),
                ]);
                setBeers(beersData || []);
                setBreweries(brewData || []);
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
                <SponsorBanner />
            </div>

            {/* Brauerei Detail */}
            <BottomSheet
                isOpen={!!breweryDetail}
                onClose={() => setBreweryDetail(null)}
                showBack={false}
                title={breweryDetail?.name || ''}
            >
                {breweryDetail && (
                    <div className={styles.breweryDetail}>
                        {breweryDetail.imgUrl && <img src={breweryDetail.imgUrl} alt={breweryDetail.name} className={styles.breweryImg} />}
                        {breweryDetail.description && <p className={styles.breweryDesc}>{breweryDetail.description}</p>}
                        {breweryDetail.city && <p className={styles.breweryMeta}>📍 {breweryDetail.city.name || breweryDetail.city}</p>}
                        {breweryDetail.district && <p className={styles.breweryMeta}>🗺️ Landkreis {breweryDetail.district.name || breweryDetail.district}</p>}
                        {breweryDetail.website && (
                            <a href={breweryDetail.website} target="_blank" rel="noopener noreferrer" className={styles.breweryWebsite}>
                                <FaGlobe /> Website besuchen
                            </a>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};

export default MeinBesuchPage;
