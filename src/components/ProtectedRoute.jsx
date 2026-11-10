import { Navigate, useLocation } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { toast }    from 'react-toastify';

function getDefaultRouteForRole(role) {
  return role === 'admin' ? '/admin/dashboard' : '/home';
}

export default function ProtectedRoute({ children, requiredRole, denyOnRoleMismatch = false }) {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-sm font-semibold text-slate-500 dark:bg-[#0d0e15] dark:text-slate-400">
        Loading...
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userProfile.isActive === false) {
    toast.error('Your account is inactive. Please contact support.');
    toast.error('Your account is inactive. Please contact support at jechrispalku56@gmail.com');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userProfile.role !== requiredRole) {
    if (denyOnRoleMismatch) {
      return <Navigate to="/access-denied" state={{ from: location }} replace />;
    }
    return <Navigate to={getDefaultRouteForRole(userProfile.role)} replace />;
  }
  return children;
}
