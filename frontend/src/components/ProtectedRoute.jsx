import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth(); 

  if (loading) {
    return <p className="text-center mt-20">Loading authentication...</p>; 
  }

  if (!token) {
    
    return <Navigate to="/login" replace />;
  }

  return children; 
};

export default ProtectedRoute;