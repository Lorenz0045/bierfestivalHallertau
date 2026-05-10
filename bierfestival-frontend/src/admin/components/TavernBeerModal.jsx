import { useState, useEffect } from 'react';
import styles from './GenericFormModal.module.css';

const TavernBeerModal = ({ isOpen, onClose, tavern, allBeers, keycloakToken, onSaveSuccess }) => {
    const [assignedBeers, setAssignedBeers] = useState([]);
    const [breweryFilter, setBreweryFilter] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && tavern) {
            const sortedBeers = [...(tavern.beers || [])].sort((a, b) => a.sortOrder - b.sortOrder);
            setAssignedBeers(sortedBeers);
            setBreweryFilter('');
        }
    }, [isOpen, tavern]);

    if (!isOpen || !tavern) return null;

    // --- Filter Logik für linke Seite ---
    const availableBeers = allBeers.filter(b => !assignedBeers.find(ab => ab.beerId === b.id));
    const filteredAvailableBeers = breweryFilter 
        ? availableBeers.filter(b => b.brewery?.name === breweryFilter)
        : availableBeers;

    // Extrahiere alle einzigartigen Brauereien für das Dropdown
    const uniqueBreweries = [...new Set(allBeers.map(b => b.brewery?.name).filter(Boolean))].sort();

    const handleAddBeer = (beerToAdd) => {
        const newAssigned = {
            beerId: beerToAdd.id,
            name: beerToAdd.name,
            breweryName: beerToAdd.brewery?.name || '',
            typeName: beerToAdd.beerType?.name || '',
            alcoholPercentage: beerToAdd.alcoholPercentage,
            isNonAlcoholic: beerToAdd.isNonAlcoholic
        };
        setAssignedBeers([...assignedBeers, newAssigned]);
    };

    const handleRemoveBeer = (beerId) => {
        setAssignedBeers(assignedBeers.filter(b => b.beerId !== beerId));
    };

    // --- Automatische Sortierempfehlung ---
    const handleAutoSort = () => {
        const sorted = [...assignedBeers].sort((a, b) => {
            // 1. "Festivalbier" immer nach ganz oben
            const isAFestival = a.name.toLowerCase().includes('festivalbier');
            const isBFestival = b.name.toLowerCase().includes('festivalbier');
            
            if (isAFestival && !isBFestival) return -1;
            if (!isAFestival && isBFestival) return 1;
            
            // 2. Danach alphabetisch nach Brauerei sortieren
            const brewA = a.breweryName || '';
            const brewB = b.breweryName || '';
            if (brewA < brewB) return -1;
            if (brewA > brewB) return 1;
            
            // 3. Fallback: Alphabetisch nach Biername
            return a.name.localeCompare(b.name);
        });
        setAssignedBeers(sorted);
    };

    // --- Drag & Drop Logik ---
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('dragIndex', index);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'), 10);
        if (dragIndex === dropIndex) return;

        const updatedBeers = [...assignedBeers];
        const [draggedItem] = updatedBeers.splice(dragIndex, 1);
        updatedBeers.splice(dropIndex, 0, draggedItem);
        setAssignedBeers(updatedBeers);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // --- Speichern (mit nativem Fetch zur Umgehung des leeren JSON-Fehlers) ---
    const handleSave = async () => {
        setIsSaving(true);
        const payload = assignedBeers.map(b => b.beerId);
        
        try {
            const response = await fetch(`/api/taverns/${tavern.id}/beers`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${keycloakToken}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Wir parsen hier bewusst KEIN JSON, da Quarkus bei Erfolg leer antwortet.
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error("Fehler beim Speichern der Biere:", error);
            alert("Fehler beim Speichern der Zuordnung.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: '1000px', width: '90%' }}>
                <div className={styles.header}>
                    <h2>Biersortiment verwalten: {tavern.name}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', padding: '1.5rem', height: '600px' }}>
                    
                    {/* LINKE SPALTE: Verfügbare Biere */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', borderRight: '2px solid #e2e8f0', paddingRight: '2rem' }}>
                        <h3 style={{ marginTop: 0, color: '#1b4332' }}>Verfügbare Biere</h3>
                        
                        <select 
                            className={styles.input} 
                            style={{ marginBottom: '1rem' }}
                            value={breweryFilter} 
                            onChange={(e) => setBreweryFilter(e.target.value)}
                        >
                            <option value="">-- Alle Brauereien --</option>
                            {uniqueBreweries.map(brewery => (
                                <option key={brewery} value={brewery}>{brewery}</option>
                            ))}
                        </select>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {filteredAvailableBeers.length === 0 ? (
                                <p style={{ color: '#94a3b8' }}>Keine weiteren Biere verfügbar.</p>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {filteredAvailableBeers.map(b => (
                                        <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                                            <div>
                                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{b.name}</strong>
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{b.brewery?.name} | {b.beerType?.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleAddBeer(b)} 
                                                style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                                +
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* RECHTE SPALTE: Zugeordnete Biere (Drag & Drop) */}
                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, color: '#1b4332' }}>Im Sortiment ({assignedBeers.length})</h3>
                            <button 
                                onClick={handleAutoSort} 
                                title="Festivalbier nach oben, dann nach Brauerei sortieren"
                                style={{ background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                🪄 Auto-Sortierung
                            </button>
                        </div>

                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                            {assignedBeers.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8' }}>
                                    Biere von links hierher hinzufügen.
                                </div>
                            ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {assignedBeers.map((beer, index) => (
                                        <li 
                                            key={beer.beerId}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragOver={handleDragOver}
                                            style={{ 
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '0.75rem', background: 'white', border: '1px solid #cbd5e1', 
                                                borderRadius: '4px', cursor: 'grab', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                {/* Große Platznummer & Drag-Anfasser */}
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8' }}>
                                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1b4332' }}>#{index + 1}</span>
                                                    <span style={{ fontSize: '1rem' }}>☰</span>
                                                </div>
                                                
                                                <div>
                                                    <strong style={{ display: 'block', fontSize: '1rem' }}>{beer.name}</strong>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        {beer.breweryName} | {beer.typeName} | {beer.isNonAlcoholic ? '< 0,5%' : `${beer.alcoholPercentage}%`} Alk.
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveBeer(beer.beerId)} 
                                                style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                                                title="Entfernen"
                                            >
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>

                <div className={styles.actions} style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button type="button" onClick={onClose} className={styles.cancelBtn}>Abbrechen</button>
                    <button type="button" onClick={handleSave} disabled={isSaving} className={styles.submitBtn}>
                        {isSaving ? 'Speichert...' : 'Zusammenstellung & Reihenfolge speichern'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TavernBeerModal;