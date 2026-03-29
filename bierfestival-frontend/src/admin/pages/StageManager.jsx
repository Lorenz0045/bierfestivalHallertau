import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const StageManager = () => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Bühnenname' }
    ];

    const formFields = [
        { name: 'name', label: 'Bühnenname', type: 'text', required: true }
    ];

    useEffect(() => {
        loadStages();
    }, []);

    const loadStages = async () => {
        setLoading(true);
        try {
            const data = await apiService.get('/api/stages');
            setStages(data);
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
        if(window.confirm(`Bühne "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/stages/${item.id}`);
                loadStages();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (editingItem && editingItem.id) {
                await apiService.put(`/api/stages/${editingItem.id}`, formData);
            } else {
                await apiService.post('/api/stages', formData);
            }
            setIsModalOpen(false);
            loadStages();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Bühnen verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Bühne
                </button>
            </div>
            
            <DataTable columns={columns} data={stages} onEdit={handleEdit} onDelete={handleDelete} />

            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Bühne bearbeiten' : 'Neue Bühne anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default StageManager;