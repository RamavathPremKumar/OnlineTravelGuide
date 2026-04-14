/**
 * API Configuration
 * Exports the base URL for API calls based on the environment.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default {
  API_BASE_URL
};
