import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer }  from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import Navbar              from './components/Navbar';
import Login           from './pages/Login';
import Register        from './pages/Register';
import AuthCallback    from './pages/AuthCallback';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import AdminRegister   from './pages/AdminRegister';
import Home            from './pages/Home';
import Quiz            from './pages/Quiz';
import Results         from './pages/Results';
import History         from './pages/History';
import Achievements    from './pages/Achievements';
import Profile         from './pages/Profile';
import AdminDashboard  from './pages/AdminDashboard';
import AdminUsers      from './pages/AdminUsers';
import NotFound        from './pages/NotFound';
import AccessDenied    from './pages/AccessDenied';

function Layout({ children, darkMode, setDarkMode }) {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0d0e15] text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0d0e15] text-slate-900 dark:text-white transition-colors duration-300 px-4 pt-28 pb-12">
        {children}
      </div>
    </div>
  );
}

function RoleRedirect() {
  const { userProfile } = useAuth();
  if (!userProfile) return <Navigate to="/login" replace />;
  return <Navigate to={userProfile.role === 'admin' ? '/admin/dashboard' : '/home'} replace />;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const layout = children => (
    <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
      {children}
    </Layout>
  );

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/admin-register" element={<ProtectedRoute requiredRole="admin" denyOnRoleMismatch>{layout(<AdminRegister />)}</ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home"     element={<ProtectedRoute requiredRole="student">{layout(<Home />)}</ProtectedRoute>} />
          <Route path="/quiz"     element={<ProtectedRoute requiredRole="student">{layout(<Quiz />)}</ProtectedRoute>} />
          <Route path="/results"  element={<ProtectedRoute requiredRole="student">{layout(<Results />)}</ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute requiredRole="student">{layout(<History />)}</ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute requiredRole="student">{layout(<Achievements />)}</ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute requiredRole="student">{layout(<Profile />)}</ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin" denyOnRoleMismatch><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin" denyOnRoleMismatch>{layout(<AdminDashboard />)}</ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute requiredRole="admin" denyOnRoleMismatch>{layout(<AdminUsers />)}</ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />
      </AuthProvider>
    </BrowserRouter>
  );
}
