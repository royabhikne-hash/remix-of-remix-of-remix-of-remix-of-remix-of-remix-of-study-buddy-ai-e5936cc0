-- Mark all existing schools and admins with plaintext passwords for forced reset
-- Plaintext passwords don't start with $2a$, $2b$, $2y$ (bcrypt) and aren't 64 hex chars (SHA-256)

UPDATE public.schools 
SET password_reset_required = true 
WHERE password_hash NOT LIKE '$2a$%' 
  AND password_hash NOT LIKE '$2b$%' 
  AND password_hash NOT LIKE '$2y$%'
  AND password_hash !~ '^[a-f0-9]{64}$';

UPDATE public.admins 
SET password_reset_required = true 
WHERE password_hash NOT LIKE '$2a$%' 
  AND password_hash NOT LIKE '$2b$%' 
  AND password_hash NOT LIKE '$2y$%'
  AND password_hash !~ '^[a-f0-9]{64}$';

-- Enable RLS on session_tokens and add strict policies
ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role can manage session tokens" ON public.session_tokens;

-- Recreate strict policy - only service role can access session_tokens
CREATE POLICY "Service role manages session tokens" 
ON public.session_tokens FOR ALL
USING (false)
WITH CHECK (false);

-- Fix login_attempts RLS - deny all client access
DROP POLICY IF EXISTS "Service role can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Service role can select login attempts" ON public.login_attempts;

CREATE POLICY "Deny all direct access to login_attempts" 
ON public.login_attempts FOR ALL
USING (false)
WITH CHECK (false);

-- Fix admins table RLS - deny all SELECT to prevent password hash exposure
DROP POLICY IF EXISTS "Service role can access admins" ON public.admins;

CREATE POLICY "Deny all direct access to admins" 
ON public.admins FOR ALL
USING (false)
WITH CHECK (false);

-- Fix schools table RLS - deny all SELECT to prevent password hash exposure  
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Schools can view own data" ON public.schools;

CREATE POLICY "Deny all direct access to schools" 
ON public.schools FOR ALL
USING (false)
WITH CHECK (false);

-- Drop and recreate schools_public view with proper security
DROP VIEW IF EXISTS public.schools_public;

CREATE VIEW public.schools_public
WITH (security_invoker = on) AS
SELECT 
  id,
  school_id,
  name,
  district,
  state,
  is_banned,
  fee_paid,
  created_at
FROM public.schools;

-- Grant access to schools_public view for anon/authenticated
GRANT SELECT ON public.schools_public TO anon, authenticated;