const apiRequest = async (url, method = 'GET', body = null, token) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      let errorData;
      try {
        // Versuche, eine JSON-Fehlermeldung vom Backend zu parsen
        errorData = await response.json();
      } catch (e) {
        // Fallback, wenn die Fehlermeldung kein JSON ist
        errorData = { message: response.statusText || `HTTP error ${response.status}` };
      }
      // Erzeuge einen Fehler mit der Nachricht vom Backend oder einem generischen Text
      const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status; // Dies macht den Status-Code im catch-Block verfügbar.
      throw error;
    }
    if (response.status === 204) { // No Content, z.B. bei erfolgreichem DELETE
      return null;
    }
    return await response.json(); // Parst die JSON-Antwort vom Backend
  } catch (error) {
    console.error("API request error in apiService:", error.message);
    throw error; // Wirft den Fehler weiter, damit er in der Komponente behandelt werden kann
  }
};

export default apiRequest;