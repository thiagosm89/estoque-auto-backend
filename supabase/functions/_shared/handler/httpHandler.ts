export function handlerRequest(execute: (req: Request) => Promise<Response>) {
    return async (req: Request): Promise<Response> => {
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, apikey',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }
        if (req.method === 'POST') {
            return await execute(req);
        }
        return new Response('Method Not Allowed', { status: 405 });
    };
} 