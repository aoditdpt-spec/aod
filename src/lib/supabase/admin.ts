import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Supabase client with the secret key, for server code only (server actions, route handlers).
// It skips row-level security, so use it only after the server has checked the input or the
// caller: saving the public forms, looking up staff before sending a sign-in code, and the jobs
// queue. The key has no NEXT_PUBLIC_ prefix, so it never reaches the browser.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase isn't configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
