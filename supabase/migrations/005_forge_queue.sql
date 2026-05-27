-- =============================================================================
-- LYCHO — Migration 005: Create forge_queue table
-- The forge_queue table was referenced in code & ALTER TABLE migrations
-- but the CREATE TABLE was never committed as a migration file.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.forge_queue (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type           text        NOT NULL,
  display_name         text        NOT NULL,
  description          text        DEFAULT '',
  system_prompt        text        DEFAULT '',
  recommended_channels text[]      DEFAULT '{}',
  model_complexity     text        DEFAULT 'simple',
  estimated_value_pkr  integer     DEFAULT 0,
  sector_tags          text[]      DEFAULT '{}',
  use_case_examples    jsonb       DEFAULT '[]',
  why_novel            text        DEFAULT '',
  source               text        DEFAULT 'autonomous',
  research_sources     jsonb       DEFAULT '[]',
  status               text        DEFAULT 'pending_review',
  master_notes         text,
  deployed_at          timestamptz,
  reviewed_at          timestamptz,
  reviewed_by          uuid,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.forge_queue ENABLE ROW LEVEL SECURITY;

-- Only master/admin can access forge_queue
CREATE POLICY "forge_queue_admin_all"
  ON public.forge_queue FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for status-based queries (used in listing/filtering)
CREATE INDEX IF NOT EXISTS idx_forge_queue_status ON public.forge_queue(status);
CREATE INDEX IF NOT EXISTS idx_forge_queue_created_at ON public.forge_queue(created_at DESC);
