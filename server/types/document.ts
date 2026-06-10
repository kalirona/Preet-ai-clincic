export interface Document {
  id: string;
  workspaceId: string;
  clientId?: string;
  appointmentId?: string;
  name: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  category: "profile_photo" | "attachment" | "document" | "invoice" | string;
  uploadedBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
