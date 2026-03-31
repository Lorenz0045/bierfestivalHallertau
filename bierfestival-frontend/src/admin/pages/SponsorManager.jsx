import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_BASE_URL = '/api/sponsors';


const renderExternalLink = (url) => {
    if (!url) return '-';
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    return <a href={absoluteUrl} target="_blank" rel="noopener noreferrer">Website</a>;
};

const SponsorManager = () => {
    const { keycloakInstance } = useUser();
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'city', label: 'Ort' },
        { key: 'website', label: 'Website', render: (val) => renderExternalLink(val) },
        { key: 'imgUrl', label: 'Logo', sortable: false, render: (val) => val ? <img src={val} alt="Sponsor" style={{ height: '30px', borderRadius: '4px' }} /> : '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'city', label: 'Ort', type: 'text' },
        { name: 'website', label: 'Website', type: 'text' },
        { name: 'description', label: 'Beschreibung', type: 'text' },
        { name: 'imgUrl', label: 'Logo', type: 'image' }
    ];

    const loadSponsors = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const data = await apiRequest(API_BASE_URL, 'GET', null, keycloakInstance.token);
            setSponsors(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadSponsors();
    }, [loadSponsors]);

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
        if (window.confirm(`Sponsor "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_BASE_URL}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadSponsors();
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
            loadSponsors();
        } catch (error) {
            console.error(error);
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
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Sponsor bearbeiten' : 'Neuer Sponsor'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default SponsorManager;