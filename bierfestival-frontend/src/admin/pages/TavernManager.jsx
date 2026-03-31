import { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import GenericFormModal from '../components/GenericFormModal';
import TavernBeerModal from '../components/TavernBeerModal'; // NEU
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';

const API_TAVERNS = '/api/taverns';
const API_BEERS = '/api/beers'; // NEU

const TavernManager = () => {
    const { keycloakInstance } = useUser();
    const [taverns, setTaverns] = useState([]);
    const [allBeers, setAllBeers] = useState([]); // NEU
    const [loading, setLoading] = useState(true);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isBeerModalOpen, setIsBeerModalOpen] = useState(false); // NEU
    
    const [editingItem, setEditingItem] = useState(null);

    const columns = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { 
            key: 'imgUrl', 
            label: 'Icon', 
            sortable: false, 
            render: (val) => val ? <img src={val} alt="Schenke" style={{ height: '30px', borderRadius: '4px' }} /> : '-' 
        },
        // NEUE SPALTE FÜR BIER-VERWALTUNG
        {
            key: 'beers',
            label: 'Biersortiment',
            sortable: false,
            render: (beers, row) => (
                <button 
                    onClick={() => { setEditingItem(row); setIsBeerModalOpen(true); }}
                    style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                    {beers && beers.length > 0 ? `${beers.length} Biere zugeordnet` : 'Biere verwalten'}
                </button>
            )
        }
    ];

    const formFields = [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'imgUrl', label: 'Icon', type: 'image' }
    ];

    const loadData = useCallback(async () => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            // Lade parallel Schenken UND alle Biere
            const [tavernsData, beersData] = await Promise.all([
                apiRequest(API_TAVERNS, 'GET', null, keycloakInstance.token),
                apiRequest(API_BEERS, 'GET', null, keycloakInstance.token)
            ]);
            setTaverns(tavernsData || []);
            setAllBeers(beersData || []);
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
        setIsFormModalOpen(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (item) => {
        if (!keycloakInstance?.token) return;
        if(window.confirm(`Schenke "${item.name}" wirklich löschen?`)) {
            try {
                await apiRequest(`${API_TAVERNS}/${item.id}`, 'DELETE', null, keycloakInstance.token);
                loadData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        if (!keycloakInstance?.token) return;
        try {
            if (editingItem && editingItem.id) {
                await apiRequest(`${API_TAVERNS}/${editingItem.id}`, 'PUT', formData, keycloakInstance.token);
            } else {
                await apiRequest(API_TAVERNS, 'POST', formData, keycloakInstance.token);
            }
            setIsFormModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div>Lade Daten...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ color: '#1b4332', margin: 0 }}>Schenken verwalten</h2>
                <button onClick={handleCreateNew} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Neue Schenke
                </button>
            </div>
            
            <DataTable columns={columns} data={taverns} onEdit={handleEdit} onDelete={handleDelete} />
            
            {/* Modal für Basisdaten (Name, Bild) */}
            <GenericFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                onSubmit={handleFormSubmit} 
                title={editingItem ? 'Schenke bearbeiten' : 'Neue Schenke anlegen'} 
                fields={formFields} 
                initialData={editingItem} 
            />

            {/* Neues Modal für die Bier-Zuordnung per Drag & Drop */}
            <TavernBeerModal 
                isOpen={isBeerModalOpen}
                onClose={() => setIsBeerModalOpen(false)}
                tavern={editingItem}
                allBeers={allBeers}
                keycloakToken={keycloakInstance.token}
                onSaveSuccess={loadData} // Lädt die Tabelle neu, damit die aktualisierte Anzahl sichtbar ist
            />
        </div>
    );
};

export default TavernManager;