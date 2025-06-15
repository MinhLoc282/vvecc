import React from 'react';
import { Navigate } from 'react-router-dom';
import { LOCATION } from '../../constants';

const PublicRoute = ({ children }) => {
  // Get email and kyc status from localStorage
  const email = localStorage.getItem('email');
  const kyc = localStorage.getItem('kyc') === 'true';

  // If both email and kyc are present, redirect to user dashboard
  if (email && kyc) {
    return <Navigate to={LOCATION.USER_DASHBOARD} replace />;
  }

  return children;
};

export default PublicRoute;
