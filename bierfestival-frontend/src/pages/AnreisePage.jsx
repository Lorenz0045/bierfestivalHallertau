import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCachedData } from '../services/cacheService';
import { FaBus, FaChevronDown, FaChevronUp, FaClock, FaMapMarkedAlt, FaExchangeAlt, FaSearch, FaGlobe } from 'react-icons/fa';
import SponsorBanner from '../components/UI/SponsorBanner';
import BottomSheet from '../components/UI/BottomSheet';
import styles from './AnreisePage.module.css';

// Nachtfahrt-Regel: 00:00–04:00 → Vortag
const NIGHT_CUTOFF_HOUR = 4;

const parseDepartureTime = (isoStr) => {
    const d = new Date(isoStr);
    return d;
};

const formatTime = (d) => {
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
};

const getFestivalDay = (d) => {
    const berlin = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
    const h = berlin.getHours();
    // Wenn zwischen 0 und 4 Uhr → gehört zum Vortag
    if (h < NIGHT_CUTOFF_HOUR) {
        const prev = new Date(berlin);
        prev.setDate(prev.getDate() - 1);
        return prev.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });
    }
    return berlin.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' });
};

const AnreisePage = () => {
    const [schedule, setSchedule] = useState([]);
    const [busStops, setBusStops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState('');
    const [expandedLine, setExpandedLine] = useState(null);
    const navigate = useNavigate();

    // Verbindungssuche
    const [searchFrom, setSearchFrom] = useState('');
    const [searchTo, setSearchTo] = useState('');
    const [searchResults, setSearchResults] = useState(null);

    const [selectedSponsor, setSelectedSponsor] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [schedData, stopsData] = await Promise.all([
                    fetchCachedData('/api/bus/schedule'),
                    fetchCachedData('/api/bus/stops'),
                ]);
                setSchedule(schedData || []);
                setBusStops(stopsData || []);
            } catch (err) {
                console.error('Bus: Fehler', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

     // Listener für "Tap to Top" & "Overlays schließen"
        useEffect(() => {
            const handleTabReclick = (e) => {
                if (e.detail === '/anreise') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            window.addEventListener('bf-tab-reclick', handleTabReclick);
            return () => window.removeEventListener('bf-tab-reclick', handleTabReclick);
        }, []);

    // Tage ermitteln
    const festivalDays = useMemo(() => {
        const daySet = new Set();
        schedule.forEach(line => {
            line.departures?.forEach(dep => {
                daySet.add(getFestivalDay(parseDepartureTime(dep.departureTime)));
            });
        });
        return Array.from(daySet).sort();
    }, [schedule]);

    useEffect(() => {
        if (festivalDays.length > 0 && !selectedDay) setSelectedDay(festivalDays[0]);
    }, [festivalDays, selectedDay]);

    // All stop names for autocomplete
    const stopNames = useMemo(() => busStops.map(s => s.name).sort(), [busStops]);

    // Verbindungssuche
    const handleSearch = () => {
        if (!searchFrom) return;
        const results = [];
        schedule.forEach(line => {
            const deps = line.departures?.filter(d => {
                const dayMatch = !selectedDay || getFestivalDay(parseDepartureTime(d.departureTime)) === selectedDay;
                const fromMatch = d.busStopName.toLowerCase().includes(searchFrom.toLowerCase());
                return dayMatch && fromMatch;
            }) || [];
            if (deps.length > 0) {
                results.push({ line: line.line, departures: deps });
            }
        });
        setSearchResults(results);
    };

    const handleJumpToMap = (stop) => {
        const busStop = busStops.find(s => s.name === stop || s.id === stop);
        if (busStop?.facilityLat && busStop?.facilityLon) {
            navigate('/', { state: { jumpToPoi: { lat: busStop.facilityLat, lon: busStop.facilityLon } } });
        }
    };

    const hasMapLink = (stopName) => {
        const s = busStops.find(bs => bs.name === stopName);
        return s?.facilityLat && s?.facilityLon;
    };

    if (loading) {
        return <div className={styles.page}><div className={styles.loading}>Busfahrplan wird geladen...</div></div>;
    }

    return (
        <div className={styles.wrapper}>
            
            <div className={styles.sponsorOverlay}>
                <SponsorBanner onSponsorClick={(sponsor) => setSelectedSponsor(sponsor)} />
            </div>

            <div className={styles.page}>

                <div className={styles.header}>
                    <FaBus className={styles.headerIcon} />
                    <h1 className={styles.title}>Busanreise</h1>
                    <p className={styles.subtitle}>Shuttlebusse zum Hallertauer Bierfestival</p>
                </div>

                {/* Tages-Tabs */}
                <div className={styles.dayTabs}>
                    {festivalDays.map(day => (
                        <button
                            key={day}
                            className={`${styles.dayTab} ${selectedDay === day ? styles.dayActive : ''}`}
                            onClick={() => { setSelectedDay(day); setSearchResults(null); }}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Verbindungssuche */}
                <div className={styles.searchSection}>
                    <h3 className={styles.searchTitle}><FaSearch /> Verbindung suchen</h3>
                    <div className={styles.searchFields}>
                        <div className={styles.searchField}>
                            <label>Von</label>
                            <input
                                type="text"
                                list="stops-from"
                                placeholder="Abfahrtshaltestelle…"
                                value={searchFrom}
                                onChange={e => setSearchFrom(e.target.value)}
                                className={styles.searchInput}
                            />
                            <datalist id="stops-from">
                                {stopNames.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                        <button className={styles.swapBtn} onClick={() => { setSearchFrom(searchTo); setSearchTo(searchFrom); }}>
                            <FaExchangeAlt />
                        </button>
                        <div className={styles.searchField}>
                            <label>Nach</label>
                            <input
                                type="text"
                                list="stops-to"
                                placeholder="Zielhaltestelle… (optional)"
                                value={searchTo}
                                onChange={e => setSearchTo(e.target.value)}
                                className={styles.searchInput}
                            />
                            <datalist id="stops-to">
                                {stopNames.map(s => <option key={s} value={s} />)}
                            </datalist>
                        </div>
                    </div>
                    <button className={styles.searchBtn} onClick={handleSearch}>Suchen</button>
                </div>

                {/* Suchergebnisse */}
                {searchResults && (
                    <div className={styles.searchResults}>
                        <h4>Ergebnisse{searchResults.length === 0 ? ' – Keine Verbindungen gefunden' : ''}</h4>
                        {searchResults.map((r, i) => (
                            <div key={i} className={styles.resultCard}>
                                <div className={styles.resultLine}>{r.line.name} – {r.line.routeDescription}</div>
                                {r.line.priceEur && <span className={styles.resultPrice}>{r.line.priceEur} €</span>}
                                <div className={styles.resultTimes}>
                                    {r.departures.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)).map((dep, j) => (
                                        <div key={j} className={styles.resultTime}>
                                            <FaClock /> {formatTime(parseDepartureTime(dep.departureTime))} – {dep.busStopName}
                                            <span className={styles.dirBadge}>{dep.direction === 'HINFAHRT' ? '→ Festival' : '← Rückfahrt'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Fahrplan pro Linie */}
                <div className={styles.lineSection}>
                    <h2 className={styles.sectionTitle}>Fahrplan nach Linie</h2>
                    {schedule.map(item => {
                        const isExpanded = expandedLine === item.line.id;
                        // Filter departures by selected day
                        const dayDeps = (item.departures || []).filter(d =>
                            getFestivalDay(parseDepartureTime(d.departureTime)) === selectedDay
                        );
                        const hinfahrten = dayDeps.filter(d => d.direction === 'HINFAHRT');
                        const rueckfahrten = dayDeps.filter(d => d.direction === 'RUECKFAHRT');

                        return (
                            <div key={item.line.id} className={styles.lineCard}>
                                <button className={styles.lineHeader} onClick={() => setExpandedLine(isExpanded ? null : item.line.id)}>
                                    <div className={styles.lineInfo}>
                                        <span className={styles.lineNumber}>{item.line.lineNumber}</span>
                                        <div>
                                            <strong>{item.line.name}</strong>
                                            <span className={styles.lineRoute}>{item.line.routeDescription}</span>
                                        </div>
                                    </div>
                                    <div className={styles.lineRight}>
                                        {item.line.priceEur && <span className={styles.price}>{item.line.priceEur} €</span>}
                                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className={styles.lineBody}>
                                        {/* Hinfahrten Matrix */}
                                        {hinfahrten.length > 0 && (
                                            <div className={styles.directionBlock}>
                                                <h4 className={styles.dirTitle}>→ Hinfahrt</h4>
                                                <div className={styles.scheduleTable}>
                                                    {/* Group by stop, then show times */}
                                                    {item.stops
                                                        .filter(stop => hinfahrten.some(d => d.busStopId === stop.id))
                                                        .map(stop => (
                                                            <div key={stop.id} className={styles.stopRow}>
                                                                <div className={styles.stopName}>
                                                                    {stop.name}
                                                                    {hasMapLink(stop.name) && (
                                                                        <button className={styles.stopMapBtn} onClick={() => handleJumpToMap(stop.name)} title="Auf Karte">
                                                                            <FaMapMarkedAlt />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className={styles.stopTimes}>
                                                                    {hinfahrten
                                                                        .filter(d => d.busStopId === stop.id)
                                                                        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
                                                                        .map((d, i) => (
                                                                            <span key={i} className={styles.timeChip}>{formatTime(parseDepartureTime(d.departureTime))}</span>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rückfahrten */}
                                        {rueckfahrten.length > 0 && (
                                            <div className={styles.directionBlock}>
                                                <h4 className={styles.dirTitle}>← Rückfahrt (Abfahrt ab Festival)</h4>
                                                <div className={styles.scheduleTable}>
                                                    {item.stops
                                                        .filter(stop => rueckfahrten.some(d => d.busStopId === stop.id))
                                                        .map(stop => (
                                                            <div key={stop.id} className={styles.stopRow}>
                                                                <div className={styles.stopName}>
                                                                    {stop.name}
                                                                    {hasMapLink(stop.name) && (
                                                                        <button className={styles.stopMapBtn} onClick={() => handleJumpToMap(stop.name)} title="Auf Karte">
                                                                            <FaMapMarkedAlt />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                <div className={styles.stopTimes}>
                                                                    {rueckfahrten
                                                                        .filter(d => d.busStopId === stop.id)
                                                                        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime))
                                                                        .map((d, i) => (
                                                                            <span key={i} className={styles.timeChip}>{formatTime(parseDepartureTime(d.departureTime))}</span>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {dayDeps.length === 0 && (
                                            <p className={styles.noDeps}>Keine Fahrten an diesem Tag.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
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

export default AnreisePage;
