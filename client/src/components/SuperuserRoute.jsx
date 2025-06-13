import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthToken, getAdminUser } from '../utils/auth';

const SuperuserRoute = () => {
  const token = getAuthToken();
  const user = getAdminUser();
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  if (!user || !user.is_superuser) {
    return <Navigate to="/admin/employees" replace />;
  }
  return <Outlet />;
};

export default SuperuserRoute;
