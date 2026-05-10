import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_CRAFT_MARKETS = '/api/craft-markets';
const API_CITIES = '/api/cities';

const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const CraftMarketManager = () => {
    const { keycloakInstance } = useUser();
    const [craftMarkets, setCraftMarkets] = useState([]);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort', render: (_, row) => row.city?.name || '-' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        {
            key: 'imgUrl',
            label: 'Icon',
            sortable: false,
            render: (val) => val ? <img src={val} alt="Markt" style={{ height: '30px', borderRadius: '4px' }} /> : '-'
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Beschreibung', type: 'textarea', rows: 5, maxLength: 2000 },
        { name: 'cityId', label: 'Ort', type: 'select', options: cities.map(c => ({ id: c.id, name: c.name })), lookupEndpoint: '/api/cities' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'imgUrl', label: 'Icon', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [marketData, cityData] = await Promise.all([
                apiRequest(API_CRAFT_MARKETS, 'GET', null, keycloakInstance.token),
                apiRequest(API_CITIES, 'GET', null, keycloakInstance.token)
            ]);
            setCraftMarkets(marketData || []);
            setCities(cityData || []);
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
        const itemForEdit = {
            ...item,
            cityId: item.city?.id || ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Handwerkermarkt "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_CRAFT_MARKETS}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
            } catch (error) {
                console.error(error);
                alert("Fehler beim Löschen.");
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        const payload = {
            ...formData,
            city: formData.cityId ? { id: parseInt(formData.cityId) } : null
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_CRAFT_MARKETS}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_CRAFT_MARKETS, 'POST', payload, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert("Fehler beim Speichern.");
        }
    };

    const handleLookupCreated = (fieldName, newEntry) => {
        if (fieldName === 'cityId') {
            setCities(prev => [...prev, newEntry].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Handwerkermarkt verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neuer Handwerkermarkt
                </button>
            </div>
            <DataTable columns={columns} data={craftMarkets} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                title={editingItem ? 'Handwerkermarkt bearbeiten' : 'Neuen Handwerkermarkt anlegen'}
                fields={formFields}
                initialData={editingItem}
                onLookupCreated={handleLookupCreated}
            />
        </div>
    );
};

export default CraftMarketManager;
