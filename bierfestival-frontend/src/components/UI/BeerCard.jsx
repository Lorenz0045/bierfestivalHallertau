import React, { useState } from 'react';
import { FaBookmark, FaRegBookmark, FaMinus, FaPlus, FaBeer, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import styles from './BeerCard.module.css';

/**
 * Zentrale Bier-Kachel – wird wiederverwendet in:
 * Suche-Tab, Schenken-Overlay, Mein Besuch
 *
 * Props:
 * - beer: { beerId, name, breweryName, typeName, alcoholPercentage, isNonAlcoholic, description, originalGravity, breweryId }
 * - trackingState: { isOnMerkliste, drinkTimestamps, rating }
 * - onToggleMerkliste(beerId)
 * - onLogDrink(beerId)
 * - onRemoveDrink(beerId)
 * - onRate(beerId, rating)
 * - onBreweryClick(breweryId, breweryName) – optional: öffnet Brauerei-Detail
 * - compact: boolean – kompaktere Darstellung für Schenken-Overlay
 * - drinkCount: number – override für aggregierten Count (Mein Besuch)
 */
const BeerCard = ({
    beer,
    trackingState = {},
    onToggleMerkliste,
    onLogDrink,
    onRemoveDrink,
    onRate,
    onBreweryClick,
    compact = false,
    drinkCount: drinkCountOverride
}) => {
    const [expanded, setExpanded] = useState(false);

    const isOnMerkliste = trackingState.isOnMerkliste || false;
    const drinkTimestamps = trackingState.drinkTimestamps || [];
    const drinkCount = drinkCountOverride !== undefined ? drinkCountOverride : drinkTimestamps.length;
    const hasDrunk = drinkCount > 0;
    const currentRating = trackingState.rating || 0;

    const alcoholDisplay = beer.isNonAlcoholic ? '< 0,5%' : (beer.alcoholPercentage != null ? `${beer.alcoholPercentage}%` : null);

    return (
        <div className={`${styles.card} ${compact ? styles.compact : ''} ${expanded ? styles.expanded : ''}`}>
            {/* Header Row */}
            <div className={styles.header} onClick={() => setExpanded(!expanded)}>
                <div className={styles.info}>
                    <h4 className={styles.name}>{beer.name}</h4>
                    <div className={styles.meta}>
                        {beer.breweryName && (
                            <button
                                className={styles.breweryLink}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onBreweryClick && onBreweryClick(beer.breweryId, beer.breweryName);
                                }}
                                disabled={!onBreweryClick}
                            >
                                {beer.breweryName}
                            </button>
                        )}
                        {beer.typeName && <span className={styles.typeBadge}>{beer.typeName}</span>}
                        {alcoholDisplay && (
                            <span className={`${styles.alcBadge} ${beer.isNonAlcoholic ? styles.alcFree : ''}`}>
                                {alcoholDisplay}
                            </span>
                        )}
                    </div>
                </div>
                <div className={styles.expandIcon}>
                    {expanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
            </div>

            {/* Quick Actions - always visible */}
            <div className={styles.actions}>
                {/* Merken */}
                <button
                    className={`${styles.actionBtn} ${styles.merkenBtn} ${isOnMerkliste ? styles.gemerkt : ''}`}
                    onClick={() => onToggleMerkliste && onToggleMerkliste(beer.beerId)}
                    title={isOnMerkliste ? 'Gemerkt' : 'Merken'}
                >
                    {isOnMerkliste ? <FaBookmark /> : <FaRegBookmark />}
                    <span>{isOnMerkliste ? 'Gemerkt' : 'Merken'}</span>
                </button>

                {/* Drink Counter */}
                <div className={styles.drinkCounter}>
                    <button
                        className={styles.counterBtn}
                        onClick={() => onRemoveDrink && onRemoveDrink(beer.beerId)}
                        disabled={!hasDrunk}
                        aria-label="Weniger"
                    >
                        <FaMinus />
                    </button>
                    <span className={`${styles.counterVal} ${hasDrunk ? styles.hasCount : ''}`}>{drinkCount}</span>
                    <button
                        className={styles.counterBtn}
                        onClick={() => onLogDrink && onLogDrink(beer.beerId)}
                        aria-label="Getrunken"
                    >
                        <FaPlus />
                    </button>
                </div>

                {/* Rating - Bierkrüge */}
                <div className={`${styles.ratingRow} ${!hasDrunk ? styles.ratingDisabled : ''}`}>
                    {[1, 2, 3, 4, 5].map(level => (
                        <button
                            key={level}
                            className={`${styles.ratingMug} ${currentRating >= level ? styles.filled : styles.empty}`}
                            onClick={() => {
                                if (!hasDrunk) return;
                                onRate && onRate(beer.beerId, currentRating === level ? null : level);
                            }}
                            disabled={!hasDrunk}
                            aria-label={`Bewertung ${level}`}
                        >
                            <FaBeer />
                        </button>
                    ))}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className={styles.details}>
                    {beer.description && <p className={styles.description}>{beer.description}</p>}
                    <div className={styles.detailGrid}>
                        {beer.originalGravity && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Stammwürze</span>
                                <span className={styles.detailValue}>{beer.originalGravity}°P</span>
                            </div>
                        )}
                        {alcoholDisplay && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Alkohol</span>
                                <span className={styles.detailValue}>{alcoholDisplay} Vol.</span>
                            </div>
                        )}
                        {beer.typeName && (
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Biertyp</span>
                                <span className={styles.detailValue}>{beer.typeName}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BeerCard;
