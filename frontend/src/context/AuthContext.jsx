import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:8000/auth';

// Configure axios to include credentials (cookies) with requests
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/check-auth/`);
      if (response.data.authenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Not authenticated');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailAddress, password) => {
    try {
      const response = await axios.post(`${API_URL}/login/`, {
        emailAddress,
        password,
      });
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/logout/`);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/register/`, userData);
      setUser(response.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/`);
      if (response.data.user) {
        setUser(response.data.user);
      }
      return response.data;
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
