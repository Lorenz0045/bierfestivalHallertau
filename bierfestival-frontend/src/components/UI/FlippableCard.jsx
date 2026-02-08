import React, { useState } from 'react';
import styles from './FlippableCard.module.css';
import { 
    FaChevronRight 
} from 'react-icons/fa';

const FlippableCard = ({ emoji, title, text, initialFlipped = false }) => {
  const [isFlipped, setIsFlipped] = useState(initialFlipped);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className={styles.flipCard} onClick={handleFlip}>
      <div className={`${styles.flipCardInner} ${isFlipped ? styles.isFlipped : ''}`}>
        <div className={styles.flipCardFront}>
          <span className={styles.emoji}>{emoji}</span>
          <div className={styles.cardMeta}>
            <span className={styles.clickMe}>Klick mich</span>
            <span className={styles.chevron}><FaChevronRight /></span>
          </div>
        </div>
        <div className={styles.flipCardBack}>
          <p className={styles.cardText}>{text}</p>
        </div>
      </div>
    </div>
  );
};

export default FlippableCard;