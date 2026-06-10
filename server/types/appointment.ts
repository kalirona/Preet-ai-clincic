export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  workspaceId: string;
  clientId: string;
  serviceId?: string;
  staffName: string;
  startTime: string | Date;
  endTime: string | Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string | Date;
}
