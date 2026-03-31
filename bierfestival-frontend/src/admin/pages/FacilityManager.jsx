import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_FACILITIES = '/api/facilities';
const API_FACILITY_TYPES = '/api/facility-types';

const FacilityManager = () => {
    const { keycloakInstance } = useUser();
    const [facilities, setFacilities] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name / Bezeichnung' },
        { key: 'facilityType', label: 'Art der Einrichtung', render: (_, row) => row.facilityType?.name || '-' },
        { 
            key: 'imgUrl', 
            label: 'Bild / Icon', 
            sortable: false,
            render: (_, row) => {
                // Fallback-Logik: Nimm das eigene Bild, sonst das der Art
                const imgSrc = row.imgUrl || row.facilityType?.imgUrl;
                return imgSrc ? <img src={imgSrc} alt="Facility" style={{ height: '30px', borderRadius: '4px' }} /> : '-';
            }
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name / Bezeichnung', type: 'text', required: true },
        { name: 'facilityTypeId', label: 'Art der Einrichtung', type: 'select', options: facilityTypes.map(ft => ({ id: ft.id, name: ft.name })), required: true },
        { name: 'imgUrl', label: 'Spezifisches Bild (Überschreibt Standard)', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [facData, typesData] = await Promise.all([
                apiRequest(API_FACILITIES, 'GET', null, keycloakInstance.token),
                apiRequest(API_FACILITY_TYPES, 'GET', null, keycloakInstance.token)
            ]);
            setFacilities(facData || []);
            setFacilityTypes(typesData || []);
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
            facilityTypeId: item.facilityType?.id
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Einrichtung "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_FACILITIES}/${item.id}`, 'DELETE', null, keycloakInstance.token);
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
            facilityType: { id: parseInt(formData.facilityTypeId) }
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_FACILITIES}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_FACILITIES, 'POST', payload, keycloakInstance.token);
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
                <h2 style={{ color: '#1b4332', margin: 0 }}>Einrichtungen verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Einrichtung
                </button>
            </div>
            <DataTable columns={columns} data={facilities} onEdit={handleEdit} onDelete={handleDelete} />
            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Einrichtung bearbeiten' : 'Neue Einrichtung anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default FacilityManager;