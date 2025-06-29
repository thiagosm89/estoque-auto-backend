import ErrorResponseBuilder from "../validation/ErrorResponseBuilder.ts";
import { getUserFromRequest } from "../../_shared/helper/authHelper.ts";

function handler(execute: (req: Request) => Promise<Response>, withAuth: boolean = false) {
    return async (req: Request): Promise<Response> => {
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
            const { user, error } = await getUserFromRequest(req);

            if (error) {
                return new ErrorResponseBuilder()
                    .add(null, "Usuário não autenticado.", "NOT_AUTHENTICATED")
                    .buildResponse(401);
            }
        }

        if (req.method === 'POST') {
            const res = await execute(req);
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

export function handlerRequest(execute: (req: Request) => Promise<Response>) {
    return handler(execute);
}

export function handlerRequestAuth(execute: (req: Request) => Promise<Response>) {
    return handler(execute, true);
}