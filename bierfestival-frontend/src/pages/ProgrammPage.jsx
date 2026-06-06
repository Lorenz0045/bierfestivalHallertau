import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import { FaGuitar, FaCalendarAlt, FaGlobe } from 'react-icons/fa';
import EventItem from '../components/UI/EventItem';
import SponsorBanner from '../components/UI/SponsorBanner';
import BottomSheet from '../components/UI/BottomSheet';
import styles from './ProgrammPage.module.css';

const ProgrammPage = () => {
    const [events, setEvents] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedStage, setSelectedStage] = useState('Alle');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [selectedSponsor, setSelectedSponsor] = useState(null);

    useEffect(() => {
        const loadProgram = async () => {
            try {
                // Nutzt weiterhin den aggressiven cacheService
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

    // Listener für "Tap to Top" 
    useEffect(() => {
        const handleTabReclick = (e) => {
            if (e.detail === '/programm') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        window.addEventListener('bf-tab-reclick', handleTabReclick);
        return () => window.removeEventListener('bf-tab-reclick', handleTabReclick);
    }, []);

    // Events nach Tagen gruppieren
    const { groupedEvents, topDays } = useMemo(() => {
        const groups = {};

        events.forEach(event => {
            let dayKey = event.dayName;
            if (!dayKey) {
                if (event.startTime) {
                    // Datum direkt aus dem ISO-String lesen (z.B. "2026-06-12")
                    dayKey = event.startTime.substring(0, 10);
                } else {
                    dayKey = 'Sonstige';
                }
            }

            if (!groups[dayKey]) {
                groups[dayKey] = [];
            }
            groups[dayKey].push(event);
        });

        // Chronologische Sortierung
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                if (!a.startTime || !b.startTime) return 0;
                return new Date(a.startTime) - new Date(b.startTime);
            });
        });

        const sortedDays = Object.keys(groups).sort((a, b) => {
            const timeA = groups[a][0]?.startTime ? new Date(groups[a][0].startTime).getTime() : 0;
            const timeB = groups[b][0]?.startTime ? new Date(groups[b][0].startTime).getTime() : 0;
            return timeA - timeB;
        });

        return { groupedEvents: groups, topDays: sortedDays };
    }, [events]);

    // Bühnen extrahieren
    const stages = useMemo(() => {
        const stageSet = new Set();
        events.forEach(e => {
            if (e.stage && e.stage.name) stageSet.add(e.stage.name);
        });
        return ['Alle', ...Array.from(stageSet).sort()];
    }, [events]);

    useEffect(() => {
        if (topDays.length > 0 && !selectedDay) {
            setSelectedDay(topDays[0]);
        }
    }, [topDays, selectedDay]);

    const handleJumpToMap = (stage) => {
        if (stage && stage.lat && stage.lon) {
            navigate('/', { state: { jumpToPoi: { lat: stage.lat, lon: stage.lon } } });
        } else {
            navigate('/');
        }
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

    const displayedEvents = groupedEvents[selectedDay]?.filter(
        e => selectedStage === 'Alle' || (e.stage && e.stage.name === selectedStage)
    ) || [];

    return (
        <div className={styles.wrapper}>

            <div className={styles.sponsorOverlay}>
                <SponsorBanner onSponsorClick={(sponsor) => setSelectedSponsor(sponsor)} />
            </div>


            <div className={styles.container}>
                <div className={styles.header}>
                    <FaCalendarAlt className={styles.headerIcon} />
                    <h1 className={styles.title}>Festival Programm</h1>
                    <p className={styles.subtitle}>Bands, Acts & Auftritte</p>
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

                {/* Bühne-Filter */}
                {stages.length > 1 && (
                    <div className={styles.stageSelectorWrapper}>
                        <div className={styles.stageSelector}>
                            {stages.map(stage => (
                                <button
                                    key={stage}
                                    className={`${styles.stageButton} ${selectedStage === stage ? styles.activeStage : ''}`}
                                    onClick={() => setSelectedStage(stage)}
                                >
                                    {stage}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Event-Liste */}
                <div className={styles.eventList}>
                    {displayedEvents.length === 0 ? (
                        <div className={styles.emptyState}>Keine Events für diese Bühne an diesem Tag.</div>
                    ) : (
                        displayedEvents.map((event, index) => (
                            <EventItem
                                key={event.id || index}
                                event={event}
                                onJumpToMap={handleJumpToMap}
                                showStage={true}
                            />
                        ))
                    )}
                </div>
                <BottomSheet
                    isOpen={!!selectedSponsor}
                    onClose={() => setSelectedSponsor(null)}
                    showBack={false}
                    title={selectedSponsor?.name || ''}
                >
                    {selectedSponsor && (
                        <div style={{ padding: '8px 0' }}>
                            <div className={styles.detailHeaderRow}>
                                <div className={styles.detailHeaderIconWrapper}>
                                    {selectedSponsor.imgUrl ? (
                                        <img src={selectedSponsor.imgUrl} alt={selectedSponsor.name} className={styles.detailHeaderImg} />
                                    ) : (
                                        <div className={styles.detailHeaderFallback}>{selectedSponsor.name?.substring(0, 2).toUpperCase()}</div>
                                    )}
                                </div>
                                <div className={styles.detailHeaderInfo}>
                                    <span className={styles.detailTypeBadge}>
                                        {selectedSponsor.tier?.imgUrl && <img src={selectedSponsor.tier.imgUrl} alt="Tier Icon" style={{ height: '14px', marginRight: '4px', verticalAlign: 'middle' }} />}
                                        {selectedSponsor.tier?.name || 'Sponsor'}
                                    </span>
                                    {selectedSponsor.city && <span className={styles.detailMetaText}>📍 {selectedSponsor.city.name || selectedSponsor.city}</span>}
                                </div>
                                <div className={styles.detailHeaderActions}>
                                    {selectedSponsor.website && (
                                        <div className={styles.actionWrapper}>
                                            <a href={selectedSponsor.website} target="_blank" rel="noopener noreferrer" className={styles.websiteBtn}>
                                                <FaGlobe /> Zur Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {selectedSponsor.description && <p className={styles.sponsorDesc}>{selectedSponsor.description}</p>}
                        </div>
                    )}
                </BottomSheet>
            </div>
        </div>
    );
};

export default ProgrammPage;