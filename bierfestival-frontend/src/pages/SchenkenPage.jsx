import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import { FaMapMarkerAlt, FaLocationArrow, FaBeer, FaAngleRight } from 'react-icons/fa';
import BottomSheet from '../components/UI/BottomSheet';
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

    const { getBeerState, toggleMerkliste, logDrink, removeDrink, rateBeer } = useTracking();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [tavernsData, brewData] = await Promise.all([
                    fetchCachedData('/api/taverns'),
                    fetchCachedData('/api/breweries'),
                ]);
                if (tavernsData) setTaverns(tavernsData.sort((a, b) => a.name.localeCompare(b.name)));
                if (brewData) setBreweries(brewData);
            } catch (error) {
                console.error("Fehler beim Laden der Schenken", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

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
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Schenken</h1>
                <p className={styles.subtitle}>{taverns.length} Schenken am Bierfestival</p>
            </div>

            <div className={styles.tavernList}>
                {taverns.map(tavern => (
                    <div key={tavern.id} className={styles.tavernCard}>
                        {tavern.imgUrl && (
                            <img src={tavern.imgUrl} alt={tavern.name} className={styles.tavernImage} />
                        )}
                        <div className={styles.tavernContent}>
                            <h3 className={styles.tavernName}>{tavern.name}</h3>
                            <div className={styles.actionButtons}>
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
                        {selectedTavern.beers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map(beer => (
                            <BeerCard
                                key={beer.beerId}
                                beer={{
                                    beerId: beer.beerId,
                                    name: beer.name,
                                    breweryName: beer.breweryName,
                                    breweryId: beer.breweryId,
                                    typeName: beer.typeName,
                                    alcoholPercentage: beer.alcoholPercentage,
                                    isNonAlcoholic: beer.isNonAlcoholic,
                                }}
                                trackingState={getBeerState(beer.beerId)}
                                onToggleMerkliste={toggleMerkliste}
                                onLogDrink={logDrink}
                                onRemoveDrink={removeDrink}
                                onRate={rateBeer}
                                onBreweryClick={handleBreweryClick}
                                compact
                            />
                        ))}
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
                {breweryDetail && (
                    <div className={styles.breweryDetail}>
                        {breweryDetail.imgUrl && <img src={breweryDetail.imgUrl} alt={breweryDetail.name} className={styles.breweryImg} />}
                        {breweryDetail.description && <p className={styles.breweryDesc}>{breweryDetail.description}</p>}
                        {breweryDetail.city && <p className={styles.breweryMeta}>📍 {breweryDetail.city.name || breweryDetail.city}</p>}
                        {breweryDetail.district && <p className={styles.breweryMeta}>🗺️ Landkreis {breweryDetail.district.name || breweryDetail.district}</p>}
                        {breweryDetail.website && (
                            <a href={breweryDetail.website} target="_blank" rel="noopener noreferrer" className={styles.breweryWebsite}>
                                🌐 Website besuchen
                            </a>
                        )}
                    </div>
                )}
            </BottomSheet>
        </div>
    );
};

export default SchenkenPage;
