-- LYCHO Schema Migration — Days 22-26
-- Run this in Supabase SQL Editor

ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS why_novel text;
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS source text default 'autonomous';
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS research_sources jsonb default '[]';
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS use_case_examples jsonb default '[]';
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS sector_tags text[] default '{}';
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS recommended_channels text[] default '{}';

ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_onboarding boolean default false;

ALTER TABLE agents ADD COLUMN IF NOT EXISTS widget_token text;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS health_score integer default 100;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug text;

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS escalated boolean default false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS lead_score integer default 0;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment text default 'neutral';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS channel text default 'web';

-- Nexus Queue — AI-generated automation templates
CREATE TABLE IF NOT EXISTS nexus_queue (
  id            uuid primary key default gen_random_uuid(),
  template_id   text not null unique,
  name          text not null,
  description   text default '',
  category      text default 'conversations',
  sector_tags   text[] default '{}',
  trigger       jsonb default '{}',
  steps         jsonb default '[]',
  use_case_examples jsonb default '[]',
  why_useful    text default '',
  status        text default 'pending_review',
  notes         text,
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);
