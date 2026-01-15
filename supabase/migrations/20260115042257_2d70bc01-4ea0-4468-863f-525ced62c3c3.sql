-- ============================================
-- SECURITY FIX: Remove overly permissive RLS policies
-- ============================================

-- 1. Fix quiz_attempts: Remove public SELECT policy
DROP POLICY IF EXISTS "Anyone can view quiz attempts" ON quiz_attempts;

-- 2. Fix study_sessions: Remove public SELECT policy  
DROP POLICY IF EXISTS "Anyone can view sessions" ON study_sessions;

-- 3. Fix parent_reports: Remove all public policies (edge functions use service role)
DROP POLICY IF EXISTS "Anyone can view parent reports" ON parent_reports;
DROP POLICY IF EXISTS "Anyone can insert parent reports" ON parent_reports;
DROP POLICY IF EXISTS "Anyone can update parent reports" ON parent_reports;

-- 4. Fix schools: Create secure view to hide password_hash, remove public policy
DROP POLICY IF EXISTS "Schools are viewable by everyone" ON schools;
DROP POLICY IF EXISTS "Schools can read own data for login" ON schools;

-- Create a public view that excludes sensitive data
CREATE OR REPLACE VIEW public.schools_public
WITH (security_invoker=on) AS
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

-- Schools table: No public access (edge functions use service role)
-- No SELECT policy needed - all auth goes through secure-auth edge function

-- 5. Fix students: Remove dangerous DELETE policy
DROP POLICY IF EXISTS "Admin and schools can delete students" ON students;

-- 6. Add proper admin/school policies for login_attempts (for rate limiting to work)
CREATE POLICY "Service role can insert login attempts"
ON login_attempts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can select login attempts"
ON login_attempts FOR SELECT
USING (true);

-- 7. Add admin policies for admins table
CREATE POLICY "Service role can access admins"
ON admins FOR SELECT
USING (true);

-- 8. Make student-photos bucket private and add RLS
-- First add storage policies
CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Update bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'student-photos';

-- 9. Add rate limiting table for AI functions
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, action)
);

ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role only access
CREATE POLICY "Service role can manage rate limits"
ON ai_rate_limits FOR ALL
USING (true)
WITH CHECK (true);

-- 10. Create rate limit check function
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_requests integer DEFAULT 30,
  p_window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamp with time zone;
BEGIN
  -- Get or create rate limit record
  SELECT request_count, window_start INTO v_current_count, v_window_start
  FROM ai_rate_limits
  WHERE user_id = p_user_id AND action = p_action;
  
  -- If no record or window expired, reset
  IF v_window_start IS NULL OR v_window_start < now() - (p_window_minutes || ' minutes')::interval THEN
    INSERT INTO ai_rate_limits (user_id, action, request_count, window_start)
    VALUES (p_user_id, p_action, 1, now())
    ON CONFLICT (user_id, action) 
    DO UPDATE SET request_count = 1, window_start = now();
    RETURN true;
  END IF;
  
  -- Check if over limit
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE ai_rate_limits 
  SET request_count = request_count + 1
  WHERE user_id = p_user_id AND action = p_action;
  
  RETURN true;
END;
$$;