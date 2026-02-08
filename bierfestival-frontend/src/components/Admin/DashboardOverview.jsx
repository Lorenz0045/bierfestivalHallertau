import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import apiRequest from '../../services/apiService';
import styles from '../../pages/AdminPage.module.css';
import CollapsibleSection from './CollapsibleSection';

const DashboardOverview = () => {
    const { keycloakInstance } = useUser();
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            if (!keycloakInstance || !keycloakInstance.token) {
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                //TODO: const data = await apiRequest('/api/admin/dashboard/metrics', 'GET', null, keycloakInstance.token);
                setMetrics(data);
            } catch (err) {
                setError(err.message || 'Fehler beim Laden der Dashboard-Daten.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMetrics();
    }, [keycloakInstance]);

    if (isLoading) {
        return <p>Lade Kennzahlen...</p>;
    }

    if (error) {
        return <p className={styles.errorMessage}>{error}</p>;
    }



    return (
        <div>
            <h2>Dashboard</h2>
            {metrics && (
                <div>
                    <CollapsibleSection title="todo">
                        <div className={styles.dashboardGrid}>
                            todo
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="todo">
                        <CollapsibleSection title="todo">
                            todo
                        </CollapsibleSection>

                        <CollapsibleSection title="todo" defaultOpen={false}>
                            todo
                        </CollapsibleSection>

                        <CollapsibleSection title="todo" defaultOpen={false}>
                            todo
                        </CollapsibleSection>
                    </CollapsibleSection>

                    <CollapsibleSection title="todo" defaultOpen={false}>
                        <CollapsibleSection title="Content-Verteilung">
                            todo

                        </CollapsibleSection>

                        <CollapsibleSection title="todo" defaultOpen={false}>
                            todo
                        </CollapsibleSection>
                    </CollapsibleSection>

                    

                </div>
            )}
        </div>
    );
}
export default DashboardOverview;