-- =============================================================================
-- LYCHO — Core Schema Migration 001
-- =============================================================================

-- ─── 1. tenants ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenants (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name    text        NOT NULL,
  business_email   text        UNIQUE NOT NULL,
  business_phone   text,
  sector           text,
  plan             text        DEFAULT 'starter',
  plan_status      text        DEFAULT 'trialing',
  trial_ends_at    timestamptz,
  country          text        DEFAULT 'PK',
  currency         text        DEFAULT 'PKR',
  health_score     integer     DEFAULT 50,
  churn_risk_score integer     DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz
);

-- ─── 2. users ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id              uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  tenant_id       uuid        REFERENCES public.tenants ON DELETE CASCADE,
  full_name       text,
  role            text        DEFAULT 'member',
  email_verified  boolean     DEFAULT false,
  mfa_enabled     boolean     DEFAULT false,
  last_login_at   timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ─── Helper function (created AFTER users table exists) ──────────────────────
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$;

-- ─── RLS: tenants ─────────────────────────────────────────────────────────────
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_select_own"
  ON public.tenants FOR SELECT
  USING (id = public.get_tenant_id());

CREATE POLICY "tenants_update_own"
  ON public.tenants FOR UPDATE
  USING (id = public.get_tenant_id());

-- ─── RLS: users ──────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_tenant"
  ON public.users FOR SELECT
  USING (tenant_id = public.get_tenant_id() OR id = auth.uid());

CREATE POLICY "users_update_own"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users_insert_own"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());


-- ─── 3. agents ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agents (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  agent_type           text        NOT NULL,
  display_name         text,
  status               text        DEFAULT 'configuring',
  version              integer     DEFAULT 1,
  config               jsonb       DEFAULT '{}',
  channels             text[]      DEFAULT '{}',
  confidence_threshold numeric     DEFAULT 0.85,
  monthly_cost_pkr     numeric     DEFAULT 0,
  monthly_value_pkr    numeric     DEFAULT 0,
  interactions_count   bigint      DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_tenant_isolation"
  ON public.agents FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 4. conversations ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  agent_id           uuid        NOT NULL REFERENCES public.agents  ON DELETE CASCADE,
  channel            text,
  contact_identifier text,
  status             text        DEFAULT 'open',
  messages           jsonb[]     DEFAULT '{}',
  confidence_score   numeric,
  resolved_at        timestamptz,
  escalated_to       text,
  feedback           text,
  tokens_used        integer     DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_tenant_isolation"
  ON public.conversations FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 5. subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  plan                     text,
  billing_cycle            text        DEFAULT 'monthly',
  amount_pkr               numeric,
  currency                 text        DEFAULT 'PKR',
  payment_provider         text,
  provider_subscription_id text,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean     DEFAULT false,
  paused_at                timestamptz,
  created_at               timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_tenant_isolation"
  ON public.subscriptions FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 6. agent_versions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        uuid        NOT NULL REFERENCES public.agents  ON DELETE CASCADE,
  tenant_id       uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  version         integer     NOT NULL,
  config_snapshot jsonb,
  changed_by      text,
  change_reason   text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.agent_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_versions_tenant_isolation"
  ON public.agent_versions FOR ALL
  USING (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 7. audit_log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid,
  actor_type    text,
  actor_id      text,
  action        text,
  resource_type text,
  resource_id   text,
  metadata      jsonb,
  ip_address    text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_own_tenant"
  ON public.audit_log FOR SELECT
  USING (tenant_id = public.get_tenant_id());


-- ─── 8. waitlist ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.waitlist (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          text        UNIQUE NOT NULL,
  name           text,
  business_type  text,
  position       serial,
  referral_code  text        UNIQUE,
  referred_by    text,
  referral_count integer     DEFAULT 0,
  cohort         text        DEFAULT 'standard',
  converted_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist_public_insert"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "waitlist_select_own"
  ON public.waitlist FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );


-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_tenant_id          ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_tenant_id         ON public.agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id  ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id   ON public.conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id  ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_agent_id  ON public.agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id      ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at     ON public.audit_log(created_at DESC);
