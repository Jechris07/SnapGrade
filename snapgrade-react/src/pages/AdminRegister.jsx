// ─────────────────────────────────────────────────────────────────
//  pages/AdminRegister.jsx - Temporary admin account creation
// ─────────────────────────────────────────────────────────────────
import { useState }             from 'react';
import { Link, useNavigate }    from 'react-router-dom';
import { toast }                from 'react-toastify';
import { createAdminAccount, validatePassword } from '../services/authService';
import PasswordChecklist        from '../components/PasswordChecklist';
import { useAuth }              from '../context/AuthContext';

export default function AdminRegister() {
  const navigate = useNavigate();
  const { setUserProfile } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const allRulesMet = [
    password.length >= 12 && password.length <= 15,
    /[A-Z]/.test(password), /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  ].every(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password || !confirm) { toast.error('Please fill in all fields.'); return; }
    const pwError = validatePassword(password);
    if (pwError) { toast.error(pwError); return; }
    if (password !== confirm) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    let created = false;
    try {
      await createAdminAccount(name, email, password);
      created = true;
      setUserProfile(null);
      toast.success('Admin account created successfully! Please log in.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      if (created) navigate('/login', { replace: true });
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div className="auth-logo">👑</div>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-indigo-950">Create Admin Account</h1>
          <p className="text-sm text-gray-400 mt-1">Administrative access for SnapGrade</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Admin Name"/>
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@snapgrade.com"/>
          </div>
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <input className="form-input pr-10" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create admin password"
                autoComplete="new-password"
                data-form-type="other"
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}/>
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordChecklist password={password}/>
          </div>
          <div>
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <input className="form-input pr-10" type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm admin password"
                autoComplete="new-password"
                data-form-type="other"
                onCopy={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}/>
              <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {confirm && (
              <p className={`text-xs mt-1.5 font-semibold ${password === confirm ? 'text-green-600' : 'text-red-500'}`}>
                {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>
          <button className="btn-primary mt-2" type="submit" disabled={loading || !allRulesMet}>
            {loading ? 'Creating Admin...' : 'Create Admin Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
