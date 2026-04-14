import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Search for city/place names only
export const searchLocations = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await axios.get(`${API_BASE_URL}/locations/search`, {
      params: { q: query }
    });
    
    return response.data.data || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Get tourist places within a selected city
export const searchCityPlaces = async (cityName, lat, lon) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/locations/city-places`, {
      params: { city: cityName, lat, lon }
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error searching city places:', error);
    return [];
  }
};

// Get places along route
export const getPlacesAlongRoute = async (startCoords, endCoords) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/locations/places-along-route`,
      {
        startLat: startCoords.lat,
        startLon: startCoords.lon,
        endLat: endCoords.lat,
        endLon: endCoords.lon
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error('Error getting places along route:', error);
    return [];
  }
};