import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const CityAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [cities, setCities] = useState([]);
    const [selectedCityId, setSelectedCityId] = useState('');
    const [cityDetail, setCityDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadCities = async () => {
            if (!keycloakInstance?.token) return;
            try {
                const data = await apiRequest('/api/cities', 'GET', null, keycloakInstance.token);
                setCities(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        loadCities();
    }, [keycloakInstance]);

    const loadCityDetail = useCallback(async (id) => {
        if (!keycloakInstance?.token || !id) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/api/admin/analytics/cities/${id}`, 'GET', null, keycloakInstance.token);
            setCityDetail(data);
        } catch (error) {
            console.error("Error loading city detail", error);
            setCityDetail(null);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        if (selectedCityId) {
            loadCityDetail(selectedCityId);
        } else {
            setCityDetail(null);
        }
    }, [selectedCityId, loadCityDetail]);

    const beerColumns = [
        { key: 'beerName', label: 'Bier' },
        { key: 'breweryName', label: 'Brauerei' },
        { key: 'avgRating', label: 'Ø Bewertung', render: (val) => val ? val.toFixed(2) : '-' },
        { key: 'ratingCount', label: 'Anz. Bewertungen' }
    ];

    const breweryColumns = [
        { key: 'breweryName', label: 'Brauerei' },
        { key: 'beers', label: 'Anzahl Biere', render: (beers) => beers.length },
        { key: 'overallAvgRating', label: 'Gesamt Ø Bewertung', render: (val) => val ? val.toFixed(2) : '-' },
        { key: 'totalRatingCount', label: 'Gesamt Bewertungen' }
    ];

    return (
        <div>
            <h2>Ortsauswertungen</h2>
            <div style={{ marginBottom: '2rem' }}>
                <select 
                    style={{ padding: '0.75rem', width: '100%', maxWidth: '400px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    value={selectedCityId}
                    onChange={(e) => setSelectedCityId(e.target.value)}
                >
                    <option value="">-- Bitte Ort auswählen --</option>
                    {cities.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Lade Daten...</div>}

            {cityDetail && !loading && (
                <>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <h3>Brauereien</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{cityDetail.breweries.length}</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <h3>Biere Gesamt</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{cityDetail.beers.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <h3>Brauereien im Ort</h3>
                        <DataTable columns={breweryColumns} data={cityDetail.breweries} />
                    </div>

                    <div className={styles.chartContainer}>
                        <h3>Biere aus diesem Ort</h3>
                        <DataTable columns={beerColumns} data={cityDetail.beers} />
                    </div>
                </>
            )}
        </div>
    );
};

export default CityAnalytics;
