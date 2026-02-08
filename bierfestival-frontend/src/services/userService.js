const API_BASE_URL = '/api/users';

/**
 * Ruft das Benutzerprofil vom Backend ab.
 * Erwartet, dass das Backend ein Objekt mit { keycloakId, username, email, firstName, lastName, locationLimit } zurückgibt.
 * @param {string} token - Das Keycloak Access Token.
 * @returns {Promise<object>} Das Benutzerprofil.
 */
const fetchUserProfile = async (token) => {
  if (!token) {
    throw new Error("No token provided for fetching user profile.");
  }
  try {
    const response = await fetch(`${API_BASE_URL}/me`, { 
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text(); 
      console.error(`Error fetching user profile: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to fetch user profile. Status: ${response.status}. Body: ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchUserProfile:", error);
    throw error;
  }
};

export default {
  fetchUserProfile,
};