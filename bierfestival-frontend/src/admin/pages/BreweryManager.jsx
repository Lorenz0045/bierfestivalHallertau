import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_BASE_URL = '/api/breweries';

const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const BreweryManager = () => {
    const { keycloakInstance } = useUser();
    const [breweries, setBreweries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort' },
        { key: 'region', label: 'Region' },
        { key: 'isHallertau', label: 'Hallertau', render: (val) => val ? 'Ja' : 'Nein' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        { key: 'imgUrl', label: 'Logo', sortable: false, render: (val) => val ? <img src={val} alt="Brauerei" style={{ height: '30px', borderRadius: '4px' }} /> : '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'city', label: 'Ort', type: 'text' },
        { name: 'region', label: 'Region', type: 'text' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'isHallertau', label: 'Kommt aus der Hallertau?', type: 'checkbox' },
        { name: 'imgUrl', label: 'Logo', type: 'image' }
    ];

    const loadBreweries = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const data = await apiRequest(API_BASE_URL, 'GET', null, keycloakInstance.token);
            setBreweries(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadBreweries();
    }, [loadBreweries]);

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (brewery) => {
        setEditingItem(brewery);
        setIsModalOpen(true);
    };

    const handleDelete = async (brewery) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Brauerei "${brewery.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_BASE_URL}/${brewery.id}`, 'DELETE', null, keycloakInstance.token);
                loadBreweries();
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
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Brauerei
                </button>
            </div>
            <DataTable columns={columns} data={breweries} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Brauerei bearbeiten' : 'Neue Brauerei anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default BreweryManager;