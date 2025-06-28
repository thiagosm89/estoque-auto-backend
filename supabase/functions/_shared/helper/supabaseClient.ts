import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export function getSupabaseClient() {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
        throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.");
    }
    return createClient(url, key);
} 