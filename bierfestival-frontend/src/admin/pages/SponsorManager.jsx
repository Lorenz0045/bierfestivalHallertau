import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_SPONSORS = '/api/sponsors';
const API_CITIES = '/api/cities';
const API_TIERS = '/api/sponsor-tiers'; 

const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const SponsorManager = () => {
    const { keycloakInstance } = useUser();
    const [sponsors, setSponsors] = useState([]);
    const [cities, setCities] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'tier', label: 'Tier', render: (_, row) => row.tier?.name || '-' },
        { key: 'city', label: 'Ort', render: (_, row) => row.city?.name || '-' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        { key: 'imgUrl', label: 'Logo', sortable: false, render: (val) => val ? <img src={val} alt="Sponsor" style={{ height: '30px', borderRadius: '4px' }} /> : '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'tierId', label: 'Sponsoren-Tier', type: 'select', options: tiers.map(t => ({ id: t.id, name: t.name })), lookupEndpoint: API_TIERS },
        { name: 'cityId', label: 'Ort', type: 'select', options: cities.map(c => ({ id: c.id, name: c.name })), lookupEndpoint: '/api/cities' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'description', label: 'Beschreibung', type: 'text' },
        { name: 'imgUrl', label: 'Logo', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [sponsorData, cityData] = await Promise.all([
                apiRequest(API_SPONSORS, 'GET', null, keycloakInstance.token),
                apiRequest(API_CITIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_TIERS, 'GET', null, keycloakInstance.token)
            ]);
            setSponsors(sponsorData || []);
            setCities(cityData || []);
            setTiers(tierData || []);
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
            cityId: item.city?.id || '',
            tierId: item.tier?.id || ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if (window.confirm(`Sponsor "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_SPONSORS}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        const payload = {
            ...formData,
            city: formData.cityId ? { id: parseInt(formData.cityId) } : null,
            tier: formData.tierId ? { id: parseInt(formData.tierId) } : null
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_SPONSORS}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_SPONSORS, 'POST', payload, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleLookupCreated = (fieldName, newEntry) => {
        if (fieldName === 'cityId') {
            setCities(prev => [...prev, newEntry].sort((a, b) => a.name.localeCompare(b.name)));
        }
        if (fieldName === 'tierId') { 
            setTiers(prev => [...prev, newEntry].sort((a, b) => a.sortOrder - b.sortOrder));
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Sponsoren verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neuer Sponsor
                </button>
            </div>
            <DataTable columns={columns} data={sponsors} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Sponsor bearbeiten' : 'Neuer Sponsor'} fields={formFields} initialData={editingItem} onLookupCreated={handleLookupCreated} />
        </div>
    );
};

export default SponsorManager;