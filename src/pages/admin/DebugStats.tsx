import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function DebugStats() {
    const [logs, setLogs] = useState<string[]>([]);

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);

    useEffect(() => {
        async function runDiagnostics() {
            log("Starting Diagnostics...");

            // 1. Check User
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            log(`Auth User: ${user?.email || "None"} (${user?.id})`);
            if (authError) log(`Auth Error: ${authError.message}`);

            if (user) {
                // 2. Check Profile
                const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
                log(`Profile State: ${profile?.state}`);
                log(`Profile Role (from DB): ${profile?.role}`); // Note: profiles might not have role column if using user_roles
                if (profileError) log(`Profile Error: ${profileError.message}`);

                // 3. Check User Roles
                const { data: roleData, error: roleError } = await supabase.from("user_roles").select("*").eq("user_id", user.id);
                log(`User Roles Table: ${JSON.stringify(roleData)}`);
                if (roleError) log(`Role Error: ${roleError.message}`);

                // 4. Test Profiles Count
                const { count, error: countError } = await supabase.from("profiles").select("*", { count: "exact", head: true });
                log(`Total Profiles Count: ${count}`);
                if (countError) log(`Count Error: ${countError.message}`);

                // 5. Test Profiles Select
                const { data: profilesList, error: listError } = await supabase.from("profiles").select("id, full_name, state").limit(5);
                log(`First 5 Profiles: ${JSON.stringify(profilesList)}`);
                if (listError) log(`List Error: ${listError.message}`);
            }
        }
        runDiagnostics();
    }, []);

    return (
        <div className="p-8 bg-black text-green-400 font-mono text-sm min-h-screen">
            <h1 className="text-xl font-bold mb-4">System Diagnostics</h1>
            <pre className="whitespace-pre-wrap">{logs.join("\n")}</pre>
        </div>
    );
}
