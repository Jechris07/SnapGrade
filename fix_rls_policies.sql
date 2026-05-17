-- Secure Supabase RLS policies for SnapGrade.
-- Run this in the Supabase SQL Editor after creating the public.users table.
--
-- First admin note:
-- Create a normal account first, then promote the first admin manually in the
-- Supabase dashboard or with a trusted service-role script. Do not expose
-- service-role keys in the browser.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(is_active, false)
  FROM public.users
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
REVOKE ALL ON FUNCTION public.current_user_is_active() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_active() TO authenticated;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert student profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view permitted profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own safe fields" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

CREATE POLICY "Users can insert student profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND role = 'student'
  AND is_active = true
);

CREATE POLICY "Users can view permitted profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_admin()
);

CREATE POLICY "Users can update own safe fields"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  AND public.current_user_is_active()
)
WITH CHECK (
  auth.uid() = id
  AND role = public.current_user_role()
  AND is_active = public.current_user_is_active()
);

CREATE POLICY "Admins can manage users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
