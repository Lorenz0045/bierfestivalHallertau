import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_GASTRONOMIES = '/api/gastronomies';
const API_GASTRONOMY_TYPES = '/api/gastronomy-types';

const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const GastronomyManager = () => {
    const { keycloakInstance } = useUser();
    const [gastronomies, setGastronomies] = useState([]);
    const [gastronomyTypes, setGastronomyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Typ', render: (_, row) => row.type?.name || '-' },
        { key: 'city', label: 'Ort' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        { 
            key: 'imgUrl', 
            label: 'Bild', 
            sortable: false, 
            render: (val) => val ? <img src={val} alt="Gastro" style={{ height: '30px', borderRadius: '4px' }} /> : '-' 
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'typeId', label: 'Kategorie', type: 'select', options: gastronomyTypes.map(t => ({ id: t.id, name: t.name })), required: true },
        { name: 'city', label: 'Stadt', type: 'text' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'imgUrl', label: 'Bild (Upload)', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [gastroData, typesData] = await Promise.all([
                apiRequest(API_GASTRONOMIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_GASTRONOMY_TYPES, 'GET', null, keycloakInstance.token)
            ]);
            setGastronomies(gastroData || []);
            setGastronomyTypes(typesData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        // Bereite das Item für das Modal vor (Setze typeId für das Select-Feld)
        const itemForEdit = {
            ...item,
            typeId: item.type?.id || ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Gastronomie "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_GASTRONOMIES}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
            } catch (error) {
                console.error(error);
                alert("Fehler beim Löschen.");
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        
        // Mappe das typeId aus dem Formular zurück in das vom Backend erwartete Format (type: { id: ... })
        const payload = {
            ...formData,
            type: formData.typeId ? { id: parseInt(formData.typeId) } : null
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_GASTRONOMIES}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_GASTRONOMIES, 'POST', payload, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Fehler beim Speichern.");
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
            <GenericFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleFormSubmit} 
                title={editingItem ? 'Gastronomie bearbeiten' : 'Neue Gastronomie anlegen'} 
                fields={formFields} 
                initialData={editingItem} 
            />
        </div>
    );
};

export default GastronomyManager;