import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api'; 

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
    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setError('');
        console.log('Logged out, navigating to /login');
        navigate('/login');
    }, [navigate]); 

    useEffect(() => {
        setLoading(false); 
    }, []);

    useEffect(() => {
        const interceptor = API.interceptors.response.use(
            response => response,
            async (err) => {
                const originalRequest = err.config;
                if (err.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/users/login')) {
                    originalRequest._retry = true; 
                    console.warn('401 Unauthorized caught by interceptor. Attempting logout...');
                    logout();
                    return Promise.reject(err);
                }
                return Promise.reject(err); 
            }
        );
        return () => {
            API.interceptors.response.eject(interceptor);
        };
    }, [logout]); 


    const login = async (email, password) => {
        setLoading(true);
        setError('');
        try {
            const res = await API.post('/users/login', { email, password });
            const { token: receivedToken, user: receivedUser } = res.data;
            localStorage.setItem('token', receivedToken);
            localStorage.setItem('user', JSON.stringify(receivedUser));
            setToken(receivedToken);
            setUser(receivedUser);

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