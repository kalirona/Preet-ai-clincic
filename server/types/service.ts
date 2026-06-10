export interface Service {
  id: string;
  workspaceId: string;
  name: string;
  durationMinutes: number;
  price: number;
  createdAt: string | Date;
}
