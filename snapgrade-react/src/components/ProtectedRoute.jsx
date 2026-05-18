import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { toast }    from 'react-toastify';

export default function ProtectedRoute({ children, requiredRole }) {
  const { userProfile, loading } = useAuth();

  if (loading) return null;

  if (!userProfile) return <Navigate to="/login" replace />;

  if (userProfile.isActive === false) {
    toast.error('Your account is inactive. Please contact support.');
    toast.error('Your account is inactive. Please contact support at jechrispalku56@gmail.com');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    return <Navigate to={userProfile.role === 'admin' ? '/admin/dashboard' : '/home'} replace />;
  }
  return children;
}
