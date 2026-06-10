export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number';
export type FormResponseStatus = 'new' | 'read' | 'archived' | 'converted';

export interface FormField {
  type: FormFieldType;
  label: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface FormSettings {
  submitButtonText: string;
  successMessage: string;
  redirectUrl?: string;
  notifyEmail?: string;
  createConversation: boolean;
  assignAgentId?: string | null;
}

export interface FormBuilder {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
  brandColor: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FormResponse {
  id: string;
  workspaceId: string;
  formId: string;
  conversationId?: string;
  clientId?: string;
  answers: Record<string, any>;
  visitorIp?: string;
  visitorUserAgent?: string;
  status: FormResponseStatus;
  createdAt: string | Date;
}
