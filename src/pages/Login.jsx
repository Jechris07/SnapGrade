import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || null;

  function getDefaultRouteForRole(role) {
    return role === 'admin' ? '/admin/dashboard' : '/home';
  }

  function isAdminRoute(pathname) {
    return pathname?.startsWith('/admin') || pathname === '/dashboard';
  }

  function canAccessRoute(pathname, role) {
    if (!pathname || pathname === '/login' || pathname === '/') return false;
    if (isAdminRoute(pathname)) return role === 'admin';
    return role !== 'admin';
  }

  function getLoginDestination(user) {
    return canAccessRoute(redirectTo, user.role)
      ? redirectTo
      : getDefaultRouteForRole(user.role);
  }

  useEffect(() => {
    if (userProfile) {
      navigate(getLoginDestination(userProfile), { replace: true });
    }
  }, [navigate, userProfile, redirectTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(email, password);
      setUserProfile(user);
      toast.success(`Welcome back, ${user.name}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-split-form">
        <div className="auth-split-card">
          <div className="auth-card-brand">
            <span className="auth-card-brand-mark" aria-hidden="true">s</span>
            <span>SnapGrade</span>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-indigo-950">Back to your notes.</h1>
            <p className="text-sm text-gray-400 mt-2">Sign in to pick up your practice.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                id="login-email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="relative">
                <input
                  className="form-input pr-16"
                  id="login-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 text-xs font-bold text-indigo-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button className="btn-primary mt-2" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-400 mt-5">
            <Link to="/forgot-password" className="text-indigo-600 font-bold hover:text-indigo-800">Forgot password?</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            No account yet?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800">Create an account</Link>
          </p>
        </div>
      </div>

      <div className="auth-split-panel">
        <div className="auth-split-content">

          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-100/90">A space for focused study</p>
          <h2 className="mt-5">You’ve read it.<br />Now, recall it.</h2>
          <p className="mt-4 text-sm leading-6 text-white/80">
            Bring your notes. Make a quiz. Find out what you remember and what needs another look.
          </p>
          <div className="auth-note">01 &nbsp; Add your study notes<br />02 &nbsp; Test what you know<br />03 &nbsp; Review and try again</div>
        </div>
      </div>
    </div>
  );
}
