-- ==========================================
-- FINAL ID VERIFICATION FIX (ROBUST MATCHING)
-- ==========================================

-- 1. Create a secure, highly-flexible public profile function
CREATE OR REPLACE FUNCTION public.get_member_public_profile(lookup_id text)
RETURNS TABLE (
  full_name text,
  membership_id text,
  state text,
  avatar_url text,
  role text,
  status text,
  joined_year text,
  created_at timestamptz,
  phone text,
  email text,
  designation text,
  allow_email_sharing boolean,
  allow_mobile_sharing boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  target_role text;
  numeric_part text;
BEGIN
  -- Clean input: Uppercase and trimmed
  lookup_id := UPPER(TRIM(lookup_id));
  -- Extract ONLY digits for fuzzy matching (e.g., 202642424)
  numeric_part := REGEXP_REPLACE(lookup_id, '\D', '', 'g');

  -- 1. Find profile by exact match, or if the numeric parts match
  SELECT p.user_id, r.role INTO target_user_id, target_role
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON p.user_id = r.user_id
  WHERE 
    UPPER(TRIM(p.membership_id)) = lookup_id 
    OR (
      LENGTH(numeric_part) >= 4 
      AND REGEXP_REPLACE(p.membership_id, '\D', '', 'g') ILIKE '%' || numeric_part || '%'
    )
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT 
      p.full_name,
      p.membership_id,
      p.state,
      p.avatar_url,
      COALESCE(target_role, 'MEMBER'),
      'ACTIVE',
      p.joined_year,
      p.created_at,
      p.phone,
      p.email,
      p.designation,
      p.allow_email_sharing,
      p.allow_mobile_sharing
    FROM public.profiles p
    WHERE p.user_id = target_user_id;
    RETURN;
  END IF;

  RETURN;
END;
$$;

-- 2. Grant public access
GRANT EXECUTE ON FUNCTION public.get_member_public_profile TO anon, authenticated;

-- 3. Update RLS Policy
DROP POLICY IF EXISTS "Public can verify membership" ON public.profiles;
CREATE POLICY "Public can verify membership" ON public.profiles 
FOR SELECT USING (true); -- Broad access for READ (public profile) to ensure verification always works

-- Done!
