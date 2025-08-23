import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../lib/authUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;