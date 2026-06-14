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

// Default feature flag templates (used only for seeding new workspaces)
const defaultFeatureFlags: Omit<FeatureFlag, "id" | "workspaceId" | "createdAt">[] = [
  {
    flagKey: "ai_assistant",
    flagName: "AI Assistant Co-Pilot",
    description: "Enables conversational LLM memory context, AI-backed insights, and live chat automations.",
    isEnabled: true,
  },
  {
    flagKey: "courses",
    flagName: "LMS & Onboarding Courses",
    description: "Allows publishing video modules, slides, and educational onboarding courses for signed clients.",
    isEnabled: false,
  },
  {
    flagKey: "community",
    flagName: "Community Portal & Forum",
    description: "Activates client discussion forums, direct participant threads, and bulletins.",
    isEnabled: false,
  },
  {
    flagKey: "blog_planner",
    flagName: "AI SEO Blog Planner",
    description: "Deep integrated SEO keywords researcher, content generation draft, and scheduling board.",
    isEnabled: true,
  }
];

export class FeatureFlagService {
  static async getFeatureFlags(workspaceId: string): Promise<FeatureFlag[]> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .eq("workspace_id", workspaceId);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Seed default flags for this workspace
        const { error: insertError } = await supabase
          .from("feature_flags")
          .insert(
            defaultFeatureFlags.map(ff => ({
              workspace_id: workspaceId,
              flag_key: ff.flagKey,
              flag_name: ff.flagName,
              description: ff.description,
              is_enabled: ff.isEnabled
            }))
          );

        if (insertError) {
          console.warn("[FeatureFlagService] Failed to seed default flags:", insertError.message);
          return defaultFeatureFlags.map((ff, i) => ({
            id: `ff_${workspaceId}_${i}`,
            workspaceId,
            ...ff,
            createdAt: new Date().toISOString()
          }));
        }

        const { data: refetched } = await supabase
          .from("feature_flags")
          .select("*")
          .eq("workspace_id", workspaceId);

        return (refetched || []).map(this.mapFromDb);
      }

      return data.map(this.mapFromDb);
    } catch (err: any) {
      console.warn("[FeatureFlagService] getFeatureFlags error:", err.message);
      throw err;
    }
  }

  static async updateFeatureFlag(workspaceId: string, flagKey: string, isEnabled: boolean): Promise<FeatureFlag> {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .update({ is_enabled: isEnabled })
        .eq("workspace_id", workspaceId)
        .eq("flag_key", flagKey)
        .select("*")
        .single();

      if (error) throw error;
      return this.mapFromDb(data);
    } catch (err: any) {
      console.warn("[FeatureFlagService] updateFeatureFlag error:", err.message);
      throw err;
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
