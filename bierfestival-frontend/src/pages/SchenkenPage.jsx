import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import { FaMapMarkerAlt, FaLocationArrow, FaBeer, FaAngleRight, FaGlobe } from 'react-icons/fa';
import BottomSheet from '../components/UI/BottomSheet';
import SponsorBanner from '../components/UI/SponsorBanner';
import BeerCard from '../components/UI/BeerCard';
import useTracking from '../hooks/useTracking';
import styles from './SchenkenPage.module.css';

const SchenkenPage = () => {
    const [taverns, setTaverns] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTavern, setSelectedTavern] = useState(null);
    const [breweryDetail, setBreweryDetail] = useState(null);
    const navigate = useNavigate();
    const [allBeers, setAllBeers] = useState([]);

    const [selectedSponsor, setSelectedSponsor] = useState(null);

    const { getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [tavernsData, brewData, beersData] = await Promise.all([
                    fetchCachedData('/api/taverns'),
                    fetchCachedData('/api/breweries'),
                    fetchCachedData('/api/beers')
                ]);
                if (tavernsData) setTaverns(tavernsData.sort((a, b) => a.name.localeCompare(b.name)));
                if (brewData) setBreweries(brewData);
                if (beersData) setAllBeers(beersData);
            } catch (error) {
                console.error("Fehler beim Laden der Schenken", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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

    const handleJumpToMap = (tavern) => {
        if (tavern?.lat && tavern?.lon) {
            navigate('/', { state: { jumpToPoi: { lat: tavern.lat, lon: tavern.lon } } });
        } else {
            navigate('/');
        }
    };

    const handleBreweryClick = (breweryId) => {
        const brewery = breweries.find(b => b.id === breweryId);
        if (brewery) setBreweryDetail(brewery);
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Schenken werden geladen...</div></div>;
    }

    if (taverns.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FaBeer className={styles.emptyIcon} />
                    <h2>Keine Schenken gefunden</h2>
                    <p>Aktuell sind noch keine Schenken eingetragen.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>

            <div className={styles.sponsorOverlay}>
                <SponsorBanner onSponsorClick={(sponsor) => setSelectedSponsor(sponsor)} />
            </div>

            <div className={styles.container}>
                <div className={styles.header}>
                    <FaBeer className={styles.headerIcon} />
                    <h1 className={styles.title}>Schenken</h1>
                    <p className={styles.subtitle}>{taverns.length} Schenken am Bierfestival</p>
                </div>

                <div className={styles.tavernList}>
                    {taverns.map(tavern => (
                        <div key={tavern.id} className={styles.tavernCard}>

                            <div className={styles.imageWrapper}>
                                {tavern.imgUrl ? (
                                    <img src={tavern.imgUrl} alt={tavern.name} className={styles.tavernImage} />
                                ) : (
                                    <FaBeer className={styles.placeholderIcon} />
                                )}
                            </div>

                            <div className={styles.tavernContent}>
                                <button
                                    className={styles.beersButton}
                                    onClick={() => setSelectedTavern(tavern)}
                                >
                                    <FaBeer />
                                    <span>
                                        {tavern.beers?.length
                                            ? `${tavern.beers.length} Biere`
                                            : 'Keine Biere gelistet'}
                                    </span>
                                    {tavern.beers?.length > 0 && <FaAngleRight className={styles.arrowIcon} />}
                                </button>

                                {/* Untere Reihe: Name und Karte-Button nebeneinander */}
                                <div className={styles.infoRow}>
                                    <h3 className={styles.tavernName}>{tavern.name}</h3>
                                    <button
                                        className={styles.mapBtn}
                                        onClick={() => handleJumpToMap(tavern)}
                                    >
                                        <FaMapMarkerAlt /> Karte
                                        <FaLocationArrow className={styles.jumpIcon} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                {/* Bier-Overlay für Schenke */}
                <BottomSheet
                    isOpen={!!selectedTavern && !breweryDetail}
                    onClose={() => setSelectedTavern(null)}
                    title={selectedTavern ? `${selectedTavern.name}` : ''}
                >
                    {!selectedTavern?.beers || selectedTavern.beers.length === 0 ? (
                        <p className={styles.noBeersText}>Hier sind aktuell keine Biere hinterlegt.</p>
                    ) : (
                        <div className={styles.beerCardList}>
                            {selectedTavern.beers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(beer => {
                                const fullBeer = allBeers.find(b => b.id === beer.beerId);
                                return (
                                    <BeerCard
                                        key={beer.beerId}
                                        beer={fullBeer ? {
                                            beerId: fullBeer.id,
                                            name: fullBeer.name,
                                            breweryName: fullBeer.brewery?.name,
                                            breweryId: fullBeer.brewery?.id,
                                            typeName: fullBeer.beerType?.name,
                                            alcoholPercentage: fullBeer.alcoholPercentage,
                                            isNonAlcoholic: fullBeer.isNonAlcoholic,
                                            description: fullBeer.description,
                                            originalGravity: fullBeer.originalGravity,
                                            hopInfo: fullBeer.hopInfo,
                                            maltInfo: fullBeer.maltInfo,
                                        } : {
                                            beerId: beer.beerId, name: beer.name, breweryName: beer.breweryName, breweryId: beer.breweryId, typeName: beer.typeName, alcoholPercentage: beer.alcoholPercentage, isNonAlcoholic: beer.isNonAlcoholic
                                        }}
                                        trackingState={getBeerState(beer.beerId)}
                                        onToggleMerkliste={toggleMerkliste}
                                        onLogDrink={logDrink}
                                        onRemoveDrink={removeDrink}
                                        onRate={rateBeer}
                                        onBreweryClick={handleBreweryClick}
                                        compact={false}
                                    />
                                );
                            })}
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
                                <div className={styles.beerCardList}>
                                    <h4 style={{ fontSize: '0.95rem', color: 'var(--bf-dark-green)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FaBeer /> Biere dieser Brauerei ({bBeers.length})
                                    </h4>
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
                                            onRemoveDrink={removeDrink}
                                            onRate={rateBeer}
                                            compact={true}
                                        />
                                    ))}
                                    {bBeers.length === 0 && <p className={styles.noBeersText}>Derzeit keine Biere gelistet.</p>}
                                </div>
                            </div>
                        );
                    })()}
                </BottomSheet>

                <BottomSheet
                    isOpen={!!selectedSponsor}
                    onClose={() => setSelectedSponsor(null)}
                    showBack={false}
                    title={selectedSponsor?.name || ''}
                >
                    {selectedSponsor && (
                        <div style={{ padding: '8px 0' }}>
                            <div className={styles.detailHeaderRow}>
                                <div className={styles.detailHeaderIconWrapper}>
                                    {selectedSponsor.imgUrl ? (
                                        <img src={selectedSponsor.imgUrl} alt={selectedSponsor.name} className={styles.detailHeaderImg} />
                                    ) : (
                                        <div className={styles.detailHeaderFallback}>{selectedSponsor.name?.substring(0, 2).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className={styles.detailHeaderInfo}>
                                    <span className={styles.detailTypeBadge}>
                                        {selectedSponsor.tier?.imgUrl && <img src={selectedSponsor.tier.imgUrl} alt="Tier Icon" style={{ height: '14px', marginRight: '4px', verticalAlign: 'middle' }} />}
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
                            {selectedSponsor.description && <p className={styles.sponsorDesc}>{selectedSponsor.description}</p>}
                        </div>
                    )}
                </BottomSheet>
            </div>
        </div>
    );
};

export default SchenkenPage;
