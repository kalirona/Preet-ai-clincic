-- Migration: Create clients table with multi-tenant workspace separation.
-- Date: 2026-06-07

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  tag TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_workspace_client_email UNIQUE (workspace_id, email)
);

-- Optimize queries filtration by tenant boundary
CREATE INDEX IF NOT EXISTS idx_clients_workspace_id ON clients(workspace_id);

-- Optimize client list sorted pagination, filtering, and searches
CREATE INDEX IF NOT EXISTS idx_clients_workspace_created ON clients(workspace_id, created_at DESC);

-- Optimize index searches and quick lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
