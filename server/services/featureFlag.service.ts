import { getSupabaseServerClient } from "../middleware/requireAuth";

export interface FeatureFlag {
  id: string;
  workspaceId: string;
  flagKey: string;
  flagName: string;
  description: string;
  isEnabled: boolean;
  createdAt: string;
}

// Bulletproof fallback vault to guarantee zero-downtime if Supabase table isn't migrated
let inMemoryFeatureFlags: FeatureFlag[] = [
  {
    id: "ff_1",
    workspaceId: "1",
    flagKey: "ai_assistant",
    flagName: "AI Assistant Co-Pilot",
    description: "Enables conversational LLM memory context, AI-backed insights, and live chat automations.",
    isEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "ff_2",
    workspaceId: "1",
    flagKey: "courses",
    flagName: "LMS & Onboarding Courses",
    description: "Allows publishing video modules, slides, and educational onboarding courses for signed clients.",
    isEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "ff_3",
    workspaceId: "1",
    flagKey: "community",
    flagName: "Community Portal & Forum",
    description: "Activates client discussion forums, direct participant threads, and bulletins.",
    isEnabled: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "ff_4",
    workspaceId: "1",
    flagKey: "blog_planner",
    flagName: "AI SEO Blog Planner",
    description: "Deep integrated SEO keywords researcher, content generation draft, and scheduling board.",
    isEnabled: true,
    createdAt: new Date().toISOString()
  }
];

export class FeatureFlagService {
  static async getFeatureFlags(workspaceId: string): Promise<FeatureFlag[]> {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (!supabaseUrl) {
        return inMemoryFeatureFlags.filter(ff => ff.workspaceId === workspaceId);
      }

      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) {
        console.warn("[FeatureFlagService] SQL Select error, falling back to memory vault:", error.message);
        return inMemoryFeatureFlags.filter(ff => ff.workspaceId === workspaceId);
      }

      if (!data || data.length === 0) {
        // Hydrate default keys for this workspace if empty
        const defaultFlagsForWorkspace = inMemoryFeatureFlags.map(ff => ({
          ...ff,
          workspaceId,
          id: `ff_${workspaceId}_${Math.random().toString(36).substr(2, 5)}`
        }));
        
        // Try inserting default values
        const { error: insertError } = await supabase
          .from("feature_flags")
          .insert(
            defaultFlagsForWorkspace.map(ff => ({
              workspace_id: ff.workspaceId,
              flag_key: ff.flagKey,
              flag_name: ff.flagName,
              description: ff.description,
              is_enabled: ff.isEnabled
            }))
          );

        if (insertError) {
          console.warn("[FeatureFlagService] Failed to insert default SQL flags:", insertError.message);
          return defaultFlagsForWorkspace;
        }

        // Return the fresh data
        const { data: refetched } = await supabase
          .from("feature_flags")
          .select("*")
          .eq("workspace_id", workspaceId);

        return (refetched || defaultFlagsForWorkspace).map(this.mapFromDb);
      }

      return data.map(this.mapFromDb);
    } catch (err: any) {
      console.warn("[FeatureFlagService] getFeatureFlags Exception, using memory fallback:", err.message);
      return inMemoryFeatureFlags.filter(ff => ff.workspaceId === workspaceId);
    }
  }

  static async updateFeatureFlag(workspaceId: string, flagKey: string, isEnabled: boolean): Promise<FeatureFlag> {
    try {
      // Always update our local memory cache first
      const memFlagIdx = inMemoryFeatureFlags.findIndex(ff => ff.workspaceId === workspaceId && ff.flagKey === flagKey);
      if (memFlagIdx !== -1) {
        inMemoryFeatureFlags[memFlagIdx].isEnabled = isEnabled;
      } else {
        // If it doesn't exist, we add it to the memory cache to retain consistency
        const newMemoryFlag: FeatureFlag = {
          id: `ff_${workspaceId}_${Math.random().toString(36).substr(2, 5)}`,
          workspaceId,
          flagKey,
          flagName: flagKey.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          description: `Custom workspace administrative toggle for feature flag '${flagKey}'.`,
          isEnabled,
          createdAt: new Date().toISOString()
        };
        inMemoryFeatureFlags.push(newMemoryFlag);
      }

      const supabaseUrl = process.env.SUPABASE_URL || "";
      if (!supabaseUrl) {
        const updated = inMemoryFeatureFlags.find(ff => ff.workspaceId === workspaceId && ff.flagKey === flagKey);
        return updated!;
      }

      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .update({ is_enabled: isEnabled })
        .eq("workspace_id", workspaceId)
        .eq("flag_key", flagKey)
        .select("*")
        .single();

      if (error) {
        console.warn("[FeatureFlagService] SQL Update error, updated in memory only:", error.message);
        const updated = inMemoryFeatureFlags.find(ff => ff.workspaceId === workspaceId && ff.flagKey === flagKey);
        return updated!;
      }

      return this.mapFromDb(data);
    } catch (err: any) {
      console.warn("[FeatureFlagService] updateFeatureFlag Exception, updated in memory only:", err.message);
      const updated = inMemoryFeatureFlags.find(ff => ff.workspaceId === workspaceId && ff.flagKey === flagKey);
      return updated!;
    }
  }

  private static mapFromDb(row: any): FeatureFlag {
    return {
      id: row.id || String(row.id_pk || ""),
      workspaceId: row.workspace_id,
      flagKey: row.flag_key,
      flagName: row.flag_name || row.flag_key,
      description: row.description || "",
      isEnabled: !!row.is_enabled,
      createdAt: row.created_at || new Date().toISOString()
    };
  }
}
