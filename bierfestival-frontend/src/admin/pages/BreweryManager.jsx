import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import apiService from '../../services/apiService';

const BreweryManager = () => {
    const [breweries, setBreweries] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort' },
        { key: 'region', label: 'Region' },
        { 
            key: 'isHallertau', 
            label: 'Hallertau',
            render: (val) => val ? 'Ja' : 'Nein'
        },
        { 
            key: 'website', 
            label: 'Website',
            sortable: false,
            render: (val) => val ? <a href={val} target="_blank" rel="noreferrer">Link</a> : '-'
        }
    ];

    useEffect(() => {
        loadBreweries();
    }, []);

    const loadBreweries = async () => {
        setLoading(true);
        try {
            // Hinweis: Setzt voraus, dass du apiService.get('/api/breweries') implementiert hast
            const data = await apiService.get('/api/breweries');
            setBreweries(data);
        } catch (error) {
            console.error("Fehler beim Laden der Brauereien:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (brewery) => {
        console.log("Edit:", brewery);
        // TODO: Modal zum Bearbeiten öffnen
    };

    const handleDelete = (brewery) => {
        if(window.confirm(`Brauerei "${brewery.name}" wirklich löschen?`)) {
            console.log("Delete:", brewery.id);
            // TODO: apiService.delete aufrufen und Liste aktualisieren
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Brauereien verwalten</h2>
                <button 
                    style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Neue Brauerei
                </button>
            </div>
            
            <DataTable 
                columns={columns} 
                data={breweries} 
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default BreweryManager;