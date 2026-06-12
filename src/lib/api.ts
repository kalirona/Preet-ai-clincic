import axios from "axios";
import { supabase } from "./supabase";

let interceptorSet = false;

export function initApiAuth() {
  if (interceptorSet) return;
  interceptorSet = true;

  axios.interceptors.request.use(async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Keep token in sync
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${session.access_token}`;
    }
  });
}
