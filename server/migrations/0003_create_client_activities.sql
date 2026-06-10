-- Migration: Create client_activities table with multi-tenant workspace separation.
-- Date: 2026-06-07

CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimize searches filtered by workspace boundary
CREATE INDEX IF NOT EXISTS idx_client_activities_workspace_id ON client_activities(workspace_id);

-- Optimize activity queries for a specific client boundary
CREATE INDEX IF NOT EXISTS idx_client_activities_client_id ON client_activities(client_id);

-- Optimize activity queries sorted by client and latest events
CREATE INDEX IF NOT EXISTS idx_client_activities_client_created ON client_activities(client_id, created_at DESC);

