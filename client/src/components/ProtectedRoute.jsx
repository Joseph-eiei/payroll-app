import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken } from '../utils/auth';

const ProtectedRoute = () => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  // Optional: Add token validation logic here if needed (e.g., check expiry)
  return <Outlet />; // Renders child routes if authenticated
};

export default ProtectedRoute;