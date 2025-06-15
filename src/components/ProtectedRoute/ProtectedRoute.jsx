import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth-client';
import { authService } from '../../services/authService';

const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  // Kiểm tra authentication bằng authService
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Lấy user info từ authService
  const user = authService.getCurrentUser();
  
  if (!user || !user.kyc) {
    return <Navigate to="/kyc" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;