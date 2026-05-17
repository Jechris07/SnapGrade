/*
-- TEMPORARY FIX: Disable RLS to allow registration
-- Run this FIRST in Supabase SQL Editor to allow registration to work
-- Then you can enable proper policies later

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Optional: Clean up any existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can do everything" ON users;
*/