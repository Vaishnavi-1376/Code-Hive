import axios from 'axios';

const API = axios.create({
  // Use the environment variable here.
  // In local development, it will get the value from .env.local.
  // On Vercel, it will get the value from the Vercel project's environment variables.
  baseURL: import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;