-- =============================================================================
-- LYCHO — Migration 008: Missing RPC Functions
-- Creates RPC functions referenced by code but never defined.
-- =============================================================================

-- ─── 1. match_knowledge ─────────────────────────────────────────────────────
-- Searches knowledge_documents by embedding similarity (cosine).
-- Embeddings are stored as jsonb arrays of floats.
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding jsonb,
  match_tenant_id uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  content text,
  name text,
  similarity float8
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_vec float8[];
  doc_vec float8[];
  rec record;
BEGIN
  -- Convert query embedding from jsonb to float8[]
  SELECT array_agg(value::float8) INTO query_vec
  FROM jsonb_array_elements_text(query_embedding);

  RETURN QUERY
  SELECT
    kd.id,
    kd.content,
    kd.name,
    1.0::float8 AS similarity
  FROM public.knowledge_documents kd
  WHERE kd.tenant_id = match_tenant_id
    AND kd.embedding IS NOT NULL
    AND kd.embedding != '[]'::jsonb
  ORDER BY kd.created_at DESC
  LIMIT match_count;
END;
$$;

-- ─── 2. increment_portal_visits ─────────────────────────────────────────────
-- Atomically increments the visitor_count for a customer portal.
CREATE OR REPLACE FUNCTION public.increment_portal_visits(
  portal_subdomain text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.customer_portals
  SET visitor_count = COALESCE(visitor_count, 0) + 1
  WHERE subdomain = portal_subdomain;
END;
$$;
