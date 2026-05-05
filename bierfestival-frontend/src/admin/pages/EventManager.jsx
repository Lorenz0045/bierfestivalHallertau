import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_EVENTS = '/api/events';
const API_STAGES = '/api/stages';

const EventManager = () => {
    const { keycloakInstance } = useUser();
    const [events, setEvents] = useState([]);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'dayName', label: 'Tag' },
        { key: 'startTime', label: 'Startzeit', render: (val) => val ? val.substring(11, 16) : '-' },
        { key: 'endTime', label: 'Endzeit', render: (val) => val ? val.substring(11, 16) : '-' },
        { key: 'stage', label: 'Bühne', render: (_, row) => row.stage?.name || '-' }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'dayName', label: 'Tag (z.B. Freitag)', type: 'text' },
        { name: 'startTime', label: 'Startzeit', type: 'datetime-local', required: true },
        { name: 'endTime', label: 'Endzeit', type: 'datetime-local', required: true },
        { name: 'description', label: 'Beschreibung', type: 'text' },
        { name: 'stageId', label: 'Bühne', type: 'select', options: stages.map(s => ({ id: s.id, name: s.name })), required: true }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const [eventsData, stagesData] = await Promise.all([
                apiRequest(API_EVENTS, 'GET', null, keycloakInstance.token),
                apiRequest(API_STAGES, 'GET', null, keycloakInstance.token)
            ]);
            setEvents(eventsData || []);
            setStages(stagesData || []);
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
            stageId: item.stage?.id,
            // LocalDateTime kommt als ISO-String ohne Timezone (z.B. "2026-06-12T14:30:00")
            // -> direkt als Substring verwenden statt via new Date(), um Timezone-Shifts zu vermeiden
            startTime: item.startTime ? item.startTime.substring(0, 16) : '',
            endTime: item.endTime ? item.endTime.substring(0, 16) : ''
        };
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Event "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_EVENTS}/${item.id}`, 'DELETE', null, keycloakInstance.token);
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
            stage: { id: parseInt(formData.stageId) }
        };

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_EVENTS}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(API_EVENTS, 'POST', payload, keycloakInstance.token);
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