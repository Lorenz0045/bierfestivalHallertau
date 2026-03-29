import { useState, useEffect } from 'react';
import styles from './GenericFormModal.module.css';

const GenericFormModal = ({ isOpen, onClose, onSubmit, title, fields, initialData }) => {
    const [formData, setFormData] = useState({});

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

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
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