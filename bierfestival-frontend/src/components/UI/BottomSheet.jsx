import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import styles from './BottomSheet.module.css';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
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
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.bottomSheet} onClick={e => e.stopPropagation()}>
                <div className={styles.sheetHeader}>
                    {title && <h3 className={styles.sheetTitle}>{title}</h3>}
                    <button className={styles.closeButton} onClick={onClose} aria-label="Schließen">
                        <FaTimes />
                    </button>
                </div>
                <div className={styles.sheetContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BottomSheet;
