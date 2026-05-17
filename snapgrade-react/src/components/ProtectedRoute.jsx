import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (requiredRole && userProfile.role !== requiredRole) {
    return <Navigate to={userProfile.role === 'admin' ? '/admin/dashboard' : '/home'} replace />;
  }
  return children;
}
