import { useState, useEffect } from 'react';
import apiRequest from '../../services/apiService';
import styles from './GenericFormModal.module.css';

const TavernBeerModal = ({ isOpen, onClose, tavern, allBeers, keycloakToken, onSaveSuccess }) => {
    const [assignedBeers, setAssignedBeers] = useState([]);
    const [selectedBeerId, setSelectedBeerId] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && tavern) {
            // Die bereits zugeordneten Biere initial laden und sortieren
            const sortedBeers = [...(tavern.beers || [])].sort((a, b) => a.sortOrder - b.sortOrder);
            setAssignedBeers(sortedBeers);
            setSelectedBeerId('');
        }
    }, [isOpen, tavern]);

    if (!isOpen || !tavern) return null;

    // Filtere die Biere, die noch nicht zugeordnet sind, für das Dropdown
    const availableBeers = allBeers.filter(b => !assignedBeers.find(ab => ab.beerId === b.id));

    const handleAddBeer = () => {
        if (!selectedBeerId) return;
        const beerToAdd = allBeers.find(b => b.id === parseInt(selectedBeerId));
        if (beerToAdd) {
            // Konvertiere das Backend-Bier-Objekt ins Quickinfo-Format
            const newAssigned = {
                beerId: beerToAdd.id,
                name: beerToAdd.name,
                breweryName: beerToAdd.brewery?.name || '',
                typeName: beerToAdd.beerType?.name || '',
                alcoholPercentage: beerToAdd.alcoholPercentage
            };
            setAssignedBeers([...assignedBeers, newAssigned]);
            setSelectedBeerId('');
        }
    };

    const handleRemoveBeer = (beerId) => {
        setAssignedBeers(assignedBeers.filter(b => b.beerId !== beerId));
    };

    // --- Native HTML5 Drag & Drop Logik ---
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
        e.preventDefault(); // Nötig, um Drop zu erlauben
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Wir senden nur ein flaches Array der IDs in der korrekten Reihenfolge an das Backend
        const payload = assignedBeers.map(b => b.beerId);
        try {
            await apiRequest(`/api/taverns/${tavern.id}/beers`, 'PUT', payload, keycloakToken);
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
            <div className={styles.modal} style={{ maxWidth: '600px' }}>
                <div className={styles.header}>
                    <h2>Biere für {tavern.name}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                
                <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Bier hinzufügen:</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select 
                            className={styles.input} 
                            value={selectedBeerId} 
                            onChange={(e) => setSelectedBeerId(e.target.value)}
                        >
                            <option value="">-- Bier auswählen --</option>
                            {availableBeers.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.brewery?.name} - {b.name} ({b.beerType?.name})
                                </option>
                            ))}
                        </select>
                        <button type="button" onClick={handleAddBeer} style={{ background: '#2d6a4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                            Hinzufügen
                        </button>
                    </div>
                </div>

                <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                        <i>Drag & Drop (am ☰ Symbol) um die Reihenfolge zu ändern.</i>
                    </p>
                    {assignedBeers.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Noch keine Biere zugeordnet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
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
                                        borderRadius: '4px', marginBottom: '0.5rem', cursor: 'grab'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '1.2rem', color: '#94a3b8', cursor: 'grab' }}>☰</span>
                                        <div>
                                            <strong style={{ display: 'block' }}>{beer.name}</strong>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {beer.breweryName} | {beer.typeName} | {beer.alcoholPercentage}% Alk.
                                            </span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveBeer(beer.beerId)} 
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem' }}
                                        title="Entfernen"
                                    >
                                        &times;
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className={styles.actions} style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <button type="button" onClick={onClose} className={styles.cancelBtn}>Abbrechen</button>
                    <button type="button" onClick={handleSave} disabled={isSaving} className={styles.submitBtn}>
                        {isSaving ? 'Speichert...' : 'Reihenfolge & Biere speichern'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TavernBeerModal;