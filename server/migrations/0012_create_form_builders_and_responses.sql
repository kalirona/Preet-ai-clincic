-- Migration: Create Form Builders and Form Responses
-- Date: 2026-06-10

-- ============================================
-- FORM BUILDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_builders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{"submitButtonText":"Submit","successMessage":"Thank you for your submission!","redirectUrl":"","notifyEmail":"","createConversation":true,"assignAgentId":null}'::jsonb,
  brand_color VARCHAR(20) DEFAULT '#7c3aed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_builders_workspace_id ON form_builders(workspace_id);

-- ============================================
-- FORM RESPONSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES form_builders(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  visitor_ip VARCHAR(45),
  visitor_user_agent TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_responses_workspace_id ON form_responses(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_status ON form_responses(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_form_responses_created_at ON form_responses(workspace_id, created_at DESC);
