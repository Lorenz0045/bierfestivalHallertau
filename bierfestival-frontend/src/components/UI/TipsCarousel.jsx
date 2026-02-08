import React, { useRef, useEffect, useState } from 'react';
import styles from './TipsCarousel.module.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const TipsCarousel = ({ tips }) => {

    const trackRef = useRef(null);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);

    // Stellt sicher, dass das Karussell am Anfang startet
    useEffect(() => {
        if (trackRef.current) {
            trackRef.current.scrollLeft = 0;
        }
    }, [tips]); // Führt dies aus, wenn sich die Tipps ändern

    const handleScroll = () => {
        if (!trackRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
        setIsAtStart(scrollLeft === 0);
        setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1); // -1 für Rundungstoleranz
    };

    const scroll = (direction) => {
        if (!trackRef.current) return;
        const cardWidth = trackRef.current.querySelector(`.${styles.tipCard}`).offsetWidth;
        const scrollAmount = cardWidth + 15; // 15px ist der Gap

        if (direction === 'next') {
            if (isAtEnd) {
                trackRef.current.scrollTo({ left: 0, behavior: 'smooth' }); // Springt zum Anfang
            } else {
                trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        } else {
            if (isAtStart) {
                trackRef.current.scrollTo({ left: trackRef.current.scrollWidth, behavior: 'smooth' }); // Springt zum Ende
            } else {
                trackRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <div className={styles.carouselContainer}>
            <button className={`${styles.navButton} ${styles.prevButton} desktop-only`} onClick={() => scroll('prev')}><FaChevronLeft /></button>
            <div className={styles.carouselTrack} ref={trackRef} onScroll={handleScroll}>
                {tips.map((tip, index) => (
                    <div key={index} className={styles.tipCard}>
                        <h4 className={styles.tipTitle}>{index+1}. {tip.title}</h4>
                        <p className={styles.tipText}>{tip.text}</p>
                    </div>
                ))}
            </div>
            <button className={`${styles.navButton} ${styles.nextButton} desktop-only`} onClick={() => scroll('next')}><FaChevronRight /></button>
        </div>
    );
};

export default TipsCarousel;