import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const TABS = {
    BEER_TYPES: 'BEER_TYPES',
    FACILITY_TYPES: 'FACILITY_TYPES',
    GASTRONOMY_TYPES: 'GASTRONOMY_TYPES',
    CITIES: 'CITIES',
    DISTRICTS: 'DISTRICTS',
    SPONSOR_TIERS: 'SPONSOR_TIERS'
};

const LookupManager = () => {
    const { keycloakInstance } = useUser();
    const [activeTab, setActiveTab] = useState(TABS.BEER_TYPES);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Konfiguration der einzelnen Tabs
    const configs = {
        [TABS.BEER_TYPES]: {
            endpoint: '/api/beer-types',
            title: 'Biersorte',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' }
            ],
            fields: [
                { name: 'name', label: 'Name', type: 'text', required: true }
            ]
        },
        [TABS.FACILITY_TYPES]: {
            endpoint: '/api/facility-types',
            title: 'Einrichtungsart',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Einrichtungsart' },
                {
                    key: 'imgUrl',
                    label: 'Standard-Icon',
                    sortable: false,
                    render: (val) => val ? <img src={val} alt="Icon" style={{ height: '30px', borderRadius: '4px' }} /> : '-'
                }
            ],
            fields: [
                { name: 'name', label: 'Einrichtungsart', type: 'text', required: true },
                { name: 'imgUrl', label: 'Standard-Icon', type: 'image' }
            ]
        },
        [TABS.GASTRONOMY_TYPES]: {
            endpoint: '/api/gastronomy-types',
            title: 'Gastronomie-Kategorie',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Kategorie' }
            ],
            fields: [
                { name: 'name', label: 'Kategorie-Bezeichnung', type: 'text', required: true }
            ]
        },
        [TABS.CITIES]: {
            endpoint: '/api/cities',
            title: 'Ort',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Ort' }
            ],
            fields: [
                { name: 'name', label: 'Ortsname', type: 'text', required: true }
            ]
        },
        [TABS.DISTRICTS]: {
            endpoint: '/api/districts',
            title: 'Landkreis',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Landkreis' }
            ],
            fields: [
                { name: 'name', label: 'Landkreis-Bezeichnung', type: 'text', required: true }
            ]
        },
        [TABS.SPONSOR_TIERS]: {
            endpoint: '/api/sponsor-tiers',
            title: 'Sponsoren-Tier',
            columns: [
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Tier-Name' },
                { key: 'sortOrder', label: 'Sortierung' },
                {
                    key: 'imgUrl',
                    label: 'Icon',
                    sortable: false,
                    render: (val) => val ? <img src={val} alt="Icon" style={{ height: '30px', borderRadius: '4px' }} /> : '-'
                }
            ],
            fields: [
                { name: 'name', label: 'Tier-Name (z.B. Platin)', type: 'text', required: true },
                { name: 'sortOrder', label: 'Sortierung (z.B. 1 für höchste Prio)', type: 'number', required: true },
                { name: 'imgUrl', label: 'Tier Icon', type: 'image' }
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
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if (window.confirm(`${activeConfig.title} "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${activeConfig.endpoint}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
            } catch (error) {
                console.error(error);
                alert('Fehler beim Löschen. Eventuell wird dieser Eintrag noch in der Datenbank verwendet.');
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${activeConfig.endpoint}/${editingItem.id}`, 'PUT', formData, keycloakInstance.token);
            } else {
                await apiRequest(activeConfig.endpoint, 'POST', formData, keycloakInstance.token);
            }
            setIsModalOpen(false);
            loadData();
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
            {/* Tab-Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab(TABS.BEER_TYPES)} style={tabStyle(TABS.BEER_TYPES)}>Biersorten</button>
                <button onClick={() => setActiveTab(TABS.FACILITY_TYPES)} style={tabStyle(TABS.FACILITY_TYPES)}>Einrichtungsarten</button>
                <button onClick={() => setActiveTab(TABS.GASTRONOMY_TYPES)} style={tabStyle(TABS.GASTRONOMY_TYPES)}>Gastronomie-Kategorien</button>
                <button onClick={() => setActiveTab(TABS.CITIES)} style={tabStyle(TABS.CITIES)}>Orte</button>
                <button onClick={() => setActiveTab(TABS.DISTRICTS)} style={tabStyle(TABS.DISTRICTS)}>Landkreise</button>
                <button onClick={() => setActiveTab(TABS.SPONSOR_TIERS)} style={tabStyle(TABS.SPONSOR_TIERS)}>Sponsoren-Tiers</button>
            </div>

            {/* Header mit Neu-Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>{activeConfig.title} verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neu
                </button>
            </div>

            {/* Tabelle */}
            {loading ? <div>Lade Daten...</div> : (
                <DataTable columns={activeConfig.columns} data={data} onEdit={handleEdit} onDelete={handleDelete} />
            )}

            {/* Modal */}
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

export default LookupManager;