import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resetPassword } from '../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email.'); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-indigo-950">Forgot Password?</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your email to reset your password</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800">Sign in</Link>
        </p>
      </div>
    </div>
  );
}