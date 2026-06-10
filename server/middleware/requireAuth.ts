import { Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { AuthenticatedRequest } from "../types/auth";
import { ApiError } from "../types/errors";

let supabaseServerClient: any = null;

export const getSupabaseServerClient = () => {
  if (!supabaseServerClient) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be defined on the server");
    }
    
    supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return supabaseServerClient;
};

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
    const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

    if (!isSupabaseConfigured) {
      throw new ApiError(401, "Authentication service is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Missing or invalid Authorization header.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, "Missing authentication token.");
    }

    try {
      const supabase = getSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new ApiError(401, "Invalid or expired authentication token.");
      }

      req.user = {
        id: user.id,
        email: user.email,
      };
      next();
    } catch (dbError: any) {
      if (dbError instanceof ApiError) {
        throw dbError;
      }
      throw new ApiError(401, "Authentication verification failed.");
    }
  } catch (err) {
    next(err);
  }
};
