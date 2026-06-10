export interface AuditLog {
  id: string;
  workspaceId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string | Date;
}
