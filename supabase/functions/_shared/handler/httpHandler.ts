import ErrorResponseBuilder from "../validation/ErrorResponseBuilder.ts";
import { getSupabaseClient } from "../../_shared/helper/supabaseClient.ts";

function handler(execute: (req: Request, ctx) => Promise<Response>, withAuth: boolean = false) {
    return async (req: Request, ctx): Promise<Response> => {
        const allowedOrigin = req.headers.get('origin') || '*';

        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': allowedOrigin,
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, apikey, authorization, Authorization, x-client-info',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        if (withAuth) {
            const supabase = getSupabaseClient();
            const { headers } = req;
            const authHeader = headers.get("authorization");

            if (!authHeader) {
                return new ErrorResponseBuilder()
                    .add(null, "Usuário não autenticado.", "NOT_AUTHENTICATED")
                    .buildResponse(401);
            }

            const token = authHeader.split(' ')[1];

            const { data: user, error } = await supabase.auth.api.getUser(token);
            console.log(user);

            if (error) {
                return new ErrorResponseBuilder()
                    .add(null, "Usuário não autenticado.", "NOT_AUTHENTICATED")
                    .buildResponse(401);
            }
        }

        if (req.method === 'POST') {
            const res = await execute(req, ctx);
            const headers = new Headers(res.headers);
            headers.set('Access-Control-Allow-Origin', allowedOrigin);
            return new Response(res.body, {
                status: res.status,
                statusText: res.statusText,
                headers,
            });
        }
        return new Response('Method Not Allowed', { status: 405 });
    };
}

export function handlerRequest(execute: (req: Request, ctx) => Promise<Response>) {
    return handler(execute);
}

export function handlerRequestAuth(execute: (req: Request, ctx) => Promise<Response>) {
    return handler(execute, true);
}