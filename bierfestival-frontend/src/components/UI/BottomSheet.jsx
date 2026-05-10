import React, { useEffect } from 'react';
import { FaTimes, FaArrowLeft } from 'react-icons/fa';
import styles from './BottomSheet.module.css';

const BottomSheet = ({ isOpen, onClose, title, children, onBack, showBack = false }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                <div className={styles.grabber} />
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        {showBack && onBack && (
                            <button className={styles.backBtn} onClick={onBack} aria-label="Zurück">
                                <FaArrowLeft />
                            </button>
                        )}
                        {title && <h3 className={styles.title}>{title}</h3>}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Schließen">
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
