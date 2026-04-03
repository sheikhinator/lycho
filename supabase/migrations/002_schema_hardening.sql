-- Days 22-35: Schema hardening
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE forge_queue ADD COLUMN IF NOT EXISTS source text default 'autonomous';
