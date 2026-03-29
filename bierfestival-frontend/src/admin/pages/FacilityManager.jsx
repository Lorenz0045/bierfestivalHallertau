import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const FacilityManager = () => {
    const [facilities, setFacilities] = useState([]);
    const [facilityTypes, setFacilityTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name / Bezeichnung' },
        { 
            key: 'facilityType', 
            label: 'Art der Einrichtung',
            render: (_, row) => row.facilityType?.name || '-'
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name / Bezeichnung', type: 'text', required: true },
        { 
            name: 'facilityTypeId', 
            label: 'Art der Einrichtung', 
            type: 'select', 
            options: facilityTypes.map(ft => ({ id: ft.id, name: ft.name })),
            required: true
        }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [facData, typesData] = await Promise.all([
                apiService.get('/api/facilities'),
                apiService.get('/api/facility-types')
            ]);
            setFacilities(facData);
            setFacilityTypes(typesData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

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
        if(window.confirm(`Einrichtung "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/facilities/${item.id}`);
                loadData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        const payload = {
            ...formData,
            facilityType: { id: parseInt(formData.facilityTypeId) }
        };

        try {
            if (editingItem && editingItem.id) {
                await apiService.put(`/api/facilities/${editingItem.id}`, payload);
            } else {
                await apiService.post('/api/facilities', payload);
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