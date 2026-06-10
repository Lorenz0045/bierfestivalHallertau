import { useState, useEffect, useCallback } from 'react';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const BeerDetailAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [beers, setBeers] = useState([]);
    const [selectedBeerId, setSelectedBeerId] = useState('');
    const [beerDetail, setBeerDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial load of all beers for dropdown
    useEffect(() => {
        const loadBeers = async () => {
            if (!keycloakInstance?.token) return;
            try {
                const data = await apiRequest('/api/admin/analytics/beers/overview', 'GET', null, keycloakInstance.token);
                setBeers(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        loadBeers();
    }, [keycloakInstance]);

    const loadBeerDetail = useCallback(async (id) => {
        if (!keycloakInstance?.token || !id) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/api/admin/analytics/beers/${id}`, 'GET', null, keycloakInstance.token);
            setBeerDetail(data);
        } catch (error) {
            console.error("Error loading beer detail", error);
            setBeerDetail(null);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        if (selectedBeerId) {
            loadBeerDetail(selectedBeerId);
        } else {
            setBeerDetail(null);
        }
    }, [selectedBeerId, loadBeerDetail]);

    return (
        <div>
            <h2>Bierauswertungen</h2>
            <div style={{ marginBottom: '2rem' }}>
                <select 
                    style={{ padding: '0.75rem', width: '100%', maxWidth: '400px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    value={selectedBeerId}
                    onChange={(e) => setSelectedBeerId(e.target.value)}
                >
                    <option value="">-- Bitte Bier auswählen --</option>
                    {beers.sort((a, b) => a.beerName.localeCompare(b.beerName)).map(b => (
                        <option key={b.bierId} value={b.bierId}>{b.beerName} ({b.breweryName})</option>
                    ))}
                </select>
            </div>

            {loading && <div>Lade Daten...</div>}

            {beerDetail && !loading && (
                <>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <h3>Durchschnittsbewertung</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{beerDetail.avgRating ? beerDetail.avgRating.toFixed(2) : '-'}</span>
                                {beerDetail.rankAvgRating && <span className={styles.statRank}>#{beerDetail.rankAvgRating}</span>}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Anzahl Bewertungen</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{beerDetail.ratingCount}</span>
                                {beerDetail.rankRatingCount && <span className={styles.statRank}>#{beerDetail.rankRatingCount}</span>}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Ø Getrunkene Biere pro User</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{beerDetail.avgDrinksPerUser ? beerDetail.avgDrinksPerUser.toFixed(2) : '-'}</span>
                                {/* Platzierung hierfür nicht im Backend, aber machbar falls gefordert */}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Anzahl Getrunken Gesamt</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{beerDetail.drinkCount}</span>
                                {beerDetail.rankDrinkCount && <span className={styles.statRank}>#{beerDetail.rankDrinkCount}</span>}
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Anzahl Gemerkt</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{beerDetail.merklisteCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer} style={{ maxWidth: '600px' }}>
                        <h3>Bewertungsverteilung</h3>
                        <div className={styles.ratingBarContainer}>
                            {[5, 4, 3, 2, 1].map(stars => {
                                const stat = beerDetail.ratingDistribution?.find(r => r.stars === stars);
                                const percentage = stat ? stat.percentage : 0;
                                const count = stat ? stat.count : 0;
                                return (
                                    <div key={stars} className={styles.ratingRow}>
                                        <div className={styles.ratingLabel}>{stars} Krüge</div>
                                        <div className={styles.ratingBarTrack}>
                                            <div className={styles.ratingBarFill} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                        <div className={styles.ratingValue}>
                                            {percentage.toFixed(0)}% ({count})
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BeerDetailAnalytics;
