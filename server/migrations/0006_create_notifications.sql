-- Migration: Create notifications table with multi-tenant workspace separation.
-- Date: 2026-06-07

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'reminder' or 'follow_up'
  channel VARCHAR(50) NOT NULL, -- 'email' or 'sms'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization indices for rapid multi-tenant sorting and lookups
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_appointment_id ON notifications(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_scheduled ON notifications(workspace_id, scheduled_for DESC);
