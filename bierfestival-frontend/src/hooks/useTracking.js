import { useState, useEffect } from 'react';
import { getLocalTracking, toggleMerkliste, logDrink, removeDrink, rateBeer } from '../services/trackingService';

const useTracking = () => {
    const [trackingData, setTrackingData] = useState(getLocalTracking());

    useEffect(() => {
        // Event Listener: Wird von saveLocalTracking gefeuert
        const handleUpdate = () => {
            setTrackingData(getLocalTracking());
        };

        window.addEventListener('trackingUpdated', handleUpdate);

        return () => {
            window.removeEventListener('trackingUpdated', handleUpdate);
        };
    }, []);

    // Kleine Hilfsfunktion, um schnell den State eines einzelnen Bieres abzufragen
    const getBeerState = (beerId) => {
        return trackingData[beerId] || {
            isOnMerkliste: false,
            rating: null,
            drinkTimestamps: []
        };
    };

    return {
        trackingData,
        getBeerState,
        toggleMerkliste,
        logDrink,
        removeDrink,
        rateBeer
    };
};

export default useTracking;
