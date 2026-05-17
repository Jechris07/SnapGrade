// ─────────────────────────────────────────────────────────────────
//  services/authService.js  — Supabase version
// ─────────────────────────────────────────────────────────────────

import { supabase } from '../supabase';

const SUPABASE_REQUEST_TIMEOUT_MS = 8000;
const SUPABASE_CLEANUP_TIMEOUT_MS = 2000;

function withTimeout(promise, timeoutMs = SUPABASE_REQUEST_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
    }),
  ]);
}

function profileFromAuthUser(authUser, role = authUser?.user_metadata?.role || 'student') {
  return {
    uid: authUser.id,
    name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email,
    role,
    isActive: true,
  };
}

function profileFromRow(row) {
  return {
    uid: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isActive: row.is_active,
  };
}

async function saveUserProfile(authUser, role) {
  const profile = profileFromAuthUser(authUser, role);
  const { error } = await withTimeout(
    supabase
      .from('users')
      .upsert({
        id: authUser.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        is_active: profile.isActive,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
  );

  if (error) throw error;
  return profile;
}

async function clearSignupSession() {
  try {
    const { error } = await withTimeout(
      supabase.auth.signOut({ scope: 'local' }),
      SUPABASE_CLEANUP_TIMEOUT_MS
    );
    if (error) console.warn('Could not clear signup session:', error.message);
  } catch (error) {
    console.warn('Signup session cleanup timed out.');
  }
}

export function validatePassword(p) {
  if (p.length < 12 || p.length > 15)
    return 'Password must be 12 to 15 characters long.';
  if (!/[A-Z]/.test(p))
    return 'Password must include at least one capital letter (A–Z).';
  if (!/[a-z]/.test(p))
    return 'Password must include at least one lowercase letter (a–z).';
  if (!/[0-9]/.test(p))
    return 'Password must include at least one number (0–9).';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(p))
    return 'Password must include at least one symbol (e.g. @, #, $, !).';
  return null;
}

export async function loginUser(email, password) {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email: email.trim(), password })
  );
  if (error) {
    console.error('Login error:', error);
    throw new Error('Incorrect email or password.');
  }
  if (!data?.user) throw new Error('Login failed. Please try again.');

  const fallbackProfile = profileFromAuthUser(data.user);
  let userData;
  let userError;

  try {
    ({ data: userData, error: userError } = await withTimeout(
      supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
    ));
  } catch (profileError) {
    if (profileError.message === 'Request timed out') {
      return fallbackProfile;
    }

    console.error('User profile request error:', profileError);
    return fallbackProfile;
  }

  if (userError) {
    if (userError.code === 'PGRST116') {
      try {
        return await saveUserProfile(data.user, fallbackProfile.role);
      } catch (profileError) {
        console.error('Could not create missing user profile:', profileError);
        return fallbackProfile;
      }
    }

    console.error('User profile error:', userError);
    return fallbackProfile;
  }

  if (!userData.is_active) {
    await clearSignupSession();
    throw new Error('Your account has been deactivated. Contact support.');
  }
  return profileFromRow(userData);
}

export async function registerUser(name, email, password, role = 'student') {
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            role,
          },
        },
      })
    );

    if (error) {
      if (error.message.toLowerCase().includes('already')) {
        throw new Error('Email is already registered.');
      }
      console.error('Sign-up error:', error);
      throw new Error('Registration failed. Please try again.');
    }
    if (!data?.user?.id) {
      throw new Error('Registration failed. Please try again.');
    }

    try {
      return await saveUserProfile(data.user, role);
    } catch (profileError) {
      console.warn('Account was created, but the profile row could not be saved:', profileError);
      return profileFromAuthUser(data.user, role);
    }
  } catch (error) {
    if (error.message === 'Request timed out') {
      throw new Error('Registration is taking too long. Please check your connection and try again.');
    }
    if (error.message === 'Email is already registered.') throw error;

    console.error('Registration error:', error);
    throw new Error('Registration failed. Please try again.');
  } finally {
    await clearSignupSession();
  }
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) {
    console.error('Reset password error:', error);
    if (error.message.includes('Invalid email')) {
      throw new Error('Please enter a valid email address.');
    }
  }
}

export async function updateUserName(uid, name) {
  const { error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', uid);
  if (error) throw new Error(error.message);
}

export async function toggleUserActive(uid, isActive) {
  const { error } = await supabase
    .from('users')
    .update({ is_active: !isActive })
    .eq('id', uid);
  if (error) throw new Error(error.message);
}

export async function promoteToAdmin(uid) {
  const { error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('id', uid);
  if (error) throw new Error('Failed to promote user to admin: ' + error.message);
}

export async function demoteFromAdmin(uid) {
  const { error } = await supabase
    .from('users')
    .update({ role: 'student' })
    .eq('id', uid);
  if (error) throw new Error('Failed to demote user from admin: ' + error.message);
}

export async function createAdminAccount(name, email, password) {
  return registerUser(name, email, password, 'admin');
}
