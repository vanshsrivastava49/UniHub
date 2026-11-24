import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  return localStorage.getItem('token') ? <>{children}</> : <Navigate to="/Login" replace />;
};

export default ProtectedRoute;