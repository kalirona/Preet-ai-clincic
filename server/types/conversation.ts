export type ConversationSource = 'widget' | 'form' | 'lead' | 'manual';
export type ConversationStatus = 'open' | 'unread' | 'archived' | 'assigned';
export type SenderType = 'visitor' | 'agent' | 'system' | 'ai';
export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Conversation {
  id: string;
  workspaceId: string;
  agentId?: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  visitorIp?: string;
  visitorUserAgent?: string;
  source: ConversationSource;
  status: ConversationStatus;
  assignedTo?: string;
  unreadCount: number;
  lastMessageAt?: string | Date;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Message {
  id: string;
  conversationId: string;
  workspaceId: string;
  senderType: SenderType;
  senderId?: string;
  content: string;
  messageType: MessageType;
  metadata: Record<string, any>;
  createdAt: string | Date;
}
