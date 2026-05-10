import { useState, useEffect, useRef } from 'react';
import { apiUploadFile } from '../../services/apiService';
import apiRequest from '../../services/apiService';
import { useUser } from '../contexts/UserContext';
import styles from './GenericFormModal.module.css';

const GenericFormModal = ({ isOpen, onClose, onSubmit, title, fields, initialData, onLookupCreated }) => {
    const { keycloakInstance } = useUser();
    const [formData, setFormData] = useState({});
    const [uploadingField, setUploadingField] = useState(null);
    // State for inline lookup creation
    const [addingLookupField, setAddingLookupField] = useState(null);
    const [newLookupName, setNewLookupName] = useState('');
    const [lookupCreating, setLookupCreating] = useState(false);
    // Search state for select fields
    const [selectSearches, setSelectSearches] = useState({});

    useEffect(() => {
        if (isOpen) {
            const defaultData = {};
            fields.forEach(field => {
                if (initialData && initialData[field.name] !== undefined) {
                    defaultData[field.name] = initialData[field.name];
                } else {
                    defaultData[field.name] = field.type === 'checkbox' ? false : '';
                }
            });
            setFormData(defaultData);
            setSelectSearches({});
            setAddingLookupField(null);
            setNewLookupName('');
        }
    }, [isOpen, initialData, fields]);

    if (!isOpen) return null;

    const handleChange = (e, field) => {
        const value = field.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field.name]: value }));
    };

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file || !keycloakInstance?.token) return;

        setUploadingField(field.name);
        try {
            // Sendet die Datei an den neuen Endpunkt
            const response = await apiUploadFile('/api/admin/uploads/image', file, 'poi-images', keycloakInstance.token);
            // Speichert den zurückgegebenen Pfad (z.B. /uploads/poi-images/xyz.jpg) im Formular
            setFormData(prev => ({ ...prev, [field.name]: response.filePath }));
        } catch (error) {
            console.error("Upload Fehler:", error);
            alert("Fehler beim Hochladen des Bildes.");
        } finally {
            setUploadingField(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const handleCreateLookup = async (field) => {
        if (!newLookupName.trim() || !keycloakInstance?.token || !field.lookupEndpoint) return;
        setLookupCreating(true);
        try {
            const result = await apiRequest(field.lookupEndpoint, 'POST', { name: newLookupName.trim() }, keycloakInstance.token);
            // Notify parent to refresh lookup data
            if (onLookupCreated) {
                onLookupCreated(field.name, result);
            }
            // Auto-select the newly created entry
            setFormData(prev => ({ ...prev, [field.name]: result.id }));
            setNewLookupName('');
            setAddingLookupField(null);
        } catch (error) {
            console.error("Lookup-Erstellung fehlgeschlagen:", error);
            alert("Fehler: Eintrag konnte nicht erstellt werden. Existiert er evtl. bereits?");
        } finally {
            setLookupCreating(false);
        }
    };

    const isFieldDisabled = (field) => {
        if (!field.disabledWhen) return false;
        const { field: watchField, value: watchValue } = field.disabledWhen;
        return formData[watchField] === watchValue;
    };

    const getFilteredOptions = (field) => {
        const search = (selectSearches[field.name] || '').toLowerCase();
        if (!search) return field.options || [];
        return (field.options || []).filter(opt => opt.name.toLowerCase().includes(search));
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {fields.map(field => {
                        const disabled = isFieldDisabled(field);
                        return (
                            <div key={field.name} className={styles.formGroup}>
                                <label htmlFor={field.name}>{field.label}</label>

                                {field.type === 'checkbox' ? (
                                    <input
                                        type="checkbox"
                                        id={field.name}
                                        checked={!!formData[field.name]}
                                        onChange={(e) => handleChange(e, field)}
                                        className={styles.checkbox}
                                    />
                                ) : field.type === 'select' ? (
                                    <div className={styles.selectWrapper}>
                                        <div className={styles.selectRow}>
                                            <div className={styles.selectContainer}>
                                                {/* Search input above select */}
                                                {(field.options || []).length > 5 && (
                                                    <input
                                                        type="text"
                                                        placeholder="Suche..."
                                                        value={selectSearches[field.name] || ''}
                                                        onChange={(e) => setSelectSearches(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                        className={styles.selectSearch}
                                                    />
                                                )}
                                                <select
                                                    id={field.name}
                                                    value={formData[field.name] || ''}
                                                    onChange={(e) => handleChange(e, field)}
                                                    required={field.required}
                                                    disabled={disabled}
                                                    className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
                                                >
                                                    <option value="">Bitte wählen...</option>
                                                    {getFilteredOptions(field).map(opt => (
                                                        <option key={opt.id} value={opt.id}>
                                                            {opt.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {field.lookupEndpoint && (
                                                <button
                                                    type="button"
                                                    className={styles.addLookupBtn}
                                                    onClick={() => {
                                                        setAddingLookupField(addingLookupField === field.name ? null : field.name);
                                                        setNewLookupName('');
                                                    }}
                                                    title="Neuen Eintrag hinzufügen"
                                                >
                                                    +
                                                </button>
                                            )}
                                        </div>
                                        {/* Inline add lookup */}
                                        {addingLookupField === field.name && (
                                            <div className={styles.inlineLookup}>
                                                <input
                                                    type="text"
                                                    placeholder={`Neuen ${field.label} hinzufügen...`}
                                                    value={newLookupName}
                                                    onChange={(e) => setNewLookupName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleCreateLookup(field);
                                                        }
                                                    }}
                                                    className={styles.inlineLookupInput}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleCreateLookup(field)}
                                                    disabled={lookupCreating || !newLookupName.trim()}
                                                    className={styles.inlineLookupSave}
                                                >
                                                    {lookupCreating ? '...' : '✓'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setAddingLookupField(null); setNewLookupName(''); }}
                                                    className={styles.inlineLookupCancel}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : field.type === 'image' ? (
                                    <div className={styles.imageUploadWrapper}>
                                        {formData[field.name] && (
                                            <div className={styles.imagePreview}>
                                                <img src={formData[field.name]} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, [field.name]: '' }))} style={{ display: 'block', color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Bild entfernen</button>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id={field.name}
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, field)}
                                            disabled={uploadingField === field.name}
                                            className={styles.input}
                                        />
                                        {uploadingField === field.name && <small>Lädt hoch...</small>}
                                    </div>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        id={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(e, field)}
                                        required={field.required}
                                        rows={field.rows || 4}
                                        maxLength={field.maxLength || 2000}
                                        disabled={disabled}
                                        className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
                                        style={{ resize: 'vertical', minHeight: '80px' }}
                                    />
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        id={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={(e) => handleChange(e, field)}
                                        required={field.required}
                                        step={field.step}
                                        disabled={disabled}
                                        className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
                                    />
                                )}
                            </div>
                        )
                    })}
                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Abbrechen</button>
                        <button type="submit" className={styles.submitBtn}>Speichern</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GenericFormModal;