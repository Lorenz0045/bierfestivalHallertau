import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_BREWERIES = '/api/breweries';
const API_CITIES = '/api/cities';
const API_DISTRICTS = '/api/districts';

const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const BreweryManager = () => {
    const { keycloakInstance } = useUser();
    const [breweries, setBreweries] = useState([]);
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort', render: (_, row) => row.city?.name || '-' },
        { key: 'district', label: 'Landkreis', render: (_, row) => row.district?.name || '-' },
        { key: 'isHallertau', label: 'Hallertau', render: (val) => val ? 'Ja' : 'Nein' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        { key: 'imgUrl', label: 'Logo', sortable: false, render: (val) => val ? <img src={val} alt="Brauerei" style={{ height: '30px', borderRadius: '4px' }} /> : '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'cityId', label: 'Ort', type: 'select', options: cities.map(c => ({ id: c.id, name: c.name })), lookupEndpoint: '/api/cities' },
        { name: 'districtId', label: 'Landkreis', type: 'select', options: districts.map(d => ({ id: d.id, name: d.name })), lookupEndpoint: '/api/districts' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'isHallertau', label: 'Kommt aus der Hallertau?', type: 'checkbox' },
        { name: 'imgUrl', label: 'Logo', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [brewData, cityData, districtData] = await Promise.all([
                apiRequest(API_BREWERIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_CITIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_DISTRICTS, 'GET', null, keycloakInstance.token)
            ]);
            setBreweries(brewData || []);
            setCities(cityData || []);
            setDistricts(districtData || []);
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

    const handleEdit = (brewery) => {
        const itemForEdit = {
            ...brewery,
            cityId: brewery.city?.id || '',
            districtId: brewery.district?.id || ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (brewery) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Brauerei "${brewery.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_BREWERIES}/${brewery.id}`, 'DELETE', null, keycloakInstance.token);
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
            district: formData.districtId ? { id: parseInt(formData.districtId) } : null
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_BREWERIES}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_BREWERIES, 'POST', payload, keycloakInstance.token);
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
        } else if (fieldName === 'districtId') {
            setDistricts(prev => [...prev, newEntry].sort((a, b) => a.name.localeCompare(b.name)));
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Brauereien verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Brauerei
                </button>
            </div>
            <DataTable columns={columns} data={breweries} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Brauerei bearbeiten' : 'Neue Brauerei anlegen'} fields={formFields} initialData={editingItem} onLookupCreated={handleLookupCreated} />
        </div>
    );
};

export default BreweryManager;