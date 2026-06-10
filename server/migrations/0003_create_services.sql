-- Migration: Create services table with multi-tenant workspace separation.
-- Date: 2026-06-07

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimize searches filtered by workspace boundary
CREATE INDEX IF NOT EXISTS idx_services_workspace_id ON services(workspace_id);
CREATE INDEX IF NOT EXISTS idx_services_workspace_created ON services(workspace_id, created_at DESC);
