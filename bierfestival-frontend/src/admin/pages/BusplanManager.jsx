import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const TABS = {
    LINES: 'LINES',
    STOPS: 'STOPS',
    DEPARTURES: 'DEPARTURES'
};

const BusplanManager = () => {
    const { keycloakInstance } = useUser();
    const [activeTab, setActiveTab] = useState(TABS.LINES);
    const [data, setData] = useState([]);
    const [facilities, setFacilities] = useState([]);
    const [lines, setLines] = useState([]);
    const [stops, setStops] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Initial load for select options
    const loadDependencies = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        try {
            const [facs, lns, stps] = await Promise.all([
                apiRequest('/api/facilities', 'GET', null, keycloakInstance.token),
                apiRequest('/api/bus/lines', 'GET', null, keycloakInstance.token),
                apiRequest('/api/bus/stops', 'GET', null, keycloakInstance.token)
            ]);
            setFacilities(facs || []);
            setLines(lns || []);
            setStops(stps || []);
        } catch (error) {
            console.error("Fehler beim Laden der Abhängigkeiten:", error);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadDependencies();
    }, [loadDependencies]);

    const configs = {
        [TABS.LINES]: {
            endpoint: '/api/bus/lines',
            title: 'Buslinie',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'lineNumber', label: 'Linien-Nr' },
                { key: 'name', label: 'Name' },
                { key: 'priceEur', label: 'Preis (€)' }
            ],
            fields: [
                { name: 'lineNumber', label: 'Liniennummer', type: 'number', required: true },
                { name: 'name', label: 'Name', type: 'text', required: true },
                { name: 'routeDescription', label: 'Routenbeschreibung', type: 'textarea' },
                { name: 'priceEur', label: 'Preis (€)', type: 'text' }
            ]
        },
        [TABS.STOPS]: {
            endpoint: '/api/bus/stops',
            title: 'Haltestelle',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'facilityId', label: 'Einrichtung (ID)', render: (_, row) => row.facilityId ? row.facilityId : '-' }
            ],
            fields: [
                { name: 'name', label: 'Haltestellenname', type: 'text', required: true },
                { name: 'facilityId', label: 'Verknüpfte Einrichtung', type: 'select', options: facilities.map(f => ({ id: f.id, name: f.name })) }
            ]
        },
        [TABS.DEPARTURES]: {
            endpoint: '/api/bus/departures',
            title: 'Abfahrt',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'busLineId', label: 'Buslinie', render: (val) => lines.find(l => l.id === val)?.name || val },
                { key: 'busStopName', label: 'Haltestelle' },
                { key: 'direction', label: 'Richtung' },
                { key: 'departureTime', label: 'Abfahrtszeit', render: (val) => val ? new Date(val).toLocaleString('de-DE') : '-' }
            ],
            fields: [
                { name: 'busLineId', label: 'Buslinie', type: 'select', required: true, options: lines.map(l => ({ id: l.id, name: l.name })) },
                { name: 'busStopId', label: 'Haltestelle', type: 'select', required: true, options: stops.map(s => ({ id: s.id, name: s.name })) },
                { name: 'direction', label: 'Richtung', type: 'select', required: true, options: [{ id: 'HINFAHRT', name: 'Hinfahrt' }, { id: 'RUECKFAHRT', name: 'Rückfahrt' }] },
                { name: 'departureTime', label: 'Abfahrtszeit', type: 'datetime-local', required: true }
            ]
        }
    };

    const activeConfig = configs[activeTab];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            const result = await apiRequest(activeConfig.endpoint, 'GET', null, keycloakInstance.token);
            setData(result || []);
        } catch (error) {
            console.error(`Fehler beim Laden von ${activeConfig.title}:`, error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, keycloakInstance]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleCreateNew = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item) => {
        let itemForEdit = { ...item };
        
        // Ensure correct formats for datetime fields
        if (activeTab === TABS.DEPARTURES && itemForEdit.departureTime) {
            // Cut off the "Z" or offset to fit datetime-local
            itemForEdit.departureTime = itemForEdit.departureTime.substring(0, 16);
        }
        
        setEditingItem(itemForEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if (window.confirm(`${activeConfig.title} wirklich löschen?`)) {
            try {
                await apiRequest(`${activeConfig.endpoint}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
                loadDependencies();
            } catch (error) {
                console.error(error);
                alert('Fehler beim Löschen. Eventuell wird dieser Eintrag noch verwendet.');
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        
        // Map payloads to match backend expectations (RefId pattern)
        const payload = { ...formData };
        
        if (activeTab === TABS.STOPS) {
            payload.facility = formData.facilityId ? { id: parseInt(formData.facilityId) } : null;
        } else if (activeTab === TABS.DEPARTURES) {
            payload.busLine = formData.busLineId ? { id: parseInt(formData.busLineId) } : null;
            payload.busStop = formData.busStopId ? { id: parseInt(formData.busStopId) } : null;
            // Append Z if missing for offset parsing, or timezone offset depending on how backend reads
            // Backend uses OffsetDateTime.parse(dto.departureTime)
            if (payload.departureTime && payload.departureTime.length === 16) {
                payload.departureTime = payload.departureTime + ':00+02:00'; // Assuming CET/CEST for simplicity, or standard "Z"
            }
        }

        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${activeConfig.endpoint}/${editingItem.id}`, 'PUT', payload, keycloakInstance.token);
            } else {
                await apiRequest(activeConfig.endpoint, 'POST', payload, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
            loadDependencies();
        } catch (error) {
            console.error(error);
            alert('Fehler beim Speichern.');
        }
    };

    const tabStyle = (tab) => ({
        background: 'none',
        border: 'none',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        fontWeight: activeTab === tab ? 'bold' : 'normal',
        borderBottom: activeTab === tab ? '3px solid #2d6a4f' : 'none'
    });

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab(TABS.LINES)} style={tabStyle(TABS.LINES)}>Buslinien</button>
                <button onClick={() => setActiveTab(TABS.STOPS)} style={tabStyle(TABS.STOPS)}>Haltestellen</button>
                <button onClick={() => setActiveTab(TABS.DEPARTURES)} style={tabStyle(TABS.DEPARTURES)}>Abfahrten</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>{activeConfig.title} verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neu
                </button>
            </div>

            {loading ? <div>Lade Daten...</div> : (
                <DataTable columns={activeConfig.columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
            )}

            <GenericFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                title={editingItem ? `${activeConfig.title} bearbeiten` : `Neue ${activeConfig.title} anlegen`}
                fields={activeConfig.fields}
                initialData={editingItem}
            />
        </div>
    );
};

export default BusplanManager;
