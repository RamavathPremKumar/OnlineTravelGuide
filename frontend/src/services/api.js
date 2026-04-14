const API_BASE_URL = 'http://localhost:5000/api';

// Generic API request function
export const apiRequest = async (endpoint, method = 'GET', data = null, token = null) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }
    
    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  // Send OTP
  sendOTP: (email) => apiRequest('/auth/send-otp', 'POST', { email }),
  
  // Verify OTP
  verifyOTP: (email, otp) => apiRequest('/auth/verify-otp', 'POST', { email, otp }),
  
  // Register
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  
  // Login
  login: (email, password) => apiRequest('/auth/login', 'POST', { email, password }),
  
  // Logout (client-side only)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Travel API functions (add later)
export const travelAPI = {
  // Will add later
};