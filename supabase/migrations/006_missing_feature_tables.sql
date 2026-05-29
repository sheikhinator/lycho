-- =============================================================================
-- LYCHO — Migration 006: Missing Feature Tables + Columns
-- Creates all tables referenced by code but never defined in migrations.
-- =============================================================================

-- ─── 1. Missing columns on agents ────────────────────────────────────────────
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS description          text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS system_prompt        text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS model_complexity     text        DEFAULT 'simple';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS recommended_channels text[]      DEFAULT '{}';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS estimated_value_pkr  numeric     DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS sector_tags          text[]      DEFAULT '{}';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS use_case_examples    jsonb       DEFAULT '[]';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_catalogue         boolean     DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS source               text        DEFAULT 'manual';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS widget_token         text;

CREATE INDEX IF NOT EXISTS idx_agents_widget_token ON public.agents(widget_token);

-- ─── 2. Missing column on users ─────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean DEFAULT false;


-- ─── 3. knowledge_documents ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name        text        NOT NULL,
  content     text,
  source_type text        DEFAULT 'upload' CHECK (source_type IN ('upload','url')),
  source_url  text,
  chunk_index integer     DEFAULT 0,
  embedding   jsonb       DEFAULT '[]',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_documents_tenant_all"
  ON public.knowledge_documents FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_tenant_id ON public.knowledge_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON public.knowledge_documents(created_at DESC);


-- ─── 4. agent_personas ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_personas (
  agent_type          text   PRIMARY KEY,
  display_name        text   NOT NULL,
  personality         text,
  communication_style text,
  tone                text,
  catchphrase         text,
  sprite_color        text   DEFAULT '#4ade80'
);

ALTER TABLE public.agent_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_personas_read_all"
  ON public.agent_personas FOR SELECT
  USING (true);

CREATE POLICY "agent_personas_admin_all"
  ON public.agent_personas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "agent_personas_admin_update"
  ON public.agent_personas FOR UPDATE
  USING (true);

CREATE POLICY "agent_personas_admin_delete"
  ON public.agent_personas FOR DELETE
  USING (true);


-- ─── 5. agent_skills ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_skills (
  agent_type   text   NOT NULL,
  pattern      text   NOT NULL,
  trigger      text,
  example      text,
  usage_count  integer DEFAULT 1,
  success_rate integer DEFAULT 100,
  PRIMARY KEY (agent_type, pattern)
);

ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_skills_tenant_all"
  ON public.agent_skills FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_type ON public.agent_skills(agent_type);


-- ─── 6. skill_listings ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.skill_listings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type      text        NOT NULL,
  display_name    text        NOT NULL,
  description     text        NOT NULL,
  sector          text        NOT NULL,
  system_prompt   text        NOT NULL,
  price_pkr       numeric     DEFAULT 0,
  price_usd       numeric     DEFAULT 0,
  publisher_name  text        DEFAULT 'Anonymous',
  publisher_email text,
  status          text        DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  downloads       integer     DEFAULT 0,
  rating          numeric,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.skill_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skill_listings_read_approved"
  ON public.skill_listings FOR SELECT
  USING (status = 'approved' OR status = 'pending');

CREATE POLICY "skill_listings_insert_own"
  ON public.skill_listings FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_skill_listings_status  ON public.skill_listings(status);
CREATE INDEX IF NOT EXISTS idx_skill_listings_sector  ON public.skill_listings(sector);
CREATE INDEX IF NOT EXISTS idx_skill_listings_created_at ON public.skill_listings(created_at DESC);


-- ─── 7. country_profiles (Orion Geo) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.country_profiles (
  country_code        text   PRIMARY KEY,
  country_name        text   NOT NULL,
  currency            text,
  primary_language    text,
  secondary_languages text[] DEFAULT '{}',
  timezone            text,
  regulatory_context  text,
  market_context      text,
  agent_injection     text,
  last_updated_at     timestamptz DEFAULT now()
);

ALTER TABLE public.country_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "country_profiles_read_all"
  ON public.country_profiles FOR SELECT
  USING (true);

CREATE POLICY "country_profiles_admin_all"
  ON public.country_profiles FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─── 8. tenant_geo_settings (Orion Geo) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_geo_settings (
  tenant_id       uuid        PRIMARY KEY REFERENCES public.tenants ON DELETE CASCADE,
  country_code    text,
  geo_applied_at  timestamptz
);

ALTER TABLE public.tenant_geo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_geo_settings_tenant_all"
  ON public.tenant_geo_settings FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 9. orion_agent_intelligence ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orion_agent_intelligence (
  agent_type          text        PRIMARY KEY,
  base_prompt         text,
  optimised_prompt    text,
  intelligence_score  integer     DEFAULT 70,
  version             integer     DEFAULT 1,
  country_variants    jsonb       DEFAULT '{}',
  performance_data    jsonb       DEFAULT '{}',
  last_optimised_at   timestamptz,
  next_optimisation_at timestamptz
);

ALTER TABLE public.orion_agent_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orion_agent_intelligence_admin_all"
  ON public.orion_agent_intelligence FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─── 10. orion_optimisation_log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orion_optimisation_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type        text        NOT NULL,
  trigger_reason    text,
  previous_score    integer,
  new_score         integer,
  changes_summary   text,
  previous_prompt   text,
  new_prompt        text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.orion_optimisation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orion_optimisation_log_admin_all"
  ON public.orion_optimisation_log FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orion_optimisation_log_agent_type ON public.orion_optimisation_log(agent_type);


-- ─── 11. orion_council_sessions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orion_council_sessions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid        REFERENCES public.tenants ON DELETE CASCADE,
  conversation_id     uuid,
  query               text,
  agents_involved     text[]      DEFAULT '{}',
  individual_responses jsonb     DEFAULT '[]',
  synthesised_response text,
  quality_score       integer     DEFAULT 85,
  duration_ms         integer,
  created_at          timestamptz DEFAULT now()
);

ALTER TABLE public.orion_council_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orion_council_sessions_tenant_all"
  ON public.orion_council_sessions FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_orion_council_sessions_tenant_id ON public.orion_council_sessions(tenant_id);


-- ─── 12. orion_forge_briefs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orion_forge_briefs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gaps_identified   jsonb       DEFAULT '[]',
  quality_directives text,
  status            text        DEFAULT 'pending' CHECK (status IN ('pending','completed','cancelled')),
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.orion_forge_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orion_forge_briefs_admin_all"
  ON public.orion_forge_briefs FOR ALL
  USING (true)
  WITH CHECK (true);
