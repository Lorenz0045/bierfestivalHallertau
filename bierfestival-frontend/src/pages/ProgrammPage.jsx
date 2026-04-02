import React, { useState, useEffect, useMemo } from 'react';
import { fetchCachedData } from '../services/cacheService';
import { FaClock, FaMapMarkerAlt, FaGuitar } from 'react-icons/fa';
import styles from './ProgrammPage.module.css';

const ProgrammPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProgram = async () => {
            try {
                const data = await fetchCachedData('/api/events');
                if (data && data.length > 0) {
                    setEvents(data);
                }
            } catch (error) {
                console.error("Fehler beim Laden des Programms", error);
            } finally {
                setLoading(false);
            }
        };
        loadProgram();
    }, []);

    // Events nach Tagen gruppieren
    const { groupedEvents, topDays } = useMemo(() => {
        const groups = {};
        
        events.forEach(event => {
            // Entweder den vom Admin vergebenen Namen, oder fallback auf das Datum
            let dayKey = event.dayName;
            if (!dayKey) {
                if (event.startTime) {
                    const d = new Date(event.startTime);
                    dayKey = d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
                } else {
                    dayKey = 'Sonstige';
                }
            }

            if (!groups[dayKey]) {
                groups[dayKey] = [];
            }
            groups[dayKey].push(event);
        });

        // Alle Events innerhalb eines Tages chronologisch sortieren
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                if (!a.startTime || !b.startTime) return 0;
                return new Date(a.startTime) - new Date(b.startTime);
            });
        });

        const sortedDays = Object.keys(groups).sort((a, b) => {
            // Minimalistischer Ansatz: Sortiere nach der Startzeit des allerersten Events des jeweiligen Tages
            const timeA = groups[a][0]?.startTime ? new Date(groups[a][0].startTime).getTime() : 0;
            const timeB = groups[b][0]?.startTime ? new Date(groups[b][0].startTime).getTime() : 0;
            return timeA - timeB;
        });

        return { groupedEvents: groups, topDays: sortedDays };
    }, [events]);

    useEffect(() => {
        // Initiale Auswahl auf den ersten gefundenen Tag setzen
        if (topDays.length > 0 && !selectedDay) {
            setSelectedDay(topDays[0]);
        }
    }, [topDays, selectedDay]);

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr';
    };

    if (loading) {
        return <div className={styles.container}><div className={styles.loading}>Programm wird geladen...</div></div>;
    }

    if (events.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <FaGuitar className={styles.emptyIcon} />
                    <h2>Noch kein Programm</h2>
                    <p>Das Festivalprogramm wird bald veröffentlicht. Schau später wieder vorbei!</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Festival Programm</h1>
            </div>

            {/* Dynamische Tages-Navigation */}
            <div className={styles.daySelectorWrapper}>
                <div className={styles.daySelector}>
                    {topDays.map(day => (
                        <button 
                            key={day}
                            className={`${styles.dayButton} ${selectedDay === day ? styles.activeDay : ''}`}
                            onClick={() => setSelectedDay(day)}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Event-Liste für den ausgewählten Tag */}
            <div className={styles.eventList}>
                {groupedEvents[selectedDay]?.map((event, index) => (
                    <div key={event.id || index} className={styles.eventCard}>
                        <div className={styles.eventTimeColumn}>
                            <span className={styles.timeMain}>{formatTime(event.startTime)}</span>
                            {event.endTime && (
                                <span className={styles.timeSub}>bis {formatTime(event.endTime)}</span>
                            )}
                        </div>
                        <div className={styles.eventDetailsColumn}>
                            <h3 className={styles.eventName}>{event.name}</h3>
                            <div className={styles.eventMeta}>
                                {event.stage && (
                                    <span className={styles.stageTag}>
                                        <FaMapMarkerAlt /> {event.stage.name || 'Bühne'}
                                    </span>
                                )}
                            </div>
                            {event.description && (
                                <p className={styles.eventDescription}>{event.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgrammPage;
