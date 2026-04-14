import { apiRequest } from './api';

// Search for city/place names only
export const searchLocations = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const result = await apiRequest('/locations/search', 'GET', { q: query });
    return result.data || [];
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
};

// Get tourist places within a selected city
export const searchCityPlaces = async (cityName, lat, lon) => {
  try {
    const result = await apiRequest('/locations/city-places', 'GET', { 
      city: cityName, 
      lat, 
      lon 
    });
    return result.data || [];
  } catch (error) {
    console.error('Error searching city places:', error);
    return [];
  }
};

// Get places along route
export const getPlacesAlongRoute = async (startCoords, endCoords) => {
  try {
    const result = await apiRequest('/locations/places-along-route', 'POST', {
      startLat: startCoords.lat,
      startLon: startCoords.lon,
      endLat: endCoords.lat,
      endLon: endCoords.lon
    });
    return result.data || [];
  } catch (error) {
    console.error('Error getting places along route:', error);
    return [];
  }
};