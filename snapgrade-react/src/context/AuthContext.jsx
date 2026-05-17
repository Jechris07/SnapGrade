// ─────────────────────────────────────────────────────────────────
//  context/AuthContext.jsx
//  Uses Supabase auth.
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { sanitizeEmail, sanitizeName, sanitizeRole } from '../utils/security';

const AuthContext = createContext(null);
const PROFILE_FETCH_TIMEOUT_MS = 300;

function profileFromAuthUser(authUser) {
  if (!authUser) return null;

  return {
    uid: authUser.id,
    name: sanitizeName(authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'),
    email: sanitizeEmail(authUser.email),
    role: sanitizeRole(authUser.user_metadata?.role || 'student'),
    isActive: true,
  };
}

function profileFromRow(row) {
  return {
    uid: row.id,
    name: sanitizeName(row.name),
    email: sanitizeEmail(row.email),
    role: sanitizeRole(row.role),
    isActive: row.is_active,
  };
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile request timed out')), timeoutMs);
    }),
  ]);
}

export function AuthProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const authRequestId = useRef(0);

  const fetchUserProfile = useCallback(async (authUser) => {
    const uid = authUser.id;
    const fallbackProfile = profileFromAuthUser(authUser);

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('users')
          .select('*')
          .eq('id', uid)
          .single(),
        PROFILE_FETCH_TIMEOUT_MS
      );

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('User profile not found, attempting to create...');
          const { error: insertError } = await withTimeout(
            supabase
              .from('users')
              .insert({
                id: uid,
                name: fallbackProfile.name,
                email: fallbackProfile.email,
                role: fallbackProfile.role,
                is_active: fallbackProfile.isActive,
                created_at: new Date().toISOString(),
              }),
            PROFILE_FETCH_TIMEOUT_MS
          );

          if (insertError) {
            console.error('Failed to create user profile:', insertError);
            return fallbackProfile;
          }

          console.log('User profile created successfully on login');
          return fallbackProfile;
        }

        console.error('Error fetching user profile:', error);
        return fallbackProfile;
      }

      return profileFromRow(data);
    } catch (error) {
      if (error.message === 'Profile request timed out') {
        return fallbackProfile;
      }

      console.error('Error in fetchUserProfile:', error);
      return fallbackProfile;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function applySession(session) {
      if (!mounted) return;
      const requestId = ++authRequestId.current;

      if (!session?.user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const profile = await fetchUserProfile(session.user);
      if (mounted && requestId === authRequestId.current) {
        setUserProfile(profile);
        setLoading(false);
      }
    }

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await applySession(session);
      } catch (error) {
        console.error('Session fetch error:', error);
        if (mounted) {
          setUserProfile(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(() => {
        applySession(session).catch((error) => {
          console.error('Auth state change error:', error);
          if (mounted) {
            setUserProfile(null);
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  async function refreshUserProfile(uid) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      const profile = await fetchUserProfile(user || { id: uid });
      setUserProfile(profile);
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }

  function saveUserProfile(user) {
    setUserProfile(user);
  }

  return (
    <AuthContext.Provider value={{ userProfile, setUserProfile: saveUserProfile, refreshUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
