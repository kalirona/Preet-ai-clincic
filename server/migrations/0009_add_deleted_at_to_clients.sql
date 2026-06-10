-- Migration: Add soft delete field to clients
-- Date: 2026-06-09

ALTER TABLE clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Optimize querying of active (non-deleted) clients
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON clients(deleted_at);
