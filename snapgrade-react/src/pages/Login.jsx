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
  const [remember, setRemember] = useState(false);
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
      toast.success(`Welcome back, ${user.name}!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-form-panel">
        <div className="text-center mb-8">
          <div className="login-logo">SG</div>
          <h1 className="text-3xl font-black text-indigo-950 mt-3">SnapGrade</h1>
          <p className="text-sm text-gray-500 mt-1">Log in to generate quizzes from your notes</p>
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

          <label className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember this device
          </label>

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
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

      <div className="login-visual-panel" aria-hidden="true">
        <div className="login-info-box">
          <h2>Study faster with AI-generated quizzes</h2>
          <p>Paste your class notes, choose the number of questions, and practice right away.</p>
          <ul>
            <li>Track your quiz history</li>
            <li>Review scores after each attempt</li>
            <li>Earn badges as you improve</li>
          </ul>
        </div>
        <div className="login-sky"></div>
        <div className="login-hill login-hill-left"></div>
        <div className="login-hill login-hill-right"></div>
        <div className="login-road"></div>
        <div className="login-road-line"></div>
        <div className="login-tree tree-one"></div>
        <div className="login-tree tree-two"></div>
      </div>
    </div>
  );
}
