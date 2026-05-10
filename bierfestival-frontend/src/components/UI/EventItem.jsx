import React from 'react';
import { FaMapMarkerAlt, FaLocationArrow } from 'react-icons/fa';
import styles from './EventItem.module.css';

const EventItem = ({ event, onJumpToMap, showStage = false }) => {
    const formatTime = (isoString) => {
        if (!isoString) return '';
        return isoString.substring(11, 16) + ' Uhr';
    };

    return (
        <div className={styles.eventCard}>
            <div className={styles.eventTimeColumn}>
                <span className={styles.timeMain}>{formatTime(event.startTime)}</span>
                {event.endTime && (
                    <span className={styles.timeSub}>bis {formatTime(event.endTime)}</span>
                )}
            </div>
            <div className={styles.eventDetailsColumn}>
                <h3 className={styles.eventName}>{event.name}</h3>
                {showStage && event.stage && (
                    <div className={styles.eventMeta}>
                        <button
                            className={styles.stageTag}
                            onClick={() => onJumpToMap && onJumpToMap(event.stage)}
                            title="Auf Karte anzeigen"
                        >
                            <FaMapMarkerAlt /> {event.stage.name || 'Bühne'}
                            <FaLocationArrow className={styles.jumpIcon} />
                        </button>
                    </div>
                )}
                {event.description && (
                    <p className={styles.eventDescription}>{event.description}</p>
                )}
            </div>
        </div>
    );
};

export default EventItem;