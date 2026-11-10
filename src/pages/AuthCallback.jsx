import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { supabase } from '../supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    let hasNavigated = false;

    function finishAuth(session) {
      if (!mounted || hasNavigated || !session?.user) return;
      hasNavigated = true;
      toast.success('Email confirmed. Welcome to Snapgrade!');
      navigate('/home', { replace: true });
    }

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const callbackError = params.get('error_description') || hashParams.get('error_description');

        if (callbackError) {
          throw new Error(callbackError);
        }

        const code = params.get('code');
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          finishAuth(data.session);
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        finishAuth(data.session);
      } catch (error) {
        if (!mounted) return;
        const message = error.message || 'We could not verify your email link. Please try signing in again.';
        setErrorMessage(message);
        toast.error(message);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        finishAuth(session);
      }
    });

    handleCallback();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="auth-bg">
      <div className="auth-card text-center" style={{ maxWidth: 440 }}>
        {errorMessage ? (
          <>
            <h1 className="text-2xl font-black text-indigo-950">Verification link problem</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">{errorMessage}</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex justify-center">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-indigo-950">Confirming your account...</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Hang tight while we finish verifying your email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
