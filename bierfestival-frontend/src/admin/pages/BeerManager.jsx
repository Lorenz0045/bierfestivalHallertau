import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_BEERS = '/api/beers';
const API_BREWERIES = '/api/breweries';
const API_BEER_TYPES = '/api/beer-types';

const BeerManager = () => {
    const { keycloakInstance } = useUser();
    const [beers, setBeers] = useState([]);
    const [breweries, setBreweries] = useState([]);
    const [beerTypes, setBeerTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'brewery', label: 'Brauerei', render: (_, row) => row.brewery?.name || '-' },
        { key: 'beerType', label: 'Sorte', render: (_, row) => row.beerType?.name || '-' },
        { key: 'alcoholPercentage', label: 'Alkohol', render: (val) => val ? `${val} %` : '-' },
        { key: 'isNonAlcoholic', label: 'Alkoholfrei', render: (val) => val ? 'Ja' : 'Nein' }
    ];

    const formFields = [
        { name: 'name', label: 'Name des Bieres', type: 'text', required: true },
        { name: 'breweryId', label: 'Brauerei', type: 'select', options: breweries.map(b => ({ id: b.id, name: b.name })), required: true },
        { name: 'beerTypeId', label: 'Biersorte', type: 'select', options: beerTypes.map(t => ({ id: t.id, name: t.name })) },
        { name: 'alcoholPercentage', label: 'Alkoholgehalt (%)', type: 'number', step: '0.1' },
        { name: 'originalGravity', label: 'Stammwürze', type: 'number', step: '0.1' },
        { name: 'isNonAlcoholic', label: 'Alkoholfrei', type: 'checkbox' },
        { name: 'description', label: 'Beschreibung', type: 'text' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [beersData, breweriesData, beerTypesData] = await Promise.all([
                apiRequest(API_BEERS, 'GET', null, keycloakInstance.token),
                apiRequest(API_BREWERIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_BEER_TYPES, 'GET', null, keycloakInstance.token)
            ]);
            setBeers(beersData || []);
            setBreweries(breweriesData || []);
            setBeerTypes(beerTypesData || []);
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
            breweryId: item.brewery?.id,
            beerTypeId: item.beerType?.id
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if (window.confirm(`Bier "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_BEERS}/${item.id}`, 'DELETE', null, keycloakInstance.token);
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
            brewery: formData.breweryId ? { id: parseInt(formData.breweryId) } : null,
            beerType: formData.beerTypeId ? { id: parseInt(formData.beerTypeId) } : null
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_BEERS}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_BEERS, 'POST', payload, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Biere verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neues Bier
                </button>
            </div>
            <DataTable columns={columns} data={beers} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Bier bearbeiten' : 'Neues Bier anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default BeerManager;