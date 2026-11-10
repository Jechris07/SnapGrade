import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import PasswordChecklist from '../components/PasswordChecklist';
import { validatePassword } from '../services/authService';
import { supabase } from '../supabase';
import { sanitizeEmail, sanitizeName } from '../utils/security';

function getAuthCallbackUrl() {
  if (import.meta.env.VITE_AUTH_CALLBACK_URL) {
    return import.meta.env.VITE_AUTH_CALLBACK_URL;
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:5173/auth-callback';
  }

  return `${window.location.origin}/auth-callback`;
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const allRulesMet = [
    password.length >= 12 && password.length <= 15,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  ].every(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const safeName = sanitizeName(name);
    const safeEmail = sanitizeEmail(email);

    if (!safeName || !safeEmail || !password || !confirm) {
      toast.error('Please fill in all fields.');
      return;
    }

    const pwError = validatePassword(password);
    if (pwError) {
      toast.error(pwError);
      return;
    }

    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: safeEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            name: safeName,
            role: 'student',
          },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already')) {
          throw new Error('Email is already registered.');
        }
        throw new Error(error.message || 'Registration failed. Please try again.');
      }

      setSubmittedEmail(safeEmail);
      setSignupComplete(true);
      toast.success('Account created. Please check your inbox to confirm your account.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        {signupComplete ? (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl text-indigo-700">
              @
            </div>
            <h1 className="text-2xl font-black text-indigo-950">Please check your inbox to confirm your account.</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              We sent a verification link{submittedEmail ? ` to ${submittedEmail}` : ''}. Open it to finish setting up your Snapgrade account.
            </p>
            <p className="mt-6 text-sm text-gray-400">
              Already confirmed?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-800">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-indigo-950">Create your account</h1>
              <p className="text-sm text-gray-400 mt-1">Start generating quizzes from your notes</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
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
                    placeholder="Create a strong password"
                    autoComplete="new-password"
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
                <PasswordChecklist password={password} />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <div className="relative">
                  <input
                    className="form-input pr-16"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    data-form-type="other"
                    onCopy={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 text-xs font-bold text-indigo-600"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirm && (
                  <p className={`text-xs mt-1.5 font-semibold ${password === confirm ? 'text-green-600' : 'text-red-500'}`}>
                    {password === confirm ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <button className="btn-primary mt-1" type="submit" disabled={loading || !allRulesMet}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
