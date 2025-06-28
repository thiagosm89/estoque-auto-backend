import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { execute as executeRegisterCompany } from "./supabase/functions/register-company/index.ts";
import { execute as executeOnboarding } from "./supabase/functions/onboarding-company/index.ts";

console.log("[dev] API local rodando em http://localhost:8787");

serve(async (req: Request, ctx) => {
    const url = new URL(req.url);
    if (url.pathname === "/functions/v1/register-company" && req.method === "POST") {
        // Chama o handler da edge function
        return executeRegisterCompany()(req, ctx);
    }
    if (url.pathname === "/functions/v1/onboarding-company" && req.method === "POST") {
        // Chama o handler da nova edge function de onboarding
        return executeOnboarding()(req, ctx);
    }
    return new Response("Not Found", { status: 404 });
}, { port: 8787 });
