import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const BreweryAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [breweries, setBreweries] = useState([]);
    const [selectedBreweryId, setSelectedBreweryId] = useState('');
    const [breweryDetail, setBreweryDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadBreweries = async () => {
            if (!keycloakInstance?.token) return;
            try {
                const data = await apiRequest('/api/breweries', 'GET', null, keycloakInstance.token);
                setBreweries(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        loadBreweries();
    }, [keycloakInstance]);

    const loadBreweryDetail = useCallback(async (id) => {
        if (!keycloakInstance?.token || !id) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/api/admin/analytics/breweries/${id}`, 'GET', null, keycloakInstance.token);
            setBreweryDetail(data);
        } catch (error) {
            console.error("Error loading brewery detail", error);
            setBreweryDetail(null);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        if (selectedBreweryId) {
            loadBreweryDetail(selectedBreweryId);
        } else {
            setBreweryDetail(null);
        }
    }, [selectedBreweryId, loadBreweryDetail]);

    const columns = [
        { key: 'beerName', label: 'Bier' },
        { key: 'beerTypeName', label: 'Sorte' },
        { key: 'isNonAlcoholic', label: 'Alkohol', render: (val) => val ? 'Alkoholfrei' : 'Mit Alkohol' },
        { key: 'avgRating', label: 'Ø Bewertung', render: (val) => val ? val.toFixed(2) : '-' },
        { key: 'ratingCount', label: 'Anz. Bewertungen' },
        { key: 'drinkCount', label: 'Anz. Getrunken' },
        { key: 'merklisteCount', label: 'Anz. Gemerkt' }
    ];

    return (
        <div>
            <h2>Brauereiauswertungen</h2>
            <div style={{ marginBottom: '2rem' }}>
                <select 
                    style={{ padding: '0.75rem', width: '100%', maxWidth: '400px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    value={selectedBreweryId}
                    onChange={(e) => setSelectedBreweryId(e.target.value)}
                >
                    <option value="">-- Bitte Brauerei auswählen --</option>
                    {breweries.sort((a, b) => a.name.localeCompare(b.name)).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Lade Daten...</div>}

            {breweryDetail && !loading && (
                <>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <h3>Gesamt Durchschnittsbewertung</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{breweryDetail.overallAvgRating ? breweryDetail.overallAvgRating.toFixed(2) : '-'}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Gesamt Bewertungen</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{breweryDetail.totalRatingCount}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Anzahl Biere</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{breweryDetail.beers.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <h3>Biere der Brauerei</h3>
                        <DataTable columns={columns} data={breweryDetail.beers} />
                    </div>
                </>
            )}
        </div>
    );
};

export default BreweryAnalytics;
