import React, { useState } from 'react';
import styles from '../../pages/AdminPage.module.css';

/**
 * Eine wiederverwendbare Komponente, die einen ausklappbaren Bereich darstellt.
 * @param {{title: string, children: React.ReactNode, defaultOpen?: boolean}} props
 */
const CollapsibleSection = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.collapsibleContainer}>
            <div className={styles.collapsibleHeader} onClick={toggleOpen}>
                <h3>{title}</h3>
                <span className={styles.collapsibleIcon}>{isOpen ? '▼' : '▶'}</span>
            </div>
            {isOpen && (
                <div className={styles.collapsibleContent}>
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleSection;