import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import registerCompanyHandler, {execute} from "./supabase/functions/register-company/index.ts";

console.log("[dev] API local rodando em http://localhost:8787");

serve(async (req: Request) => {
    const url = new URL(req.url);
    if (url.pathname === "/functions/v1/register-company" && req.method === "POST") {
        // Chama o handler da edge function
        return execute()(req);
    }
    return new Response("Not Found", { status: 404 });
}, { port: 8787 });
