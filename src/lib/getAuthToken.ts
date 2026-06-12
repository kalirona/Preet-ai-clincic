import { supabase } from "./supabase";

let cachedToken: string | null = null;

export async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  const { data } = await supabase.auth.getSession();
  cachedToken = data?.session?.access_token || null;
  return cachedToken;
}

// Subscribe to token changes
supabase.auth.onAuthStateChange((_event, session) => {
  cachedToken = session?.access_token || null;
});
