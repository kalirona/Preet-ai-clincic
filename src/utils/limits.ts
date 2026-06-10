/**
 * Subscription plan quotas and helper functions for resource usage validation.
 */

export interface PlanLimits {
  name: string;
  clients: number;      // max number of active client records
  appointments: number; // max number of scheduled slots
  aiCredits: number;    // max AI text generations
  storage: number;      // max simulated storage in megabytes (MB)
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  Free: {
    name: 'Free',
    clients: 3,
    appointments: 5,
    aiCredits: 3,
    storage: 5 // 5 MB
  },
  Starter: {
    name: 'Starter',
    clients: 10,
    appointments: 25,
    aiCredits: 10,
    storage: 100 // 100 MB
  },
  Growth: {
    name: 'Growth',
    clients: 50,
    appointments: 100,
    aiCredits: 50,
    storage: 2048 // 2 GB
  },
  Agency: {
    name: 'Agency',
    clients: 1000000, // Unlimited
    appointments: 1000000, // Unlimited
    aiCredits: 1000000, // Unlimited
    storage: 51200 // 50 GB
  }
};

/**
 * Retrieves the current workspace plan from localStorage.
 * Fallback defaults to 'Free' to make limits testing exciting and interactive!
 */
export function getActivePlanName(): string {
  return localStorage.getItem('settings_activeWorkspacePlan') || 'Free';
}

/**
 * Retrieves active quotas for the current active workspace subscription level.
 */
export function getActivePlanLimits(): PlanLimits {
  const plan = getActivePlanName();
  return PLAN_LIMITS[plan] || PLAN_LIMITS.Free;
}

/**
 * Returns currently spent resource counts from local storage databases.
 */
export function getCurrentUsage() {
  // 1. Clients count
  let clientsCount = 5; // fallback default
  try {
    const savedClients = localStorage.getItem('preet_crm_records');
    if (savedClients) {
      const parsed = JSON.parse(savedClients);
      if (Array.isArray(parsed)) clientsCount = parsed.length;
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. Appointments count
  let apptsCount = 4;
  try {
    const savedAppts = localStorage.getItem('preet_dashboard_appts');
    if (savedAppts) {
      const parsed = JSON.parse(savedAppts);
      if (Array.isArray(parsed)) apptsCount = parsed.length;
    }
  } catch (e) {
    console.warn(e);
  }

  // 3. AI Credits count
  let aiCreditsCount = parseInt(localStorage.getItem('preet_ai_credits_used') || '0', 10);

  // 4. Storage size in MB (simulated based on attachments count or random seed)
  let attachmentCount = 1;
  try {
    const savedCount = localStorage.getItem('preet_attachments_count');
    if (savedCount) attachmentCount = parseInt(savedCount, 10);
  } catch {
    // default file present
  }
  const storageCount = attachmentCount * 1.5; // each file is 1.5 MB on average

  return {
    clients: clientsCount,
    appointments: apptsCount,
    aiCredits: aiCreditsCount,
    storage: storageCount
  };
}
