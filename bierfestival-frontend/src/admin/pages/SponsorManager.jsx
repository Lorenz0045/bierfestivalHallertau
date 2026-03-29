import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import apiService from '../../services/apiService';

const SponsorManager = () => {
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort' },
        { 
            key: 'website', 
            label: 'Website',
            sortable: false,
            render: (val) => val ? <a href={val} target="_blank" rel="noreferrer">Link</a> : '-'
        }
    ];

    useEffect(() => {
        loadSponsors();
    }, []);

    const loadSponsors = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/sponsors');
            setSponsors(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (sponsor) => {
        console.log(sponsor);
    };

    const handleDelete = async (sponsor) => {
        if (window.confirm(`Sponsor "${sponsor.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/sponsors/${sponsor.id}`);
                loadSponsors();
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Sponsoren verwalten</h2>
                <button style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neuer Sponsor
                </button>
            </div>
            
            <DataTable 
                columns={columns} 
                data={sponsors} 
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default SponsorManager;