-- Fix Supabase "Function Search Path Mutable" warnings.
-- Run this in the Supabase SQL Editor for the project.
--
-- These CREATE OR REPLACE statements keep the existing behavior but pin each
-- SECURITY DEFINER function to an empty search_path. All external references
-- are schema-qualified, which prevents object-shadowing through public search.

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
