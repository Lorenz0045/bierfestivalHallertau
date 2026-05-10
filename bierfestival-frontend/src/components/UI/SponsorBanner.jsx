import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCachedData } from '../../services/cacheService';
import BottomSheet from './BottomSheet';
import { FaGlobe, FaMapMarkerAlt } from 'react-icons/fa';
import styles from './SponsorBanner.module.css';

/**
 * Horizontale Sponsor-Logo-Leiste mit Auto-Scroll (alle 5s um 2 Logos weiter).
 * Klick öffnet Sponsor-Detail als BottomSheet.
 */
const SponsorBanner = () => {
    const [sponsors, setSponsors] = useState([]);
    const [selectedSponsor, setSelectedSponsor] = useState(null);
    const scrollRef = useRef(null);
    const autoScrollTimer = useRef(null);
    const userInteracting = useRef(false);
    const interactionTimeout = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchCachedData('/api/sponsors');
                if (data && data.length > 0) setSponsors(data);
            } catch (err) {
                console.error('Sponsor load error:', err);
            }
        };
        load();
    }, []);

    // Auto-scroll logic
    const scrollByLogos = useCallback((count) => {
        if (!scrollRef.current || userInteracting.current) return;
        const container = scrollRef.current;
        const logoWidth = 90; // width + gap
        container.scrollBy({ left: logoWidth * count, behavior: 'smooth' });

        // If near end, reset to start
        if (container.scrollLeft + container.clientWidth >= container.scrollWidth - logoWidth) {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }
            }, 600);
        }
    }, []);

    useEffect(() => {
        if (sponsors.length <= 4) return;
        autoScrollTimer.current = setInterval(() => scrollByLogos(2), 5000);
        return () => clearInterval(autoScrollTimer.current);
    }, [sponsors, scrollByLogos]);

    const handleUserTouch = () => {
        userInteracting.current = true;
        clearTimeout(interactionTimeout.current);
        interactionTimeout.current = setTimeout(() => {
            userInteracting.current = false;
        }, 8000); // Resume after 8s inactivity
    };

    if (sponsors.length === 0) return null;

    return (
        <>
            <div className={styles.banner}>
                <div
                    className={styles.scroll}
                    ref={scrollRef}
                    onTouchStart={handleUserTouch}
                    onMouseDown={handleUserTouch}
                >
                    {sponsors.map(sponsor => (
                        <button
                            key={sponsor.id}
                            className={styles.logoBtn}
                            onClick={() => setSelectedSponsor(sponsor)}
                            title={sponsor.name}
                        >
                            {sponsor.imgUrl ? (
                                <img src={sponsor.imgUrl} alt={sponsor.name} className={styles.logoImg} />
                            ) : (
                                <div className={styles.logoFallback}>{sponsor.name.substring(0, 2)}</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <BottomSheet
                isOpen={!!selectedSponsor}
                onClose={() => setSelectedSponsor(null)}
                title={selectedSponsor?.name || ''}
            >
                {selectedSponsor && (
                    <div className={styles.detail}>
                        {selectedSponsor.imgUrl && (
                            <img src={selectedSponsor.imgUrl} alt={selectedSponsor.name} className={styles.detailImg} />
                        )}
                        {selectedSponsor.description && (
                            <p className={styles.detailDesc}>{selectedSponsor.description}</p>
                        )}
                        <div className={styles.detailMeta}>
                            {selectedSponsor.city && (
                                <span className={styles.metaItem}>
                                    <FaMapMarkerAlt /> {selectedSponsor.city.name || selectedSponsor.city}
                                </span>
                            )}
                        </div>
                        {selectedSponsor.website && (
                            <a
                                href={selectedSponsor.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.websiteLink}
                            >
                                <FaGlobe /> Website besuchen
                            </a>
                        )}
                    </div>
                )}
            </BottomSheet>
        </>
    );
};

export default SponsorBanner;
