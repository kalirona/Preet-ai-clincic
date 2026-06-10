-- Migration: Create automations and automation_steps tables
-- Date: 2026-06-08

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'welcome', 'appointment_reminder', 'cancellation', 'follow_up'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL, -- 'client_created', 'appointment_completed', 'appointment_cancelled', 'lead_inactive'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'send_email', 'notify_admin', 'send_sms'
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  delay_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization Indices for Rapid Query Responses
CREATE INDEX IF NOT EXISTS idx_email_templates_workspace ON email_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automations_workspace ON automations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_automation_steps_automation ON automation_steps(automation_id);
