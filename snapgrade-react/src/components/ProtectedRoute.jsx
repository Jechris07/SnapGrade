import { Navigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { toast }    from 'react-toastify';
import AccessDenied from '../pages/AccessDenied';

export default function ProtectedRoute({ children, requiredRole }) {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userProfile.isActive === false) {
    toast.error('Your account is inactive. Please contact support.');
    toast.error('Your account is inactive. Please contact support at jechrispalku56@gmail.com');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    return <AccessDenied />;
  }
  return children;
}
