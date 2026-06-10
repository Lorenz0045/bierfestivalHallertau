import { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DataTable from '../../components/DataTable';
import AnalyticsFilterBar from '../../components/AnalyticsFilterBar';
import apiRequest from '../../../services/apiService';
import { useUser } from '../../contexts/UserContext';
import styles from '../../AnalyticsPage.module.css';

const TopBeersAnalytics = () => {
    const { keycloakInstance } = useUser();
    const [beers, setBeers] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [beerTypes, setBeerTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        searchQuery: '',
        breweryId: '',
        cityId: '',
        districtId: '',
        beerTypeId: '',
        alcoholMode: 'ALL'
    });

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [beersData, brewData, cityData, distData, typeData] = await Promise.all([
                apiRequest('/api/admin/analytics/beers/overview', 'GET', null, keycloakInstance.token),
                apiRequest('/api/breweries', 'GET', null, keycloakInstance.token),
                apiRequest('/api/cities', 'GET', null, keycloakInstance.token),
                apiRequest('/api/districts', 'GET', null, keycloakInstance.token),
                apiRequest('/api/beer-types', 'GET', null, keycloakInstance.token)
            ]);
            setBeers(beersData || []);
            setBreweries(brewData || []);
            setCities(cityData || []);
            setDistricts(distData || []);
            setBeerTypes(typeData || []);
        } catch (error) {
            console.error("Error loading analytics data", error);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredBeers = useMemo(() => {
        return beers.filter(b => {
            if (filters.searchQuery && !b.beerName.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            if (filters.breweryId && b.breweryName !== breweries.find(br => br.id.toString() === filters.breweryId)?.name) return false;
            if (filters.cityId && b.cityName !== cities.find(c => c.id.toString() === filters.cityId)?.name) return false;
            if (filters.districtId && b.districtName !== districts.find(d => d.id.toString() === filters.districtId)?.name) return false;
            if (filters.beerTypeId && b.beerTypeName !== beerTypes.find(bt => bt.id.toString() === filters.beerTypeId)?.name) return false;
            
            if (filters.alcoholMode === 'ALC' && b.isNonAlcoholic) return false;
            if (filters.alcoholMode === 'NON_ALC' && !b.isNonAlcoholic) return false;
            
            return true;
        });
    }, [beers, filters, breweries, cities, districts, beerTypes]);

    const topByRating = useMemo(() => {
        // Only consider beers with at least 1 rating for "Top Rating"
        return [...filteredBeers]
            .filter(b => b.ratingCount > 0)
            .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)
            .slice(0, 5)
            .map(b => ({
                name: b.beerName,
                avgRating: parseFloat(b.avgRating.toFixed(2)),
                ratingCount: b.ratingCount
            }));
    }, [filteredBeers]);

    const topByCount = useMemo(() => {
        return [...filteredBeers]
            .sort((a, b) => b.ratingCount - a.ratingCount)
            .slice(0, 5)
            .map(b => ({
                name: b.beerName,
                ratingCount: b.ratingCount
            }));
    }, [filteredBeers]);

    const columns = [
        { key: 'beerName', label: 'Bier' },
        { key: 'breweryName', label: 'Brauerei' },
        { key: 'cityName', label: 'Ort' },
        { key: 'districtName', label: 'Landkreis' },
        { key: 'beerTypeName', label: 'Sorte' },
        { key: 'isNonAlcoholic', label: 'Alkohol', render: (val) => val ? 'Alkoholfrei' : 'Mit Alkohol' },
        { key: 'avgRating', label: 'Ø Bewertung', render: (val) => val ? val.toFixed(2) : '-' },
        { key: 'ratingCount', label: 'Anz. Bewertungen' },
        { key: 'drinkCount', label: 'Anz. Getrunken' },
        { key: 'merklisteCount', label: 'Anz. Gemerkt' }
    ];

    const filterConfig = {
        searchQuery: { type: 'text', label: 'Suche', value: filters.searchQuery },
        breweryId: { type: 'select', label: 'Brauerei', value: filters.breweryId, options: breweries },
        cityId: { type: 'select', label: 'Ort', value: filters.cityId, options: cities },
        districtId: { type: 'select', label: 'Landkreis', value: filters.districtId, options: districts },
        beerTypeId: { type: 'select', label: 'Biersorte', value: filters.beerTypeId, options: beerTypes },
        alcoholMode: { type: 'select', label: 'Alkoholgehalt', value: filters.alcoholMode, options: [{id: 'ALL', name: 'Alle'}, {id: 'ALC', name: 'Mit Alkohol'}, {id: 'NON_ALC', name: 'Alkoholfrei'}] }
    };

    if (loading) return <div>Lade Auswertungen...</div>;

    return (
        <div>
            <h2>Top Biere</h2>
            <AnalyticsFilterBar filters={filterConfig} onFilterChange={handleFilterChange} />
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div className={styles.chartContainer} style={{ flex: '1 1 400px' }}>
                    <h3>Top 5 nach Bewertung</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topByRating} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 5]} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip formatter={(value, name, props) => [`${value} (aus ${props.payload.ratingCount} Bewertungen)`, 'Ø Bewertung']} />
                            <Legend />
                            <Bar dataKey="avgRating" name="Ø Bewertung" fill="#EEDB3C" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className={styles.chartContainer} style={{ flex: '1 1 400px' }}>
                    <h3>Top 5 nach Anzahl Bewertungen</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topByCount} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="ratingCount" name="Anzahl Bewertungen" fill="#54B947" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <h3>Alle Biere</h3>
                <DataTable columns={columns} data={filteredBeers} />
            </div>
        </div>
    );
};

export default TopBeersAnalytics;
