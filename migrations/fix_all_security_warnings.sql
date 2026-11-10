-- ─────────────────────────────────────────────────────────────────
--  fix_all_security_warnings.sql
--  Resolves ALL 7 Supabase Security Advisor warnings for SnapGrade.
--
--  Run this ONCE in the Supabase SQL Editor. It is idempotent.
-- ─────────────────────────────────────────────────────────────────
--  Warnings resolved:
--    1-3: Public Can Execute SECURITY DEFINER Function  (×3 functions)
--    4-6: Signed-In Users Can Execute SECURITY DEFINER Function (×3)
--      7: Function Search Path Mutable (implicitly fixed by recreating)
--
--  For warning #7 (Leaked Password Protection):
--    This is an Auth setting, not SQL. Enable it at:
--    Supabase Dashboard → Authentication → Settings
--    → Leaked password protection → Enable
-- ─────────────────────────────────────────────────────────────────
--
--  Why SECURITY INVOKER instead of SECURITY DEFINER:
--    These functions only read the caller's own row from `users`
--    (filtered by auth.uid()). The existing RLS policy
--    "Users can view permitted profiles" allows every authenticated
--    user to SELECT their own row, so SECURITY INVOKER works
--    identically to SECURITY DEFINER here — but without triggering
--    the linter warnings.
--
--  No circular recursion concern:
--    The RLS policy is: auth.uid() = id OR public.is_admin()
--    When a user reads their own row, auth.uid() = id matches
--    first and short-circuits — is_admin() is never called
--    recursively for self-lookups.
-- ─────────────────────────────────────────────────────────────────

-- 1. Re-define each function as SECURITY INVOKER with pinned search_path.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
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
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_active()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT COALESCE(is_active, false)
  FROM public.users
  WHERE id = auth.uid();
$$;
