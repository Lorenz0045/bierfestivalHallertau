import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import DataTable from '../../components/DataTable';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const COLORS = ['#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#b7e4c7', '#d8f3dc'];

const MasterDataAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSummary = async () => {
            if (!keycloakInstance?.token) return;
            try {
                const data = await apiRequest('/api/admin/analytics/master-data-summary', 'GET', null, keycloakInstance.token);
                setSummary(data);
            } catch (error) {
                console.error("Error loading master data summary", error);
            } finally {
                setLoading(false);
            }
        };
        loadSummary();
    }, [keycloakInstance]);

    if (loading) return <div>Lade Stammdaten Auswertungen...</div>;
    if (!summary) return <div>Keine Daten verfügbar</div>;

    const beerTypeData = Object.entries(summary.beersPerType || {}).map(([name, value]) => ({ name: name || 'Unbekannt', value }));
    const alcoholData = [
        { name: 'Mit Alkohol', value: summary.alcoholicBeers },
        { name: 'Alkoholfrei', value: summary.nonAlcoholicBeers }
    ];

    const cityColumns = [
        { key: 'cityName', label: 'Ort' },
        { key: 'breweriesCount', label: 'Brauereien' },
        { key: 'beersCount', label: 'Biere (insgesamt)' },
        { key: 'gastronomyCount', label: 'Gastronomie' },
        { key: 'sponsorsCount', label: 'Sponsoren' },
        { key: 'craftMarketsCount', label: 'Handwerkermarkt' }
    ];

    return (
        <div>
            <h2>Stammdaten Übersicht</h2>
            
            <div className={styles.statGrid}>
                <div className={styles.statCard}><h3>Brauereien</h3><div className={styles.statValue}>{summary.breweriesCount}</div></div>
                <div className={styles.statCard}><h3>Biere</h3><div className={styles.statValue}>{summary.beersCount}</div></div>
                <div className={styles.statCard}><h3>Schenken</h3><div className={styles.statValue}>{summary.tavernsCount}</div></div>
                <div className={styles.statCard}><h3>Sponsoren</h3><div className={styles.statValue}>{summary.sponsorsCount}</div></div>
                <div className={styles.statCard}><h3>Gastronomie</h3><div className={styles.statValue}>{summary.gastronomyCount}</div></div>
                <div className={styles.statCard}><h3>Handwerkermarkt</h3><div className={styles.statValue}>{summary.craftMarketsCount}</div></div>
                <div className={styles.statCard}><h3>Bühnen</h3><div className={styles.statValue}>{summary.stagesCount}</div></div>
                <div className={styles.statCard}><h3>Programmpunkte</h3><div className={styles.statValue}>{summary.eventsCount}</div></div>
                <div className={styles.statCard}><h3>Einrichtungen</h3><div className={styles.statValue}>{summary.facilitiesCount}</div></div>
                <div className={styles.statCard}><h3>Buslinien</h3><div className={styles.statValue}>{summary.busLinesCount}</div></div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className={styles.chartContainer} style={{ flex: '1 1 300px' }}>
                    <h3>Biere nach Sorte</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={beerTypeData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({name, value}) => `${name} (${value})`}>
                                {beerTypeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.chartContainer} style={{ flex: '1 1 300px' }}>
                    <h3>Alkohol vs. Alkoholfrei</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={alcoholData} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label={({name, value}) => `${name} (${value})`}>
                                <Cell fill="#EEDB3C" />
                                <Cell fill="#54B947" />
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <h3>Orte Übersicht</h3>
                <DataTable columns={cityColumns} data={summary.cityDistributions} />
            </div>
        </div>
    );
};

export default MasterDataAnalytics;
