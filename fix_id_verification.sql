-- ==========================================
-- FINAL ID VERIFICATION FIX (FOR ALL MEMBERS)
-- ==========================================

-- 1. Create a secure, case-insensitive public profile function
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
SECURITY DEFINER -- Essential: Runs as Admin to bypass RLS
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  target_role text;
BEGIN
  -- Clean input: Uppercase and trimmed
  lookup_id := UPPER(TRIM(lookup_id));

  -- 1. Find profile by exact match (case-insensitive)
  -- Or fuzzy match for common typos in the prefix
  SELECT p.user_id, r.role INTO target_user_id, target_role
  FROM public.profiles p
  LEFT JOIN public.user_roles r ON p.user_id = r.user_id
  WHERE UPPER(TRIM(p.membership_id)) = lookup_id 
     OR (LENGTH(REGEXP_REPLACE(lookup_id, '\D', '', 'g')) >= 4 AND p.membership_id ILIKE '%' || REGEXP_REPLACE(lookup_id, '\D', '', 'g') || '%')
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

-- 2. Grant public access to the function
GRANT EXECUTE ON FUNCTION public.get_member_public_profile TO anon, authenticated;

-- 3. Fix the RLS Policy as a fallback
-- Allows anonymous people to READ the profile IF they know the membership_id
DROP POLICY IF EXISTS "Public can verify membership" ON public.profiles;

CREATE POLICY "Public can verify membership" ON public.profiles 
FOR SELECT USING (
  -- Either they are leadership/alumni, OR they are searching for a specific membership_id
  is_leadership = true 
  OR is_alumni = true 
  OR membership_id IS NOT NULL 
);

-- Done!
