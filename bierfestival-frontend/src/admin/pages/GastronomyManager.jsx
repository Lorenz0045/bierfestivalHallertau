import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const GastronomyManager = () => {
    const [gastronomies, setGastronomies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Kategorie' },
        { key: 'city', label: 'Ort' },
        { 
            key: 'website', 
            label: 'Website',
            sortable: false,
            render: (val) => val ? <a href={val} target="_blank" rel="noreferrer">Link</a> : '-'
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name der Gastronomie', type: 'text', required: true },
        { name: 'category', label: 'Kategorie (z.B. Bayerisch)', type: 'text' },
        { name: 'city', label: 'Ort', type: 'text' },
        { name: 'website', label: 'Website', type: 'text' }
    ];

    useEffect(() => {
        loadGastronomies();
    }, []);

    const loadGastronomies = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/gastronomies');
            setGastronomies(data);
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

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if(window.confirm(`Gastronomie "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/gastronomies/${item.id}`);
                loadGastronomies();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingItem && editingItem.id) {
                await apiService.put(`/api/gastronomies/${editingItem.id}`, formData);
            } else {
                await apiService.post('/api/gastronomies', formData);
            }
            setIsModalOpen(false);
            loadGastronomies();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Gastronomie verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Gastronomie
                </button>
            </div>
            
            <DataTable columns={columns} data={gastronomies} onEdit={handleEdit} onDelete={handleDelete} />

            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Gastronomie bearbeiten' : 'Neue Gastronomie anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default GastronomyManager;