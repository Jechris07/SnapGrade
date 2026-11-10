import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  throw new Error('Supabase configuration is missing. Please check your environment variables.');
}

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Supabase environment variables are not configured. Please update your .env file.');
  throw new Error('Supabase is not properly configured. Please update your environment variables.');
}

const browserSessionStorage = typeof window !== 'undefined'
  ? window.sessionStorage
  : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: browserSessionStorage,
    storageKey: 'snapgrade-auth-token',
    detectSessionInUrl: true
  }
});
