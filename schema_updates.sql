-- 1. Update the 'app_role' enum to include 'EVENT_MANAGER'
-- PostgreSQL doesn't support 'IF NOT EXISTS' for enum values easily, so we catch the exception.
DO $$ 
BEGIN
  BEGIN
    ALTER TYPE public.app_role ADD VALUE 'EVENT_MANAGER';
  EXCEPTION
    WHEN duplicate_object THEN null;
  END;
END $$;


-- 2. Add new columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='display_order') THEN
    ALTER TABLE public.profiles ADD COLUMN display_order INT DEFAULT 999;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='allow_mobile_sharing') THEN
    ALTER TABLE public.profiles ADD COLUMN allow_mobile_sharing BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='allow_email_sharing') THEN
    ALTER TABLE public.profiles ADD COLUMN allow_email_sharing BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='event_manager_expiry') THEN
    ALTER TABLE public.profiles ADD COLUMN event_manager_expiry TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- 3. Create a SECURITY DEFINER RPC to safely fetch public leadership profiles including their protected roles
CREATE OR REPLACE FUNCTION get_public_leaders()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  state TEXT,
  district TEXT,
  designation TEXT,
  avatar_url TEXT,
  instagram_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  display_order INT,
  role public.app_role
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.email,
    p.state,
    p.district,
    p.designation,
    p.avatar_url,
    p.instagram_url,
    p.facebook_url,
    p.twitter_url,
    p.linkedin_url,
    p.display_order,
    COALESCE(ur.role, 'MEMBER'::public.app_role) AS role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE p.is_leadership = true OR ur.role IN ('NATIONAL_CONVENER', 'NATIONAL_CO_CONVENER', 'STATE_CONVENER', 'STATE_CO_CONVENER', 'STATE_INCHARGE', 'STATE_CO_INCHARGE', 'DISTRICT_CONVENER', 'DISTRICT_CO_CONVENER', 'DISTRICT_INCHARGE', 'DISTRICT_CO_INCHARGE');
END;
$$;

-- 4. Create event_forms table for Event Manager dashboard
CREATE TABLE IF NOT EXISTS public.event_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  response_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_forms ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_forms' AND policyname='event_forms_auth_access') THEN
    CREATE POLICY "event_forms_auth_access" ON public.event_forms
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. Create event_form_responses table
CREATE TABLE IF NOT EXISTS public.event_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.event_forms(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.event_form_responses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_form_responses' AND policyname='event_responses_auth_access') THEN
    CREATE POLICY "event_responses_auth_access" ON public.event_form_responses
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
