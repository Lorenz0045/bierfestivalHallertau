import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import { FaMapMarkerAlt, FaLocationArrow, FaBeer, FaAngleRight, FaBookmark, FaCheck, FaStar } from 'react-icons/fa';
import BottomSheet from '../components/UI/BottomSheet';
import useTracking from '../hooks/useTracking';
import styles from './SchenkenPage.module.css';

const SchenkenPage = () => {
    const [taverns, setTaverns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTavern, setSelectedTavern] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadTaverns = async () => {
            try {
                const data = await fetchCachedData('/api/taverns');
                if (data) {
                    setTaverns(data.sort((a, b) => a.name.localeCompare(b.name)));
                }
            } catch (error) {
                console.error("Fehler beim Laden der Schenken", error);
            } finally {
                setLoading(false);
            }
        };
        loadTaverns();
    }, []);

    const handleJumpToMap = (tavern) => {
        if (tavern && tavern.lat && tavern.lon) {
            navigate('/', { state: { jumpToPoi: { lat: tavern.lat, lon: tavern.lon } } });
        } else {
            navigate('/');
        }
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
                                            ? `${tavern.beers.length} Biere auf der Karte`
                                            : 'Keine Biere gelistet'}
                                    </span>
                                    {tavern.beers?.length > 0 && <FaAngleRight className={styles.arrowIcon} />}
                                </button>

                                <button
                                    className={styles.mapButton}
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

            <BottomSheet
                isOpen={!!selectedTavern}
                onClose={() => setSelectedTavern(null)}
                title={selectedTavern ? `Ausschank: ${selectedTavern.name}` : ''}
            >
                {!selectedTavern?.beers || selectedTavern.beers.length === 0 ? (
                    <p className={styles.noBeersText}>Hier sind aktuell keine Biere hinterlegt.</p>
                ) : (
                    <ul className={styles.beerList}>
                        {selectedTavern.beers.sort((a, b) => a.sortOrder - b.sortOrder).map(beer => {
                            const state = getBeerState(beer.beerId);
                            const hasDrunk = state.drinkTimestamps && state.drinkTimestamps.length > 0;
                            
                            return (
                            <li key={beer.beerId} className={styles.beerItem}>
                                <div className={styles.beerIconWrapper}>
                                    <FaBeer className={styles.beerIcon} />
                                </div>
                                <div className={styles.beerDetails}>
                                    <h4 className={styles.beerName}>{beer.name}</h4>
                                    <div className={styles.beerMeta}>
                                        {beer.breweryName && <span className={styles.breweryInfo}>{beer.breweryName}</span>}
                                        {beer.typeName && <span className={styles.typeBadge}>{beer.typeName}</span>}
                                        {beer.alcoholPercentage != null && (
                                            <span className={styles.alcoholBadge}>{beer.alcoholPercentage}% Vol.</span>
                                        )}
                                    </div>
                                    <div className={styles.beerInteractions}>
                                        <button 
                                            className={`${styles.interactionButton} ${state.isOnMerkliste ? styles.activeBookmark : ''}`} 
                                            title="Auf die Merkliste" 
                                            onClick={() => toggleMerkliste(beer.beerId)}
                                        >
                                            <FaBookmark />
                                        </button>
                                        
                                        <button 
                                            className={`${styles.interactionButton} ${hasDrunk ? styles.activeCheck : ''}`} 
                                            title="Als Getrunken markieren" 
                                            onClick={() => logDrink(beer.beerId)}
                                        >
                                            <FaCheck /> {hasDrunk && <span className={styles.drinkCount}>{state.drinkTimestamps.length}x</span>}
                                        </button>
                                        
                                        <button 
                                            className={`${styles.interactionButton} ${state.rating ? styles.activeStar : ''} ${!hasDrunk ? styles.disabledAction : ''}`} 
                                            title={hasDrunk ? "Stern vergeben (1-5)" : "Bewerten (nur wenn probiert)"} 
                                            onClick={() => {
                                                if(!hasDrunk) {
                                                    alert("Du musst das Bier probiert haben, bevor du es bewerten kannst.");
                                                    return;
                                                }
                                                rateBeer(beer.beerId, state.rating ? null : 5);
                                            }}
                                        >
                                            <FaStar /> {state.rating && <span className={styles.ratingNumber}>{state.rating}</span>}
                                        </button>
                                    </div>
                                </div>
                            </li>
                            );
                        })}
                    </ul>
                )}
            </BottomSheet>
        </div>
    );
};

export default SchenkenPage;
