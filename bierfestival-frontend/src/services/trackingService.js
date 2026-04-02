import { getDeviceId } from './deviceService';

const LOCAL_STORAGE_KEY = 'bierfestival_tracking';

// Lese aktuelles Tracking synchron aus dem Cache
export const getLocalTracking = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
};

// Speichere in LocalStorage und triggere React Components
export const saveLocalTracking = (trackingData) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trackingData));
    // Wir feuern ein Custom Event, damit unsere React Hooks (useTracking) automatisch updaten!
    window.dispatchEvent(new Event('trackingUpdated'));
};

// Checkt, ob der Nutzer beim Cookie-Banner das Festival-Tracking erlaubt hat
const hasTrackingConsent = () => {
    const consents = JSON.parse(localStorage.getItem('bierfestival_consents') || '{}');
    return consents.festival === true;
};

// Hilfsfunktion: Fire-and-Forget Request an das Backend
const syncToBackend = async (url, method, body) => {
    if (!hasTrackingConsent()) return; // Nichts an den Server schicken, wenn abgelehnt!

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Device-Id': getDeviceId()
            }
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        await fetch(url, options);
    } catch(e) {
        console.warn("Tracking sync missing or failed. Data is safe locally.", e);
    }
};

export const toggleMerkliste = (beerId) => {
    const tracking = getLocalTracking();
    if (!tracking[beerId]) tracking[beerId] = { beerId, drinkTimestamps: [] };

    const wasOnMerkliste = tracking[beerId].isOnMerkliste;
    const isOn = !wasOnMerkliste;
    const now = new Date().toISOString();

    tracking[beerId].isOnMerkliste = isOn;
    tracking[beerId].merklisteAddedAt = isOn ? now : null;

    saveLocalTracking(tracking);

    syncToBackend(`/api/tracking/${beerId}/merkliste`, 'PUT', {
        isOnMerkliste: isOn,
        merklisteAddedAt: isOn ? now : null
    });
};

export const logDrink = (beerId) => {
    const tracking = getLocalTracking();
    if (!tracking[beerId]) tracking[beerId] = { beerId, drinkTimestamps: [] };
    if (!tracking[beerId].drinkTimestamps) tracking[beerId].drinkTimestamps = [];

    const now = new Date().toISOString();
    tracking[beerId].drinkTimestamps.push(now);

    saveLocalTracking(tracking);

    syncToBackend(`/api/tracking/${beerId}/getrunken`, 'POST', {
        consumedAt: now
    });
};

export const removeDrink = (beerId) => {
    const tracking = getLocalTracking();
    if (!tracking[beerId] || !tracking[beerId].drinkTimestamps || tracking[beerId].drinkTimestamps.length === 0) {
        return;
    }
    
    // Remove the most recent one (last element)
    tracking[beerId].drinkTimestamps.pop();
    
    // Check if we need to clear rating too locally
    if (tracking[beerId].drinkTimestamps.length === 0) {
         tracking[beerId].rating = null;
         tracking[beerId].ratedAt = null;
    }
    
    saveLocalTracking(tracking);
    
    // Wir können bei DELETE keinen Payload mitsenden standardmäßig in fetch as body, aber Backend braucht das eh nicht
    syncToBackend(`/api/tracking/${beerId}/getrunken`, 'DELETE', null);
};

export const rateBeer = (beerId, rating) => {
    const tracking = getLocalTracking();
    // Regel: Ohne lokales Wissen über 'getrunken' ignorieren / werfen wir einen Fehler
    if (!tracking[beerId] || !tracking[beerId].drinkTimestamps || tracking[beerId].drinkTimestamps.length === 0) {
        throw new Error("Du musst das Bier erst probieren, bevor du es bewerten kannst!");
    }

    const now = new Date().toISOString();
    // Wenn das Rating identisch ist (z.B. User klickt nochmal auf den gleichen Stern), löschen wir es (Toggle)
    const newRating = tracking[beerId].rating === rating ? null : rating;

    tracking[beerId].rating = newRating;
    tracking[beerId].ratedAt = newRating ? now : null;

    saveLocalTracking(tracking);

    syncToBackend(`/api/tracking/${beerId}/rating`, 'PUT', {
        rating: newRating,
        ratedAt: newRating ? now : null
    });
};


