export interface Client {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  tag?: string;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
}
