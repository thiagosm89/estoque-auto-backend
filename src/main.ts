import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { execute as executeRegisterCompany } from "../supabase/functions/register-company/index.ts";
import { execute as executeOnboarding } from "../supabase/functions/onboarding-company/index.ts";
import { execute as executeGetCurrentTerm } from "../supabase/functions/get-current-term/index.ts";

console.log("[dev] API local rodando em http://localhost:8787");

const routes: Record<string, (req: Request) => Promise<Response>> = {
    "/functions/v1/register-company": executeRegisterCompany(),
    "/functions/v1/onboarding-company": executeOnboarding(),
    "/functions/v1/get-current-term": executeGetCurrentTerm(),
};

serve(async (req: Request) => {
    const url = new URL(req.url);
    const routeKey = `${url.pathname}`;
    const handler = routes[routeKey];
    if (handler) {
        return handler(req);
    }
    return new Response("Not Found", { status: 404 });
}, { port: 8787 });
