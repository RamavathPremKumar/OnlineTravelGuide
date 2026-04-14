import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const cleanToken = (token) => {
    if (!token) return '';
    // Remove any surrounding quotes and trim whitespace
    return token.toString().replace(/^["']|["']$/g, '').trim();
  };

  const checkAuth = () => {
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (storedToken && userData) {
      try {
        const cleanedToken = cleanToken(storedToken);
        setUser(JSON.parse(userData));
        setToken(cleanedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing auth data:', error);
        logout();
      }
    } else {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    
    const handleStorage = () => checkAuth();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = (token, userData) => {
    const cleanedToken = cleanToken(token);
    
    localStorage.setItem('token', cleanedToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(cleanedToken);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('storage'));
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated,
      user, 
      token,
      loading, 
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};