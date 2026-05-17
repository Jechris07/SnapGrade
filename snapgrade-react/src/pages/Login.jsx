import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { userProfile, setUserProfile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      navigate(userProfile.role === 'admin' ? '/admin/dashboard' : '/home', { replace: true });
    }
  }, [navigate, userProfile]);

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
      toast.success(`Welcome to Snapgrade!, ${user.name}!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-indigo-950">Welcome to Snapgrade!</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to continue your study session</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input
                className="form-input pr-16"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                data-form-type="other"
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
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
          <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-800">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
