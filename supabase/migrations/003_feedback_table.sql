-- =============================================================================
-- LYCHO — Migration 003: Feedback table + additional schema
-- =============================================================================

-- ─── feedback ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid        NOT NULL REFERENCES public.tenants ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES public.users ON DELETE CASCADE,
  type            text        NOT NULL CHECK (type IN ('bug', 'feature_request', 'ux_issue', 'performance', 'general', 'praise')),
  message         text        NOT NULL,
  rating          integer     CHECK (rating >= 1 AND rating <= 5),
  category        text,
  status          text        DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'dismissed')),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_tenant_all"
  ON public.feedback FOR ALL
  USING  (tenant_id = public.get_tenant_id())
  WITH CHECK (tenant_id = public.get_tenant_id());

CREATE INDEX IF NOT EXISTS idx_feedback_tenant_id ON public.feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
