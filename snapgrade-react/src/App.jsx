import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer }  from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider }    from './context/AuthContext';
import ProtectedRoute      from './components/ProtectedRoute';
import Navbar              from './components/Navbar';
import Login           from './pages/Login';
import Register        from './pages/Register';
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

function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: '#f0f4ff' }}>
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-register" element={<ProtectedRoute requiredRole="admin"><Layout><AdminRegister /></Layout></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/home"     element={<ProtectedRoute requiredRole="student"><Layout><Home /></Layout></ProtectedRoute>} />
          <Route path="/quiz"     element={<ProtectedRoute requiredRole="student"><Layout><Quiz /></Layout></ProtectedRoute>} />
          <Route path="/results"  element={<ProtectedRoute requiredRole="student"><Layout><Results /></Layout></ProtectedRoute>} />
          <Route path="/history"  element={<ProtectedRoute requiredRole="student"><Layout><History /></Layout></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute requiredRole="student"><Layout><Achievements /></Layout></ProtectedRoute>} />
          <Route path="/profile"  element={<ProtectedRoute requiredRole="student"><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
          <Route path="/admin/users"     element={<ProtectedRoute requiredRole="admin"><Layout><AdminUsers /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} closeOnClick pauseOnHover />
      </AuthProvider>
    </BrowserRouter>
  );
}
