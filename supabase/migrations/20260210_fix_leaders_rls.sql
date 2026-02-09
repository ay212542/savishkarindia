-- FIX LEADERS TABLE RLS
-- The table 'public.leaders' already exists, but has no policies.

-- 1. Ensure RLS is enabled
ALTER TABLE public.leaders ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (clean slate for this table)
DROP POLICY IF EXISTS "Active leaders are publicly viewable" ON public.leaders;
DROP POLICY IF EXISTS "Admins can manage leaders" ON public.leaders;

-- 3. Re-create Policies

-- POLICY: Public Read Access
-- Allow anyone (even anonymous) to see leaders that are marked as 'is_active'
CREATE POLICY "Active leaders are publicly viewable"
ON public.leaders FOR SELECT
USING (is_active = true);

-- POLICY: Admin Management
-- Allow Admins and Super Controllers to do EVERYTHING (Select, Insert, Update, Delete)
-- Uses the 'get_my_role()' helper function we established in previous migrations.
CREATE POLICY "Admins can manage leaders"
ON public.leaders FOR ALL
USING (
  public.get_my_role() IN ('SUPER_CONTROLLER', 'ADMIN', 'STATE_CONVENER', 'STATE_CO_CONVENER', 'NATIONAL_CONVENER')
);
