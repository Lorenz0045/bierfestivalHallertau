import { useState, useEffect, useCallback } from 'react';
import { Marker, Popup, useMapEvents } from 'react-leaflet';
import BaseMap from '../../components/map/BaseMap';
import { createPoiIcon } from '../../components/map/IconFactory';
import { fetchCachedData, clearCache } from '../../services/cacheService';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';
import styles from './AdminMapManager.module.css';

// Die 4 Endpunkte, die wir verwalten
const POI_ENDPOINTS = [
    { type: 'tavern', url: '/api/taverns', label: 'Schenken' },
    { type: 'stage', url: '/api/stages', label: 'Bühnen' },
    { type: 'gastronomy', url: '/api/gastronomies', label: 'Gastronomie' },
    { type: 'facility', url: '/api/facilities', label: 'Einrichtungen' }
];

// Hilfskomponente um Map-Klicks abzufangen
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click: (e) => onMapClick(e.latlng)
    });
    return null;
};

const AdminMapManager = () => {
    const { keycloakInstance } = useUser();
    const [pois, setPois] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeItemToPlace, setActiveItemToPlace] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async (forceRefresh = false) => {
        if (!keycloakInstance?.token) return;
        setLoading(true);
        try {
            if (forceRefresh) clearCache();

            let allPois = [];
            // Lade alle 4 Kategorien parallel
            await Promise.all(POI_ENDPOINTS.map(async (ep) => {
                const data = await fetchCachedData(ep.url, keycloakInstance.token, forceRefresh);
                if (data) {
                    // Mappe die Daten in ein einheitliches Format
                    const mappedData = data.map(item => ({
                        ...item,
                        type: ep.type, // Identifikator für Icon und API-Put
                        isDirty: false // Flag, ob Position geändert wurde
                    }));
                    allPois = [...allPois, ...mappedData];
                }
            }));
            setPois(allPois);
        } catch (error) {
            console.error("Fehler beim Laden der POIs:", error);
        } finally {
            setLoading(false);
            setActiveItemToPlace(null);
        }
    }, [keycloakInstance]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // 1. Klick in der Liste: Bereite das Objekt fürs Setzen vor
    const handleSelectForPlacement = (poi) => {
        setActiveItemToPlace(poi);
    };

    // 2. Klick auf die Karte: Setze die Koordinaten
    const handleMapClick = (latlng) => {
        if (!activeItemToPlace) return;

        setPois(prev => prev.map(p => 
            (p.id === activeItemToPlace.id && p.type === activeItemToPlace.type)
                ? { ...p, lat: latlng.lat, lon: latlng.lng, isDirty: true }
                : p
        ));
        setActiveItemToPlace(null); // Modus beenden
    };

    // 3. Drag & Drop auf der Karte 
    const handleMarkerDragEnd = (e, poi) => {
        const newPos = e.target.getLatLng();
        setPois(prev => prev.map(p => 
            (p.id === poi.id && p.type === poi.type)
                ? { ...p, lat: newPos.lat, lon: newPos.lng, isDirty: true }
                : p
        ));
    };

    // Vom Spielfeld nehmen (lat/lon nullen)
    const handleRemoveFromMap = (poi) => {
        setPois(prev => prev.map(p => 
            (p.id === poi.id && p.type === poi.type)
                ? { ...p, lat: null, lon: null, isDirty: true }
                : p
        ));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const dirtyPois = pois.filter(p => p.isDirty);
        
        try {
            for (const poi of dirtyPois) {
                // Finde die richtige API URL für den Typ
                const ep = POI_ENDPOINTS.find(e => e.type === poi.type);
                
                // Wir müssen das Format bereinigen (isDirty und type gehören nicht ins Backend)
                const payload = { ...poi };
                delete payload.isDirty;
                delete payload.type;
                
                // Spezialfall Gastronomie/Facility: Relation IDs korrekt setzen
                if (payload.typeId) payload.type = { id: payload.typeId }; 
                if (payload.facilityType && payload.facilityType.id) {
                     payload.facilityType = { id: payload.facilityType.id };
                } else if (payload.facilityTypeId) {
                     payload.facilityType = { id: payload.facilityTypeId };
                }

                await apiRequest(`${ep.url}/${poi.id}`, 'PUT', payload, keycloakInstance.token);
            }
            alert(`${dirtyPois.length} Positionen erfolgreich gespeichert!`);
            loadData(true); // Cache erneuern, damit alles frisch ist
        } catch (error) {
            console.error("Speicherfehler:", error);
            alert("Fehler beim Speichern der Positionen.");
        } finally {
            setIsSaving(false);
        }
    };

    const unplacedPois = pois.filter(p => !p.lat || !p.lon);
    const displayPois = unplacedPois.filter(p => filterType === 'all' || p.type === filterType);
    const placedPois = pois.filter(p => p.lat && p.lon);
    const dirtyCount = pois.filter(p => p.isDirty).length;

    return (
        <div className={styles.container}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h2>Karte bearbeiten</h2>
                    <button 
                        onClick={() => loadData(true)} 
                        className={styles.refreshBtn}
                        title="Daten neu vom Server laden"
                    >
                        🔄 Refresh
                    </button>
                </div>

                <div className={styles.saveArea}>
                    <button 
                        onClick={handleSave} 
                        disabled={dirtyCount === 0 || isSaving}
                        className={styles.saveBtn}
                    >
                        {isSaving ? 'Speichert...' : `💾 Speichern (${dirtyCount} ungespeichert)`}
                    </button>
                </div>

                <div className={styles.filterGroup}>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.select}>
                        <option value="all">Alle Typen</option>
                        {POI_ENDPOINTS.map(ep => <option key={ep.type} value={ep.type}>{ep.label}</option>)}
                    </select>
                </div>

                <div className={styles.unplacedList}>
                    <h3 className={styles.listTitle}>Noch nicht platziert ({displayPois.length})</h3>
                    {loading ? <p>Lade...</p> : (
                        <ul className={styles.list}>
                            {displayPois.map(poi => (
                                <li 
                                    key={`${poi.type}-${poi.id}`} 
                                    className={`${styles.listItem} ${(activeItemToPlace?.id === poi.id && activeItemToPlace?.type === poi.type) ? styles.activeItem : ''}`}
                                >
                                    <div>
                                        <strong>{poi.name}</strong>
                                        <span className={styles.itemMeta}>{POI_ENDPOINTS.find(e => e.type === poi.type)?.label}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleSelectForPlacement(poi)}
                                        className={styles.placeBtn}
                                    >
                                        📍 Platzieren
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className={`${styles.mapArea} ${activeItemToPlace ? styles.mapPlacementMode : ''}`}>
                {activeItemToPlace && (
                    <div className={styles.placementOverlay}>
                        Klicke auf die Karte, um <b>{activeItemToPlace.name}</b> zu platzieren.
                        <button onClick={() => setActiveItemToPlace(null)} className={styles.cancelPlaceBtn}>Abbrechen</button>
                    </div>
                )}
                
                <BaseMap 
                    className={styles.map}  
                >
                    <MapClickHandler onMapClick={handleMapClick} />
                    
                    {placedPois.map(poi => (
                        <Marker 
                            key={`${poi.type}-${poi.id}`}
                            position={[poi.lat, poi.lon]}
                            icon={createPoiIcon(poi)}
                            draggable={true}
                            eventHandlers={{
                                dragend: (e) => handleMarkerDragEnd(e, poi)
                            }}
                        >
                            <Popup>
                                <div style={{ textAlign: 'center' }}>
                                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>{poi.name}</strong>
                                    <span style={{ color: '#64748b' }}>{POI_ENDPOINTS.find(e => e.type === poi.type)?.label}</span>
                                    <br/><br/>
                                    <button 
                                        onClick={() => handleRemoveFromMap(poi)}
                                        style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Von Karte entfernen
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </BaseMap>
            </div>
        </div>
    );
};

export default AdminMapManager;