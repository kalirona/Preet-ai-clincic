export interface AIAgent {
  id: string;
  workspaceId: string;
  name: string;
  instructions: string;
  welcomeMessage: string;
  brandColor: string;
  avatarUrl?: string;
  model: string;
  isActive: boolean;
  humanHandoffEnabled: boolean;
  websiteUrl?: string;
  widgetConfig: {
    position: 'bottom-right' | 'bottom-left';
    bubbleSize: number;
    borderRadius: number;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AgentKnowledgeFile {
  id: string;
  agentId: string;
  workspaceId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  contentText?: string;
  status: 'processing' | 'ready' | 'error';
  createdAt: string | Date;
}
