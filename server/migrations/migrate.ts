import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const MIGRATIONS_DIR = path.dirname(new URL(import.meta.url).pathname);

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";

  if (!supabaseUrl) {
    console.error("SUPABASE_URL must be set");
    process.exit(1);
  }

  // Get ordered migration files
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  console.log(`Found ${files.length} migration file(s):`);
  for (const file of files) {
    console.log(`  - ${file}`);
  }

  console.log("\n⚠️  The Supabase JS client cannot execute raw DDL statements.");
  console.log("   To apply migrations, follow these steps:\n");
  console.log("   1. Open Supabase Studio SQL Editor");
  console.log("   2. Copy the contents of each .sql file in order:");
  for (const file of files) {
    console.log(`      → ${file}`);
  }
  console.log("   3. Paste into SQL Editor and click 'Run'");
  console.log("   4. Verify tables appear in the Table Editor\n");
  console.log("Alternatively, use the Supabase CLI:");
  console.log("  npx supabase db push");
}

migrate().catch(console.error);
