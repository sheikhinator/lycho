-- =============================================================================
-- LYCHO — Migration 007: Create all remaining feature tables
-- These tables exist in the live Supabase database but were never defined
-- in any migration file. Schemas are reverse-engineered from engine code.
-- =============================================================================

-- ─── 1. ab_tests ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name            text        NOT NULL,
  description     text,
  agent_type      text        NOT NULL,
  metric          text        DEFAULT 'lead_score',
  status          text        DEFAULT 'draft',
  min_sample_size integer     DEFAULT 50,
  started_at      timestamptz,
  completed_at    timestamptz,
  winner          text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ab_tests_tenant_all"
  ON public.ab_tests FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_ab_tests_tenant_id ON public.ab_tests(tenant_id);


-- ─── 2. ab_test_variants ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id           uuid        NOT NULL REFERENCES public.ab_tests ON DELETE CASCADE,
  label             text        NOT NULL,
  system_prompt     text,
  model             text,
  config            jsonb       DEFAULT '{}',
  traffic_percentage integer     DEFAULT 0,
  results           jsonb       DEFAULT '{"conversations":0,"avg_score":0,"total_score":0}',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ab_test_variants_tenant_all"
  ON public.ab_test_variants FOR ALL
  USING  (test_id IN (SELECT id FROM public.ab_tests WHERE tenant_id = public.get_tenant_id()))
  WITH CHECK (test_id IN (SELECT id FROM public.ab_tests WHERE tenant_id = public.get_tenant_id()));

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test_id ON public.ab_test_variants(test_id);


-- ─── 3. agent_prompt_versions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_prompt_versions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type    text        NOT NULL,
  system_prompt text,
  version       integer     NOT NULL,
  change_log    text,
  quality_score integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.agent_prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_prompt_versions_admin_all"
  ON public.agent_prompt_versions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_prompt_versions_agent_type ON public.agent_prompt_versions(agent_type);


-- ─── 4. agent_recovery_log ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_recovery_log (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type         text        NOT NULL,
  health_score_before integer,
  action             text,
  reason             text,
  performed_at       timestamptz,
  success            boolean     DEFAULT true,
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.agent_recovery_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_recovery_log_admin_all"
  ON public.agent_recovery_log FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_recovery_log_agent_type ON public.agent_recovery_log(agent_type);


-- ─── 5. agent_registry ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_registry (
  agent_type          text        PRIMARY KEY,
  display_name        text        NOT NULL,
  category            text,
  description         text,
  is_core             boolean     DEFAULT false,
  is_universe_a       boolean     DEFAULT false,
  can_initiate_council boolean    DEFAULT false,
  can_receive_messages boolean    DEFAULT true,
  status              text        DEFAULT 'active',
  registered_at       timestamptz DEFAULT now()
);

ALTER TABLE public.agent_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_registry_admin_all"
  ON public.agent_registry FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─── 6. agent_wallets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_wallets (
  agent_type      text        PRIMARY KEY,
  balance_pkr     numeric     DEFAULT 0,
  total_earned_pkr numeric    DEFAULT 0,
  transactions    integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_wallets_admin_all"
  ON public.agent_wallets FOR ALL
  USING (true)
  WITH CHECK (true);


-- ─── 7. api_keys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  label                text,
  key_prefix           text,
  key_hash             text,
  permissions          text[]      DEFAULT '{}',
  rate_limit_per_minute integer    DEFAULT 60,
  last_used_at         timestamptz,
  expires_at           timestamptz,
  active               boolean     DEFAULT true,
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_tenant_all"
  ON public.api_keys FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON public.api_keys(tenant_id);


-- ─── 8. backup_snapshots ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.backup_snapshots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id   uuid        NOT NULL REFERENCES public.backups ON DELETE CASCADE,
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  snapshot    jsonb       DEFAULT '{}',
  type        text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.backup_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_snapshots_tenant_all"
  ON public.backup_snapshots FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_backup_snapshots_backup_id ON public.backup_snapshots(backup_id);


-- ─── 9. backups ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.backups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  label        text,
  type         text,
  size_bytes   bigint      DEFAULT 0,
  status       text        DEFAULT 'creating',
  metadata     jsonb       DEFAULT '{}',
  restored_at  timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backups_tenant_all"
  ON public.backups FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_backups_tenant_id ON public.backups(tenant_id);


-- ─── 10. contact_memory_graph ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_memory_graph (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  contact_identifier text        NOT NULL,
  memory_type        text        DEFAULT 'semantic',
  content            text,
  entity             text,
  caused_by          text,
  occurred_at        timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.contact_memory_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_memory_graph_tenant_all"
  ON public.contact_memory_graph FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_contact_memory_graph_tenant_contact
  ON public.contact_memory_graph(tenant_id, contact_identifier);


-- ─── 11. customer_portals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_portals (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name            text        NOT NULL,
  subdomain       text        UNIQUE NOT NULL,
  agents          text[]      DEFAULT '{}',
  custom_domain   text,
  primary_color   text,
  logo_url        text,
  welcome_message text,
  active          boolean     DEFAULT true,
  visitor_count   integer     DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.customer_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_portals_tenant_all"
  ON public.customer_portals FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_customer_portals_tenant_id ON public.customer_portals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_portals_subdomain ON public.customer_portals(subdomain);


-- ─── 12. economy_transactions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.economy_transactions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  transaction_type text,
  from_agent       text,
  to_agent         text,
  amount_pkr       numeric     DEFAULT 0,
  description      text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.economy_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "economy_transactions_tenant_all"
  ON public.economy_transactions FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_economy_transactions_tenant_id ON public.economy_transactions(tenant_id);


-- ─── 13. gateway_logs ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gateway_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id       uuid        REFERENCES public.api_keys ON DELETE SET NULL,
  tenant_id        uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  agent_type       text,
  conversation_id  text,
  request_message  text,
  response_preview text,
  duration_ms      integer,
  credits_used     integer     DEFAULT 1,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.gateway_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gateway_logs_tenant_all"
  ON public.gateway_logs FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_gateway_logs_tenant_id ON public.gateway_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_api_key_id ON public.gateway_logs(api_key_id);


-- ─── 14. marketplace_agents ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_agents (
  agent_type       text        PRIMARY KEY,
  display_name     text        NOT NULL,
  description      text,
  system_prompt    text,
  model_complexity text        DEFAULT 'simple',
  sector           text,
  status           text        DEFAULT 'active',
  source           text        DEFAULT 'manual',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.marketplace_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketplace_agents_read_all"
  ON public.marketplace_agents FOR SELECT
  USING (true);

CREATE POLICY "marketplace_agents_admin_all"
  ON public.marketplace_agents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "marketplace_agents_admin_update"
  ON public.marketplace_agents FOR UPDATE
  USING (true);

CREATE POLICY "marketplace_agents_admin_delete"
  ON public.marketplace_agents FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_marketplace_agents_status ON public.marketplace_agents(status);


-- ─── 15. nexus_queue ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nexus_queue (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id       text,
  name              text        NOT NULL,
  description       text        DEFAULT '',
  category          text        DEFAULT 'conversations',
  sector_tags       text[]      DEFAULT '{}',
  trigger           jsonb       DEFAULT '{}',
  steps             jsonb       DEFAULT '[]',
  actions           jsonb       DEFAULT '[]',
  use_case_examples jsonb       DEFAULT '[]',
  why_useful        text        DEFAULT '',
  status            text        DEFAULT 'pending_review',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.nexus_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexus_queue_admin_all"
  ON public.nexus_queue FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nexus_queue_status ON public.nexus_queue(status);


-- ─── 16. nexus_templates ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nexus_templates (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  description       text        DEFAULT '',
  category          text        DEFAULT 'conversations',
  trigger           jsonb       DEFAULT '{}',
  steps             jsonb       DEFAULT '[]',
  actions           jsonb       DEFAULT '[]',
  sector_tags       text[]      DEFAULT '{}',
  use_case_examples jsonb       DEFAULT '[]',
  why_useful        text        DEFAULT '',
  status            text        DEFAULT 'active',
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.nexus_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nexus_templates_admin_all"
  ON public.nexus_templates FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_nexus_templates_category ON public.nexus_templates(category);


-- ─── 17. notifications ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  type        text,
  title       text,
  message     text,
  link        text,
  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_tenant_all"
  ON public.notifications FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_read
  ON public.notifications(tenant_id, read);


-- ─── 18. scout_reports ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scout_reports (
  id               text        PRIMARY KEY DEFAULT 'latest',
  market_brief     text,
  regulatory_brief text,
  competitor_brief text,
  trend_brief      text,
  knowledge_brief  text,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE public.scout_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scout_reports_read_all"
  ON public.scout_reports FOR SELECT
  USING (true);

CREATE POLICY "scout_reports_admin_all"
  ON public.scout_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "scout_reports_admin_update"
  ON public.scout_reports FOR UPDATE
  USING (true);


-- ─── 19. sense_events ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sense_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  sensor_type text,
  data        jsonb       DEFAULT '{}',
  insight     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.sense_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sense_events_tenant_all"
  ON public.sense_events FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_sense_events_tenant_id ON public.sense_events(tenant_id);


-- ─── 20. society_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.society_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  event_type  text,
  from_agent  text,
  to_agent    text,
  description text,
  outcome     text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.society_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_events_tenant_all"
  ON public.society_events FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_society_events_tenant_id ON public.society_events(tenant_id);


-- ─── 21. swarm_council_logs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.swarm_council_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  query       text,
  members     jsonb       DEFAULT '[]',
  synthesis   text,
  consensus   text,
  confidence  integer,
  duration_ms integer,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.swarm_council_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "swarm_council_logs_tenant_all"
  ON public.swarm_council_logs FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_swarm_council_logs_tenant_id ON public.swarm_council_logs(tenant_id);


-- ─── 22. syndicate_messages ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.syndicate_messages (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent        text,
  to_agent          text,
  message_type      text,
  payload           jsonb       DEFAULT '{}',
  priority          text        DEFAULT 'normal',
  tenant_id         uuid        REFERENCES public.tenants ON DELETE CASCADE,
  conversation_id   text,
  status            text        DEFAULT 'processing',
  response          jsonb       DEFAULT '{}',
  responded_at      timestamptz,
  quality_score     integer,
  duration_ms       integer,
  flagged_by_guardian boolean   DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.syndicate_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndicate_messages_admin_all"
  ON public.syndicate_messages FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_syndicate_messages_created_at ON public.syndicate_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_syndicate_messages_status ON public.syndicate_messages(status);


-- ─── 23. syndicate_routes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.syndicate_routes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent    text        NOT NULL,
  to_agent      text        NOT NULL,
  route_type    text,
  bidirectional boolean     DEFAULT false,
  active        boolean     DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (from_agent, to_agent)
);

ALTER TABLE public.syndicate_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "syndicate_routes_admin_all"
  ON public.syndicate_routes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_syndicate_routes_active ON public.syndicate_routes(active);


-- ─── 24. training_examples ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_examples (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type     text        NOT NULL,
  user_message   text,
  ideal_response text,
  rationale      text,
  category       text        DEFAULT 'custom',
  quality_score  integer     DEFAULT 75,
  usage_count    integer     DEFAULT 1,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE public.training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_examples_admin_all"
  ON public.training_examples FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_training_examples_agent_type ON public.training_examples(agent_type);


-- ─── 25. webhook_endpoints ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  url          text        NOT NULL,
  secret       text,
  events       text[]      DEFAULT '{}',
  description  text,
  status       text        DEFAULT 'active',
  last_sent_at timestamptz,
  last_status  integer,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_tenant_all"
  ON public.webhook_endpoints FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant_id ON public.webhook_endpoints(tenant_id);


-- ─── 26. webhook_events ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  endpoint_id  uuid        REFERENCES public.webhook_endpoints ON DELETE SET NULL,
  event_type   text,
  payload      jsonb       DEFAULT '{}',
  status       text        DEFAULT 'pending',
  attempts     integer     DEFAULT 0,
  max_attempts integer     DEFAULT 3,
  last_error   text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_tenant_all"
  ON public.webhook_events FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_webhook_events_endpoint_id ON public.webhook_events(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);


-- ─── 27. workflows ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflows (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name        text,
  description text,
  status      text        DEFAULT 'draft',
  steps       jsonb       DEFAULT '[]',
  trigger     jsonb       DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_tenant_all"
  ON public.workflows FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON public.workflows(tenant_id);


-- ─── 28. workspace_agents ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_agents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid        NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  agent_id     uuid        NOT NULL REFERENCES public.agents ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (workspace_id, agent_id)
);

ALTER TABLE public.workspace_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_agents_tenant_all"
  ON public.workspace_agents FOR ALL
  USING  (workspace_id IN (SELECT id FROM public.workspaces WHERE tenant_id = public.get_tenant_id()))
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE tenant_id = public.get_tenant_id()));

CREATE INDEX IF NOT EXISTS idx_workspace_agents_workspace_id ON public.workspace_agents(workspace_id);


-- ─── 29. workspace_members ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid        NOT NULL REFERENCES public.workspaces ON DELETE CASCADE,
  email          text,
  display_name   text,
  role           text        DEFAULT 'member',
  joined_at      timestamptz DEFAULT now(),
  last_active_at timestamptz
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_tenant_all"
  ON public.workspace_members FOR ALL
  USING  (workspace_id IN (SELECT id FROM public.workspaces WHERE tenant_id = public.get_tenant_id()))
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE tenant_id = public.get_tenant_id()));

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);


-- ─── 30. workspaces ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspaces (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_tenant_all"
  ON public.workspaces FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_workspaces_tenant_id ON public.workspaces(tenant_id);


-- =============================================================================
-- ACTION-EXECUTOR TABLES (minimal schemas, used by action-executor.ts)
-- =============================================================================

-- ─── 31. tasks ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  agent_id    uuid        REFERENCES public.agents ON DELETE SET NULL,
  title       text,
  description text,
  priority    text        DEFAULT 'medium',
  due_date    timestamptz,
  status      text        DEFAULT 'pending',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_tenant_all"
  ON public.tasks FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 32. contacts ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  identifier  text        NOT NULL,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (tenant_id, identifier)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_tenant_all"
  ON public.contacts FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 33. callbacks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.callbacks (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  contact_identifier text,
  preferred_time     timestamptz,
  notes              text,
  status             text        DEFAULT 'scheduled',
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "callbacks_tenant_all"
  ON public.callbacks FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 34. newsletter_subscribers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  email        text,
  name         text,
  source       text,
  subscribed_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_subscribers_tenant_all"
  ON public.newsletter_subscribers FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- ─── 35. appointments ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.appointments (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  contact_identifier text,
  appointment_type   text,
  preferred_date     date,
  preferred_time     time,
  notes              text,
  status             text        DEFAULT 'pending_confirmation',
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_tenant_all"
  ON public.appointments FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());


-- =============================================================================
-- INDEXES for action-executor tables
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_callbacks_tenant_id ON public.callbacks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_tenant_id ON public.newsletter_subscribers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_id ON public.appointments(tenant_id);
