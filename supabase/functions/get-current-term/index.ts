import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { getSupabaseClient } from "../_shared/helper/supabaseClient.ts";
import { EnvHelper } from "../_shared/helper/envHelper.ts";
import { handlerRequestAuth } from "../_shared/handler/httpHandler.ts";
import ErrorResponseBuilder from "../_shared/validation/ErrorResponseBuilder.ts";

if (!EnvHelper.isLocal()) {
    Deno.serve(execute());
}

export async function execute() {
    return handlerRequestAuth(async (_req, _ctx) => {
        const supabase = getSupabaseClient();
        try {
            const { data: term, error } = await supabase
                .from("company_terms")
                .select("hash, version, text, effective_from")
                .eq("is_active", true)
                .order("effective_from", { ascending: false })
                .limit(1)
                .single();
            if (error || !term) {
                return new ErrorResponseBuilder()
                    .add(null, "Termo vigente não encontrado.", "TERM_NOT_FOUND")
                    .buildResponse(404);
            }
            return new Response(JSON.stringify(term), { status: 200 });
        } catch (err) {
            return new ErrorResponseBuilder()
                .add(null, "Erro inesperado: " + err, "UNEXPECTED_ERROR")
                .buildResponse(500);
        }
    });
} 