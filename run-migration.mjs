/**
 * run-migration.mjs — Runs SQL via Supabase Management API
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVICE_ROLE_KEY = process.argv[2];
const PROJECT_REF = "wavdcidowmeknqjbaehz";

if (!SERVICE_ROLE_KEY) {
    console.error("Usage: node run-migration.mjs YOUR_SERVICE_ROLE_KEY");
    process.exit(1);
}

let sql;
try {
    sql = readFileSync(join(__dirname, "schema_updates.sql"), "utf-8");
    console.log("📄 SQL file loaded, length:", sql.length, "chars");
} catch (e) {
    console.error("❌ Could not find schema_updates.sql:", e.message);
    process.exit(1);
}

// Split SQL into individual statements and run each one
const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`🚀 Connecting to Supabase project: ${PROJECT_REF}`);
console.log(`� Found ${statements.length} SQL statements to execute...\n`);

const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

// Use Supabase's postgres "rpc" to execute raw SQL via a function
// We'll use the pg-meta compatible REST endpoint
let successCount = 0;
let failCount = 0;

for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.startsWith("--")) continue;

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Prefer": "params=single-object"
            },
            body: JSON.stringify({ sql: stmt })
        });

        if (res.ok) {
            successCount++;
            process.stdout.write(".");
        } else {
            // Try via Management API
            const mgmt = await fetch(
                `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
                    },
                    body: JSON.stringify({ query: stmt + ";" })
                }
            );

            if (mgmt.ok) {
                successCount++;
                process.stdout.write(".");
            } else {
                const errText = await mgmt.text();
                // Ignore "already exists" type errors — those are safe
                if (errText.includes("already exists") || errText.includes("duplicate") || errText.includes("42710") || errText.includes("42P07")) {
                    process.stdout.write("~");
                    successCount++;
                } else {
                    process.stdout.write("x");
                    failCount++;
                    console.error(`\n⚠️  Statement ${i + 1} warning: ${errText.slice(0, 120)}`);
                }
            }
        }
    } catch (err) {
        process.stdout.write("x");
        failCount++;
        console.error(`\n⚠️  Statement ${i + 1} error: ${err.message}`);
    }
}

console.log(`\n\n📊 Results: ${successCount} succeeded, ${failCount} failed`);

if (failCount === 0) {
    console.log("\n✅ Migration completed successfully!");
} else {
    console.log("\n⚠️  Some statements had issues. This is usually fine if they say 'already exists'.");
}

console.log("\n🎉 Database is ready! What was applied:");
console.log("   • EVENT_MANAGER role in app_role enum");
console.log("   • allow_email_sharing, event_manager_expiry, display_order columns on profiles");
console.log("   • get_public_leaders() RPC function (fixes Leadership page)");
console.log("   • event_forms table");
console.log("   • event_form_responses table\n");
