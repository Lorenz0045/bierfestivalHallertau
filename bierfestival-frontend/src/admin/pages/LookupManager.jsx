import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const LookupManager = () => {
    const [beerTypes, setBeerTypes] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isBeerModalOpen, setIsBeerModalOpen] = useState(false);
    const [editingBeerType, setEditingBeerType] = useState(null);

    const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
    const [editingFacilityType, setEditingFacilityType] = useState(null);

    const beerTypeColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Biersorte' }
    ];

    const facilityTypeColumns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Einrichtungsart' },
        { key: 'iconName', label: 'Icon-Bezeichnung' }
    ];

    const beerTypeFields = [
        { name: 'name', label: 'Biersorte', type: 'text', required: true }
    ];

    const facilityTypeFields = [
        { name: 'name', label: 'Einrichtungsart', type: 'text', required: true },
        { name: 'iconName', label: 'Icon-Bezeichnung', type: 'text' }
    ];

    useEffect(() => {
        loadLookups();
    }, []);

    const loadLookups = async () => {
        setLoading(true);
        try {
            const [beersRes, facilitiesRes] = await Promise.all([
                apiService.get('/api/beer-types'),
                apiService.get('/api/facility-types')
            ]);
            setBeerTypes(beersRes);
            setFacilityTypes(facilitiesRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBeerType = () => {
        setEditingBeerType(null);
        setIsBeerModalOpen(true);
    };

    const handleEditBeerType = (item) => {
        setEditingBeerType(item);
        setIsBeerModalOpen(true);
    };

    const handleDeleteBeerType = async (item) => {
        if (window.confirm(`Biersorte "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/beer-types/${item.id}`);
                loadLookups();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleBeerTypeSubmit = async (formData) => {
        try {
            if (editingBeerType && editingBeerType.id) {
                await apiService.put(`/api/beer-types/${editingBeerType.id}`, formData);
            } else {
                await apiService.post('/api/beer-types', formData);
            }
            setIsBeerModalOpen(false);
            loadLookups();
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateFacilityType = () => {
        setEditingFacilityType(null);
        setIsFacilityModalOpen(true);
    };

    const handleEditFacilityType = (item) => {
        setEditingFacilityType(item);
        setIsFacilityModalOpen(true);
    };

    const handleDeleteFacilityType = async (item) => {
        if (window.confirm(`Einrichtungsart "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/facility-types/${item.id}`);
                loadLookups();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFacilityTypeSubmit = async (formData) => {
        try {
            if (editingFacilityType && editingFacilityType.id) {
                await apiService.put(`/api/facility-types/${editingFacilityType.id}`, formData);
            } else {
                await apiService.post('/api/facility-types', formData);
            }
            setIsFacilityModalOpen(false);
            loadLookups();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <h2 style={{ color: '#1b4332', marginBottom: '2rem' }}>Kategorien & Lookups</h2>

            <div style={{ marginBottom: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#495057', margin: 0 }}>Biersorten</h3>
                    <button onClick={handleCreateBeerType} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                        + Sorte hinzufügen
                    </button>
                </div>
                <DataTable columns={beerTypeColumns} data={beerTypes} onEdit={handleEditBeerType} onDelete={handleDeleteBeerType} />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#495057', margin: 0 }}>Einrichtungen (Map Icons)</h3>
                    <button onClick={handleCreateFacilityType} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                        + Einrichtung hinzufügen
                    </button>
                </div>
                <DataTable columns={facilityTypeColumns} data={facilityTypes} onEdit={handleEditFacilityType} onDelete={handleDeleteFacilityType} />
            </div>

            <GenericFormModal isOpen={isBeerModalOpen} onClose={() => setIsBeerModalOpen(false)} onSubmit={handleBeerTypeSubmit} title={editingBeerType ? 'Biersorte bearbeiten' : 'Neue Biersorte'} fields={beerTypeFields} initialData={editingBeerType} />
            <GenericFormModal isOpen={isFacilityModalOpen} onClose={() => setIsFacilityModalOpen(false)} onSubmit={handleFacilityTypeSubmit} title={editingFacilityType ? 'Einrichtungsart bearbeiten' : 'Neue Einrichtungsart'} fields={facilityTypeFields} initialData={editingFacilityType} />
        </div>
    );
};

export default LookupManager;