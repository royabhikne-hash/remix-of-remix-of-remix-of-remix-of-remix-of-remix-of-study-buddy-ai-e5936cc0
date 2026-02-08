-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'pro');

-- Create upgrade request status enum
CREATE TYPE public.upgrade_request_status AS ENUM ('pending', 'approved', 'rejected', 'blocked');

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'basic',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  tts_used INTEGER NOT NULL DEFAULT 0,
  tts_limit INTEGER NOT NULL DEFAULT 150000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id)
);

-- Create upgrade_requests table
CREATE TABLE public.upgrade_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  requested_plan subscription_plan NOT NULL DEFAULT 'pro',
  status upgrade_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Subscriptions RLS policies
-- Deny anonymous access
CREATE POLICY "Deny anonymous access to subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Students can view own subscription
CREATE POLICY "Students can view own subscription"
ON public.subscriptions
AS RESTRICTIVE
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Deny student modifications to subscriptions
CREATE POLICY "Deny student insert on subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny student update on subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR UPDATE
USING (false);

CREATE POLICY "Deny student delete on subscriptions"
ON public.subscriptions
AS RESTRICTIVE
FOR DELETE
USING (false);

-- Upgrade Requests RLS policies
-- Deny anonymous access
CREATE POLICY "Deny anonymous access to upgrade requests"
ON public.upgrade_requests
AS RESTRICTIVE
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Students can view own requests
CREATE POLICY "Students can view own upgrade requests"
ON public.upgrade_requests
AS RESTRICTIVE
FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Students can insert own requests
CREATE POLICY "Students can insert own upgrade requests"
ON public.upgrade_requests
AS RESTRICTIVE
FOR INSERT
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Deny student update/delete on upgrade requests
CREATE POLICY "Deny student update on upgrade requests"
ON public.upgrade_requests
AS RESTRICTIVE
FOR UPDATE
USING (false);

CREATE POLICY "Deny student delete on upgrade requests"
ON public.upgrade_requests
AS RESTRICTIVE
FOR DELETE
USING (false);

-- Create trigger for updated_at on subscriptions
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create basic subscription on student insert
CREATE OR REPLACE FUNCTION public.create_basic_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (student_id, plan, start_date, is_active)
  VALUES (NEW.id, 'basic', now(), true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto subscription on student creation
CREATE TRIGGER create_student_subscription
AFTER INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.create_basic_subscription();

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_student_id ON public.subscriptions(student_id);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan);
CREATE INDEX idx_upgrade_requests_student_id ON public.upgrade_requests(student_id);
CREATE INDEX idx_upgrade_requests_status ON public.upgrade_requests(status);