import { backendEnabled } from "@/lib/backend";
import { createClient } from "@/lib/supabase/server";
import { fromRow } from "@/server/rows";

// The signed-in, active staff member, with a database client acting as them (row-level security
// applies), or null. Server code only: the admin's actions (src/server/actions/admin.ts), the
// blog's photo uploads and sending the newsletter check this first.
export async function currentStaff() {
  if (!backendEnabled) return null;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return null;
  const { data } = await supabase.from("staff").select("*").eq("email", email).eq("active", true).maybeSingle();
  if (!data) return null;
  return { supabase, staff: fromRow.member(data) };
}
