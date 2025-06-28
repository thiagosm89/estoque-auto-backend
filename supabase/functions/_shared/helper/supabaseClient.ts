import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { EnvHelper } from "./envHelper.ts";

export function getSupabaseClient() {
    const url = EnvHelper.get("SUPABASE_URL");
    const key = EnvHelper.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
        throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidas.");
    }
    return createClient(url, key);
} 