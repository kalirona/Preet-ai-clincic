import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper for row-level security and multi-tenancy flow
export const getActiveWorkspace = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Return first workspace user is part of for demo
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(*)')
    .eq('user_id', user.id)
    .limit(1);
    
  return memberships?.[0]?.workspaces || null;
};
