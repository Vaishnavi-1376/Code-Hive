import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  const fetchUser = useCallback(async (authToken) => {
    if (!authToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch user profile:', err.response?.data || err);
      localStorage.removeItem('token'); 
      setToken(null);
      setUser(null);
      setError(err.response?.data?.message || 'Session expired or invalid. Please log in again.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.log('Redirecting to login due to invalid/expired token during profile fetch.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      if (storedToken !== token || !user) {
        setToken(storedToken); 
        fetchUser(storedToken);
      } else {
        setLoading(false); 
      }
    } else {
      setToken(null);
      setUser(null);
      setLoading(false); 
    }
  }, [fetchUser, token, user]); 

  // Login function
  const login = async (email, password) => {
    setLoading(true); 
    setError(''); 
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
      const receivedToken = res.data.token;
      localStorage.setItem('token', receivedToken); 
      setToken(receivedToken); 

      await fetchUser(receivedToken);

      console.log('Login successful, navigating to /dashboard');
      navigate('/dashboard'); 
      return res.data; 
    } catch (err) {
      console.error('Login error in AuthContext:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage); 
      setToken(null); 
      setUser(null); 
      localStorage.removeItem('token'); 
      throw err; 
    } finally {
      setLoading(false); 
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token'); 
    setToken(null); 
    setUser(null); 
    setError(''); 
    console.log('Logged out, navigating to /login');
    navigate('/login'); 
  };

  const value = {
    token,
    user,
    loading, 
    error, 
    login,
    logout,
    setUser, 
    fetchUser, 
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && !user && <div>Loading authentication...</div>}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};