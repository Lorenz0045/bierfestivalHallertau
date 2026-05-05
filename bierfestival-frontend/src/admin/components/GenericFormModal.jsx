import { useState, useEffect } from 'react';
import { apiUploadFile } from '../../services/apiService';
import { useUser } from '../contexts/UserContext';
import styles from './GenericFormModal.module.css';

const GenericFormModal = ({ isOpen, onClose, onSubmit, title, fields, initialData }) => {
    const { keycloakInstance } = useUser();
    const [formData, setFormData] = useState({});
    const [uploadingField, setUploadingField] = useState(null);

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

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {fields.map(field => (
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
                                <select
                                    id={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(e, field)}
                                    required={field.required}
                                    className={styles.input}
                                >
                                    <option value="">Bitte wählen...</option>
                                    {field.options.map(opt => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.name}
                                        </option>
                                    ))}
                                </select>
                            ) : field.type === 'image' ? (
                                <div className={styles.imageUploadWrapper}>
                                    {formData[field.name] && (
                                        <div className={styles.imagePreview}>
                                            <img src={formData[field.name]} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', marginBottom: '0.5rem' }} />
                                            <button type="button" onClick={() => setFormData(prev => ({...prev, [field.name]: ''}))} style={{ display: 'block', color: 'red', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>Bild entfernen</button>
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
                                    className={styles.input}
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
                                    className={styles.input}
                                />
                            )}
                        </div>
                    ))}
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