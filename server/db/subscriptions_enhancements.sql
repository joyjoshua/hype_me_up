-- ============================================
-- SUBSCRIPTIONS TABLE ENHANCEMENTS
-- Run these in Supabase SQL Editor
-- ============================================

-- 1. Add index for faster Dodo subscription ID lookups (used in webhook handler)
CREATE INDEX IF NOT EXISTS idx_subscriptions_dodo_id 
  ON public.subscriptions(dodo_subscription_id);

-- 2. Enable Row Level Security on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can only view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: Service role has full access (for server-side operations via supabaseAdmin)
CREATE POLICY "Service role full access"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- VERIFICATION QUERIES (run after applying)
-- ============================================

-- Check if index was created
-- SELECT indexname FROM pg_indexes WHERE tablename = 'subscriptions';

-- Check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'subscriptions';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
