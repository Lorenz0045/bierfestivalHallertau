import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import apiService from '../../services/apiService';

const BeerManager = () => {
    const [beers, setBeers] = useState([]);
    const [loading, setLoading] = useState(true);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { 
            key: 'brewery', 
            label: 'Brauerei', 
            render: (_, row) => row.brewery?.name || '-' 
        },
        { 
            key: 'beerType', 
            label: 'Sorte', 
            render: (_, row) => row.beerType?.name || '-' 
        },
        { 
            key: 'alcoholPercentage', 
            label: 'Alkohol', 
            render: (val) => val ? `${val} %` : '-' 
        },
        { 
            key: 'isNonAlcoholic', 
            label: 'Alkoholfrei', 
            render: (val) => val ? 'Ja' : 'Nein' 
        }
    ];

    useEffect(() => {
        loadBeers();
    }, []);

    const loadBeers = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/beers');
            setBeers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (beer) => {
        console.log(beer);
    };

    const handleDelete = async (beer) => {
        if (window.confirm(`Bier "${beer.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/beers/${beer.id}`);
                loadBeers();
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Biere verwalten</h2>
                <button style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neues Bier
                </button>
            </div>
            
            <DataTable 
                columns={columns} 
                data={beers} 
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default BeerManager;