import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const BreweryManager = () => {
    const [breweries, setBreweries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

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

    const formFields = [
        { name: 'name', label: 'Name der Brauerei', type: 'text', required: true },
        { name: 'city', label: 'Ort', type: 'text' },
        { name: 'region', label: 'Region', type: 'text' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'isHallertau', label: 'Kommt aus der Hallertau?', type: 'checkbox' }
    ];

    useEffect(() => {
        loadBreweries();
    }, []);

    const loadBreweries = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/breweries');
            setBreweries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (brewery) => {
        setEditingItem(brewery);
        setIsModalOpen(true);
    };

    const handleDelete = async (brewery) => {
        if(window.confirm(`Brauerei "${brewery.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/breweries/${brewery.id}`);
                loadBreweries();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingItem && editingItem.id) {
                await apiService.put(`/api/breweries/${editingItem.id}`, formData);
            } else {
                await apiService.post('/api/breweries', formData);
            }
            setIsModalOpen(false);
            loadBreweries();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Brauereien verwalten</h2>
                <button 
                    onClick={handleCreateNew}
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

            <GenericFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                title={editingItem ? 'Brauerei bearbeiten' : 'Neue Brauerei anlegen'}
                fields={formFields}
                initialData={editingItem}
            />
        </div>
    );
};

export default BreweryManager;