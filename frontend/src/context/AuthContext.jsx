import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization']; 
        }
        setLoading(false); 
    }, [token]); 

    const login = async (email, password) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/users/login', { email, password });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('token', receivedToken);
            localStorage.setItem('user', JSON.stringify(receivedUser)); 
            setToken(receivedToken);
            setUser(receivedUser); 

            axios.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;

            console.log('Login successful, navigating to /dashboard');
            navigate('/dashboard');
            return { success: true, user: receivedUser };
        } catch (err) {
            console.error('Login error in AuthContext:', err.response?.data || err);
            const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(errorMessage);
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user'); 
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        setToken(null);
        setUser(null);
        setError('');
        delete axios.defaults.headers.common['Authorization']; 
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
    };

    return (
        <AuthContext.Provider value={value}>
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