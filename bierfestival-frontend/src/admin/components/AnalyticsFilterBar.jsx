import React from 'react';
import styles from './AnalyticsFilterBar.module.css';

const AnalyticsFilterBar = ({ filters, onFilterChange }) => {
    // Example format for filters:
    // {
    //   searchQuery: { type: 'text', label: 'Suche', value: '' },
    //   beerType: { type: 'select', label: 'Biersorte', options: [{id: 1, name: 'Helles'}], value: '' },
    //   alcoholMode: { type: 'select', label: 'Alkoholgehalt', options: [{id: 'ALL', name: 'Alle'}, {id: 'ALC', name: 'Mit Alkohol'}, {id: 'NON_ALC', name: 'Alkoholfrei'}], value: 'ALL' }
    // }

    return (
        <div className={styles.filterBar}>
            {Object.entries(filters).map(([key, config]) => (
                <div key={key} className={styles.filterItem}>
                    <label>{config.label}</label>
                    {config.type === 'text' && (
                        <input 
                            type="text" 
                            value={config.value || ''}
                            onChange={(e) => onFilterChange(key, e.target.value)}
                            placeholder={`Nach ${config.label} suchen...`}
                        />
                    )}
                    {config.type === 'select' && (
                        <select 
                            value={config.value || ''}
                            onChange={(e) => onFilterChange(key, e.target.value)}
                        >
                            <option value="">Alle</option>
                            {config.options && config.options.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AnalyticsFilterBar;
