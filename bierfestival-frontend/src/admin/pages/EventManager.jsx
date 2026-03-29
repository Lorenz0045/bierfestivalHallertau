import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiService from '../../services/apiService';

const EventManager = () => {
    const [events, setEvents] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Event Name' },
        { key: 'dayName', label: 'Tag' },
        { 
            key: 'startTime', 
            label: 'Startzeit',
            render: (val) => new Date(val).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
        },
        { 
            key: 'stage', 
            label: 'Bühne',
            render: (_, row) => row.stage?.name || '-'
        }
    ];

    const formFields = [
        { name: 'name', label: 'Event Name', type: 'text', required: true },
        { name: 'dayName', label: 'Tag (z.B. Freitag)', type: 'text' },
        { name: 'startTime', label: 'Startzeit', type: 'datetime-local', required: true },
        { name: 'endTime', label: 'Endzeit', type: 'datetime-local', required: true },
        { name: 'description', label: 'Beschreibung', type: 'text' },
        { 
            name: 'stageId', 
            label: 'Bühne', 
            type: 'select', 
            options: stages.map(s => ({ id: s.id, name: s.name })),
            required: true
        }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsData, stagesData] = await Promise.all([
                apiService.get('/api/events'),
                apiService.get('/api/stages')
            ]);
            setEvents(eventsData);
            setStages(stagesData);
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
            stageId: item.stage?.id,
            startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
            endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if(window.confirm(`Event "${item.name}" wirklich löschen?`)) {
            try {
                await apiService.delete(`/api/events/${item.id}`);
                loadData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        const payload = {
            ...formData,
            stage: { id: parseInt(formData.stageId) }
        };

        try {
            if (editingItem && editingItem.id) {
                await apiService.put(`/api/events/${editingItem.id}`, payload);
            } else {
                await apiService.post('/api/events', payload);
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
                <h2 style={{ color: '#1b4332', margin: 0 }}>Programm verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neues Event
                </button>
            </div>
            
            <DataTable columns={columns} data={events} onEdit={handleEdit} onDelete={handleDelete} />

            <GenericFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} title={editingItem ? 'Event bearbeiten' : 'Neues Event anlegen'} fields={formFields} initialData={editingItem} />
        </div>
    );
};

export default EventManager;