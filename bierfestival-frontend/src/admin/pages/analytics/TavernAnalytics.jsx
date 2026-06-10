import { useState, useEffect, useCallback } from 'react';
import DataTable from '../../components/DataTable';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const TavernAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [taverns, setTaverns] = useState([]);
    const [selectedTavernId, setSelectedTavernId] = useState('');
    const [tavernDetail, setTavernDetail] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadTaverns = async () => {
            if (!keycloakInstance?.token) return;
            try {
                const data = await apiRequest('/api/taverns', 'GET', null, keycloakInstance.token);
                setTaverns(data || []);
            } catch (error) {
                console.error(error);
            }
        };
        loadTaverns();
    }, [keycloakInstance]);

    const loadTavernDetail = useCallback(async (id) => {
        if (!keycloakInstance?.token || !id) return;
        setLoading(true);
        try {
            const data = await apiRequest(`/api/admin/analytics/taverns/${id}`, 'GET', null, keycloakInstance.token);
            setTavernDetail(data);
        } catch (error) {
            console.error("Error loading tavern detail", error);
            setTavernDetail(null);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        if (selectedTavernId) {
            loadTavernDetail(selectedTavernId);
        } else {
            setTavernDetail(null);
        }
    }, [selectedTavernId, loadTavernDetail]);

    const columns = [
        { key: 'beerName', label: 'Bier' },
        { key: 'breweryName', label: 'Brauerei' },
        { key: 'beerTypeName', label: 'Sorte' },
        { key: 'avgRating', label: 'Ø Bewertung', render: (val) => val ? val.toFixed(2) : '-' },
        { key: 'drinkCount', label: 'Anz. Getrunken' }
    ];

    return (
        <div>
            <h2>Schenkenauswertungen</h2>
            <div style={{ marginBottom: '2rem' }}>
                <select 
                    style={{ padding: '0.75rem', width: '100%', maxWidth: '400px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    value={selectedTavernId}
                    onChange={(e) => setSelectedTavernId(e.target.value)}
                >
                    <option value="">-- Bitte Schenke auswählen --</option>
                    {taverns.sort((a, b) => a.name.localeCompare(b.name)).map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div>Lade Daten...</div>}

            {tavernDetail && !loading && (
                <>
                    <div className={styles.statGrid}>
                        <div className={styles.statCard}>
                            <h3>Biere im Angebot</h3>
                            <div className={styles.statValueContainer}>
                                <span className={styles.statValue}>{tavernDetail.beers.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <h3>Biere an dieser Schenke</h3>
                        <DataTable columns={columns} data={tavernDetail.beers} />
                    </div>
                </>
            )}
        </div>
    );
};

export default TavernAnalytics;
