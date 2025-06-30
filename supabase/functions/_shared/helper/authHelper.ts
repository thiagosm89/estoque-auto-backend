import { getSupabaseClient } from "./supabaseClient.ts";

export async function getUserFromRequest(req: Request) {
    const supabase = getSupabaseClient();
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return { user: null, error: { message: 'Token not found.' } };
    const token = authHeader.split(' ')[1];
    const { data: userData, error } = await supabase.auth.getUser(token);
    const user = await userData?.user;
    return { user, error };
} 