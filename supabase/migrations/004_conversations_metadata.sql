ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
