-- =============================================================================
-- LYCHO — Migration 009: Schema alignment for automations & channel_connections
-- The code expects columns that differ from original migration definitions.
-- =============================================================================

-- ─── 1. automations: add columns matching code expectations ─────────────────
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS trigger_type   text;
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS trigger_config jsonb DEFAULT '{}';
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS action_type    text;
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS action_config  jsonb DEFAULT '{}';

-- ─── 2. channel_connections: make agent_id nullable ─────────────────────────
ALTER TABLE public.channel_connections ALTER COLUMN agent_id DROP NOT NULL;

-- ─── 3. contact_memory: add interaction_log / profile columns if missing ────
ALTER TABLE public.contact_memory ADD COLUMN IF NOT EXISTS interaction_log jsonb DEFAULT '[]';
ALTER TABLE public.contact_memory ADD COLUMN IF NOT EXISTS profile         jsonb DEFAULT '{}';
