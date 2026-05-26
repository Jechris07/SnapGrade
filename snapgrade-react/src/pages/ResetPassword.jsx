import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../supabase';
import { validatePassword } from '../services/authService';

const RECOVERY_SESSION_KEY = 'snapgrade-password-recovery';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    function getUrlAuthParams() {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      return {
        accessToken: hashParams.get('access_token'),
        refreshToken: hashParams.get('refresh_token'),
        code: searchParams.get('code'),
        type: searchParams.get('type') || hashParams.get('type'),
      };
    }

    async function initializeResetSession() {
      const { accessToken, refreshToken, code, type } = getUrlAuthParams();
      const cameFromRecoveryLink = type === 'recovery' || Boolean(accessToken && refreshToken) || Boolean(code);
      const storedRecoverySession = sessionStorage.getItem(RECOVERY_SESSION_KEY) === 'true';

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          toast.error('Invalid reset link. Please request a new one.');
          navigate('/forgot-password', { replace: true });
          return;
        }

        if (!mounted) return;
        if (cameFromRecoveryLink) {
          sessionStorage.setItem(RECOVERY_SESSION_KEY, 'true');
        }
        setIsRecoveryFlow(cameFromRecoveryLink || storedRecoverySession);
        setCheckingSession(false);
        window.history.replaceState(null, document.title, window.location.pathname);
      } catch (error) {
        console.error('Reset session error:', error);
        toast.error('Invalid reset link. Please request a new one.');
        navigate('/forgot-password', { replace: true });
      }
    }

    initializeResetSession();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || checkingSession) return;

    if (!isRecoveryFlow && !currentPassword) {
      toast.error('Please enter your current password.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      toast.error(pwError);
      return;
    }

    setLoading(true);
    try {
      const updatePayload = isRecoveryFlow
        ? { password: newPassword }
        : { password: newPassword, current_password: currentPassword };

      const { error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      sessionStorage.removeItem(RECOVERY_SESSION_KEY);
      await supabase.auth.signOut({ scope: 'local' });
      toast.success('Password updated successfully. Please log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Password update error:', error);
      const message = error.message?.toLowerCase().includes('current')
        ? 'Current password is incorrect.'
        : error.message || 'Failed to update password. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="auth-bg">
        <div className="auth-card text-center">
          <h1 className="text-2xl font-black text-indigo-950">Checking reset link...</h1>
          <p className="text-sm text-gray-400 mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">⚡</div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-indigo-950">Reset Your Password</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isRecoveryFlow ? 'Enter your new password below' : 'Confirm your current password before choosing a new one'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isRecoveryFlow && (
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <input
                  className="form-input pr-16"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  data-form-type="other"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 text-xs font-bold text-indigo-600"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input
                className="form-input pr-16"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
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
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <div className="relative">
              <input
                className="form-input pr-16"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
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
            {confirmPassword && (
              <p className={`text-xs mt-1.5 font-semibold ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>
          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-5">
          Remember your password?{' '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
