import apiRequest from './apiService';

// Standard-Cache-Dauer: 24 Stunden (in Millisekunden)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export const fetchCachedData = async (endpoint, token = null, forceRefresh = false) => {
    const cacheKey = `qordio_cache_${endpoint}`;
    const timeKey = `${cacheKey}_timestamp`;

    if (!forceRefresh) {
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(timeKey);

        if (cachedData && cachedTime) {
            const now = Date.now();
            if (now - parseInt(cachedTime, 10) < CACHE_DURATION) {
                return JSON.parse(cachedData); // Gebe gültigen Cache zurück
            }
        }
    }

    // Wenn kein (gültiger) Cache da ist oder forceRefresh true ist:
    try {
        const data = await apiRequest(endpoint, 'GET', null, token);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(timeKey, Date.now().toString());
        return data;
    } catch (error) {
        console.error(`Fehler beim Laden von ${endpoint}:`, error);
        // Fallback auf abgelaufenen Cache, falls das Backend offline ist
        const staleData = localStorage.getItem(cacheKey);
        if (staleData) return JSON.parse(staleData);
        throw error;
    }
};

export const clearCache = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('qordio_cache_')) {
            localStorage.removeItem(key);
        }
    });
};