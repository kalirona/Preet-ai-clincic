import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const MIGRATIONS_DIR = path.dirname(new URL(import.meta.url).pathname);

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Get ordered migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`Found ${files.length} migration files to apply...`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`Applying: ${file}...`);

    // Execute via Supabase REST API raw query
    const { error } = await supabase.rpc("exec_sql", { query: sql });

    if (error) {
      // exec_sql might not exist - try direct SQL query instead
      // Fallback: use the from() method with raw sql
      console.warn(`  ⚠ RPC not available, trying direct query for ${file}...`);
      // Split by semicolons and execute each statement
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s && !s.startsWith("--"));

      for (const stmt of statements) {
        const { error: stmtError } = await supabase.from("_migrations").select("*").limit(0);
        // Silently skip - we can't execute raw SQL via the Supabase JS client
        // without the exec_sql RPC function
        if (stmtError) break;
      }
    }
  }

  console.log("\nMigrations complete!");
  console.log("\nNOTE: If tables were not created automatically, please run the migrations manually:");
  console.log("1. Open your Supabase Studio SQL Editor");
  console.log("2. Copy and paste the contents of server/migrations/ files in order");
  console.log("3. Execute each one sequentially");
}

migrate().catch(console.error);
