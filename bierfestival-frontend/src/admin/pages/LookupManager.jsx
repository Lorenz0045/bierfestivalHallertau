import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import apiService from '../../services/apiService';

const LookupManager = () => {
    const [beerTypes, setBeerTypes] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const beerTypeColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Biersorte' }
    ];

    const facilityTypeColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Einrichtungsart' },
        { key: 'iconName', label: 'Icon-Bezeichnung' }
    ];

    useEffect(() => {
        loadLookups();
    }, []);

    const loadLookups = async () => {
        setLoading(true);
        try {
            const [beersRes, facilitiesRes] = await Promise.all([
                apiService.get('/api/beer-types'),
                apiService.get('/api/facility-types')
            ]);
            setBeerTypes(beersRes);
            setFacilityTypes(facilitiesRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        console.log(item);
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <h2 style={{ color: '#1b4332', marginBottom: '2rem' }}>Kategorien & Lookups</h2>

            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#495057', margin: 0 }}>Biersorten</h3>
                    <button style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                        + Sorte hinzufügen
                    </button>
                </div>
                <DataTable columns={beerTypeColumns} data={beerTypes} onEdit={handleEdit} />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#495057', margin: 0 }}>Einrichtungen (Map Icons)</h3>
                    <button style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                        + Einrichtung hinzufügen
                    </button>
                </div>
                <DataTable columns={facilityTypeColumns} data={facilityTypes} onEdit={handleEdit} />
            </div>
        </div>
    );
};

export default LookupManager;