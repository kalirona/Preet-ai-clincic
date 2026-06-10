-- Migration: Create AI Agents, Knowledge Files, Conversations, and Messages
-- Date: 2026-06-10

-- ============================================
-- AI AGENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  instructions TEXT DEFAULT '',
  welcome_message TEXT DEFAULT 'Hi! How can I help you today?',
  brand_color VARCHAR(20) DEFAULT '#7c3aed',
  avatar_url TEXT,
  model VARCHAR(50) DEFAULT 'gemini',
  is_active BOOLEAN NOT NULL DEFAULT true,
  human_handoff_enabled BOOLEAN NOT NULL DEFAULT false,
  website_url TEXT,
  widget_config JSONB DEFAULT '{"position":"bottom-right","bubbleSize":60,"borderRadius":24}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_agents_workspace_id ON ai_agents(workspace_id);

-- ============================================
-- AGENT KNOWLEDGE FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agent_knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  content_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ready',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_knowledge_files_agent_id ON agent_knowledge_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_knowledge_files_workspace_id ON agent_knowledge_files(workspace_id);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  visitor_phone VARCHAR(50),
  visitor_ip VARCHAR(45),
  visitor_user_agent TEXT,
  source VARCHAR(30) NOT NULL DEFAULT 'widget',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  assigned_to UUID,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(workspace_id, last_message_at DESC);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,
  sender_id UUID,
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);
