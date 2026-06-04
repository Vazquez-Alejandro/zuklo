-- =============================================
-- Migración 004: Auth + Monetización + RLS
-- =============================================

-- =============================================
-- AUTH TABLES
-- =============================================

-- Tabla de usuarios (extendiendo auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de suscripciones Stripe
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  plan_id TEXT NOT NULL CHECK (plan_id IN ('free', 'premium', 'pro')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de uso mensual
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  search_alerts_used INT DEFAULT 0,
  filters_created INT DEFAULT 0,
  tenant_profiles_created INT DEFAULT 0,
  pdf_exports_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Tabla de historial de uso (para tracking detallado)
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('search_alert', 'filter_created', 'tenant_profile', 'pdf_export')),
  credits_used INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES (auth tables)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_period ON public.user_usage(user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_usage_history_user ON public.usage_history(user_id, created_at DESC);

-- =============================================
-- RLS - Auth Tables (UUID, uses auth.uid())
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- User usage policies
CREATE POLICY "Users can view own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON public.user_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Usage history policies
CREATE POLICY "Users can view own usage history" ON public.usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage history" ON public.usage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage history" ON public.usage_history
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- RLS - Tables from migrations 001-003
-- (TEXT user_ids - service_role access + TODO for refined policies)
-- =============================================

-- Properties (no user_id - public data)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read properties" ON properties
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage properties" ON properties
  FOR ALL USING (auth.role() = 'service_role');

-- Scraping jobs (no user_id - internal)
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scraping_jobs" ON scraping_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- User filters (TEXT user_id)
ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_filters" ON user_filters
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()
-- CREATE POLICY "Users can read own filters" ON user_filters
--   FOR SELECT USING (user_id = auth.uid()::text);

-- Device tokens (TEXT user_id)
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage device_tokens" ON device_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()

-- Notification logs (TEXT user_id)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage notification_logs" ON notification_logs
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()

-- Tenant profiles (TEXT user_id)
ALTER TABLE tenant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage tenant_profiles" ON tenant_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()

-- Contracts (TEXT user_id)
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage contracts" ON contracts
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()

-- Maintenance expenses (TEXT user_id)
ALTER TABLE maintenance_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage maintenance_expenses" ON maintenance_expenses
  FOR ALL USING (auth.role() = 'service_role');

-- TODO: Add proper user-level policies once user_id type is unified with auth.uid()

-- =============================================
-- TRIGGERS (auth tables)
-- =============================================

-- Ensure handle_updated_at function exists (migration 001 defines update_updated_at)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- Function to auto-create user profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Function to auto-create free subscription for new users
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (NEW.id, 'free', 'active');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create free subscription
CREATE OR REPLACE TRIGGER on_user_subscription_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();
