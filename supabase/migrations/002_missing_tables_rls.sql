-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/cabdidtgnacmxfueejhe/sql/new)
-- LYCHO Migration 002: Missing tables + RLS policies

CREATE TABLE IF NOT EXISTS public.channel_connections (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  agent_id           uuid        NOT NULL REFERENCES public.agents  ON DELETE CASCADE,
  channel_type       text        NOT NULL,
  channel_identifier text,
  credentials        jsonb       DEFAULT '{}',
  status             text        DEFAULT 'active',
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "channel_connections_tenant_all"
  ON public.channel_connections FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE TABLE IF NOT EXISTS public.automations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  trigger     jsonb       NOT NULL DEFAULT '{}',
  steps       jsonb       NOT NULL DEFAULT '[]',
  status      text        NOT NULL DEFAULT 'draft' CHECK (status IN ('active','paused','draft')),
  run_count   integer     NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automations_tenant_all"
  ON public.automations FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  automation_id  uuid        NOT NULL REFERENCES public.automations ON DELETE CASCADE,
  trigger_event  text,
  trigger_data   jsonb       DEFAULT '{}',
  steps_executed jsonb       DEFAULT '[]',
  status         text        NOT NULL DEFAULT 'success' CHECK (status IN ('success','failed')),
  error_message  text,
  duration_ms    integer,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "automation_logs_tenant_all"
  ON public.automation_logs FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE TABLE IF NOT EXISTS public.contact_memory (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  contact_identifier text        NOT NULL,
  contact_name       text,
  profile            jsonb       DEFAULT '{}',
  interaction_log    jsonb       DEFAULT '[]',
  total_value_pkr    numeric     DEFAULT 0,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now(),
  UNIQUE (tenant_id, contact_identifier)
);
ALTER TABLE public.contact_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_memory_tenant_all"
  ON public.contact_memory FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_log' AND policyname='audit_log_insert_own_tenant') THEN
    EXECUTE 'CREATE POLICY "audit_log_insert_own_tenant" ON public.audit_log FOR INSERT WITH CHECK (tenant_id = public.get_tenant_id() OR tenant_id IS NULL)';
  END IF;
END $$;
