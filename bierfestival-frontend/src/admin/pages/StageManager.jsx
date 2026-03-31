import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_BASE_URL = '/api/stages';

const StageManager = () => {
    const { keycloakInstance } = useUser();
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Bühnenname' },
        { key: 'imgUrl', label: 'Icon', sortable: false, render: (val) => val ? <img src={val} alt="Bühne" style={{ height: '30px', borderRadius: '4px' }} /> : '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Bühnenname', type: 'text', required: true },
        { name: 'imgUrl', label: 'Icon', type: 'image' }
    ];

    const loadStages = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const data = await apiRequest(API_BASE_URL, 'GET', null, keycloakInstance.token);
            setStages(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadStages();
    }, [loadStages]);

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Bühne "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_BASE_URL}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadStages();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_BASE_URL}/${editingItem.id}`, 'PUT', formData, keycloakInstance.token);
            } else {
                await apiRequest(API_BASE_URL, 'POST', formData, keycloakInstance.token);
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