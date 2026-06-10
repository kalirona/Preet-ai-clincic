-- Migration: Create documents table for file upload system tracking
-- Date: 2026-06-09

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  category TEXT NOT NULL, -- 'profile_photo', 'attachment', 'document', 'invoice'
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Optimize document lookups by tenant boundary and references
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON documents(appointment_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
