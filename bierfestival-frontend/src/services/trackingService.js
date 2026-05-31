import { getDeviceId } from './deviceService';

const LOCAL_STORAGE_KEY = 'bierfestival_tracking';
const RETRY_QUEUE_KEY = 'bierfestival_sync_queue';
const RETRY_INTERVAL_MS = 30000; // 30 Sekunden
let retryTimerActive = false;

// ====================================
// Local Tracking (Client-seitig)
// ====================================

// Lese aktuelles Tracking synchron aus dem Cache
export const getLocalTracking = () => {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
};

// Speichere in LocalStorage und triggere React Components
export const saveLocalTracking = (trackingData) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trackingData));
    window.dispatchEvent(new Event('trackingUpdated'));
};

// ====================================
// Consent-Check
// ====================================

const hasTrackingConsent = () => {
    const consents = JSON.parse(localStorage.getItem('bierfestival_consents') || '{}');
    return consents.festivalSync === true;
};

// ====================================
// Retry Queue (Silent Offline-Resilient Sync)
// ====================================

const getRetryQueue = () => {
    try {
        const data = localStorage.getItem(RETRY_QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const saveRetryQueue = (queue) => {
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
};

const enqueueRequest = (url, method, body) => {
    const queue = getRetryQueue();
    queue.push({
        url,
        method,
        body,
        createdAt: new Date().toISOString(),
        retries: 0
    });
    saveRetryQueue(queue);
    startRetryTimer();
};

// Verarbeitet die Retry-Queue still im Hintergrund
const processRetryQueue = async () => {
    const queue = getRetryQueue();
    if (queue.length === 0) {
        retryTimerActive = false;
        return;
    }

    const remaining = [];

    for (const item of queue) {
        try {
            const options = {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Device-Id': getDeviceId()
                }
            };
            if (item.body) {
                options.body = JSON.stringify(item.body);
            }
            const response = await fetch(item.url, options);

            // Nur bei echtem Netzwerk-/Serverfehler (5xx) erneut versuchen.
            // 4xx Fehler (z.B. 400, 404) sind permanente Fehler und werden verworfen.
            if (response.ok || (response.status >= 400 && response.status < 500)) {
                // Erfolgreich synchronisiert oder permanenter Fehler → aus Queue entfernen
                continue;
            } else {
                // Server-Fehler (5xx) → erneut versuchen
                item.retries = (item.retries || 0) + 1;
                if (item.retries < 20) { // Max 20 Versuche (~10 Minuten bei 30s Intervall)
                    remaining.push(item);
                }
            }
        } catch (e) {
            // Netzwerkfehler (Offline) → erneut versuchen
            item.retries = (item.retries || 0) + 1;
            if (item.retries < 20) {
                remaining.push(item);
            }
        }
    }

    saveRetryQueue(remaining);

    if (remaining.length > 0) {
        startRetryTimer();
    } else {
        retryTimerActive = false;
    }
};

const startRetryTimer = () => {
    if (retryTimerActive) return;
    retryTimerActive = true;
    setTimeout(() => {
        processRetryQueue();
    }, RETRY_INTERVAL_MS);
};

// ====================================
// Backend-Sync (Fire-and-Forget mit Retry)
// ====================================

const syncToBackend = async (url, method, body) => {
    if (!hasTrackingConsent()) return;

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

        const response = await fetch(url, options);

        // Wenn Server antwortet, aber mit 5xx → in Queue für späteren Retry
        if (!response.ok && response.status >= 500) {
            enqueueRequest(url, method, body);
        }
        // response.ok → alles gut, nichts tun.
        // 4xx → permanenter Fehler (z.B. ungültige Daten), nichts erneut versuchen.
    } catch (e) {
        // Netzwerkfehler → Request konnte den Server nicht erreichen → Queue
        enqueueRequest(url, method, body);
    }
};

// ====================================
// Tracking-Aktionen (Public API)
// ====================================

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

    syncToBackend(`/api/tracking/${beerId}/getrunken`, 'DELETE', null);
};

export const rateBeer = (beerId, rating) => {
    const tracking = getLocalTracking();
    // Initialize beer entry if it doesn't exist yet
    if (!tracking[beerId]) {
        tracking[beerId] = { isOnMerkliste: false, drinkTimestamps: [], rating: null, ratedAt: null };
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

// ====================================
// Initialer Queue-Check beim App-Start
// ====================================
// Falls noch Einträge in der Queue sind (z.B. Seite wurde vorher geschlossen),
// starten wir den Retry-Timer sofort.
if (getRetryQueue().length > 0) {
    startRetryTimer();
}
