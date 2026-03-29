import { useState, useMemo } from 'react';
import styles from './DataTable.module.css';

const DataTable = ({ columns, data, onEdit, onDelete }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const sortedAndFilteredData = useMemo(() => {
        let processableData = [...data];

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            processableData = processableData.filter((item) => {
                return columns.some((col) => {
                    const value = item[col.key];
                    return value != null && value.toString().toLowerCase().includes(lowercasedTerm);
                });
            });
        }

        if (sortConfig.key) {
            processableData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === bValue) return 0;
                
                if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
                if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                
                return 0;
            });
        }

        return processableData;
    }, [data, sortConfig, searchTerm, columns]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableToolbar}>
                <input
                    type="text"
                    placeholder="Suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>
            
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th 
                                    key={col.key} 
                                    onClick={() => col.sortable !== false && requestSort(col.key)}
                                    className={col.sortable !== false ? styles.sortable : ''}
                                >
                                    {col.label}
                                    {sortConfig.key === col.key && (
                                        <span className={styles.sortIndicator}>
                                            {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                                        </span>
                                    )}
                                </th>
                            ))}
                            {(onEdit || onDelete) && <th>Aktionen</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredData.length > 0 ? (
                            sortedAndFilteredData.map((row, index) => (
                                <tr key={row.id || index}>
                                    {columns.map((col) => (
                                        <td key={`${row.id || index}-${col.key}`}>
                                            {col.render ? col.render(row[col.key], row) : row[col.key]?.toString() || '-'}
                                        </td>
                                    ))}
                                    {(onEdit || onDelete) && (
                                        <td className={styles.actions}>
                                            {onEdit && <button onClick={() => onEdit(row)} className={styles.editBtn}>Bearbeiten</button>}
                                            {onDelete && <button onClick={() => onDelete(row)} className={styles.deleteBtn}>Löschen</button>}
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className={styles.emptyState}>
                                    Keine Daten gefunden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;