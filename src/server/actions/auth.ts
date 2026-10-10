"use server";

import { backendEnabled } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Sign-in by emailed 6-digit code (Supabase Auth email OTP), for staff, customers and artists.
// The session is kept in cookies, so server actions know who is signed in.
// Staff can only get a code for an email listed in Team & roles; what each person may see or
// change is then enforced by the database (supabase/migrations).

export type Result = { ok: true } | { ok: false; error: string };

const clean = (email: string) => email.trim().toLowerCase();
const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

// Supabase's messages, in plainer words where we know them.
function friendly(message: string) {
  if (/security purposes|rate limit|too many/i.test(message)) return "Please wait a minute before asking for another code.";
  if (/signups not allowed/i.test(message)) return "Sign-in with this email isn't allowed.";
  return "Couldn't send the code just now. Please try again in a minute.";
}

export async function requestCode(rawEmail: string, who: "staff" | "customer" | "artist"): Promise<Result> {
  if (!backendEnabled) return { ok: false, error: "Sign-in isn't set up yet." };
  const email = clean(rawEmail);
  if (!emailOk(email)) return { ok: false, error: "Enter a valid email address." };

  if (who === "artist") {
    const db = createAdminClient();
    const [{ data: artist }, { data: app }] = await Promise.all([
      db.from("artists").select("id").eq("email", email).limit(1).maybeSingle(),
      db.from("applications").select("id").eq("email", email).limit(1).maybeSingle(),
    ]);
    if (!artist && !app) return { ok: false, error: "AOD has no artist or application with this email. Use the email you applied with, or apply to join." };
  }

  if (who === "staff") {
    const { data, error } = await createAdminClient().from("staff").select("id").eq("email", email).eq("active", true).maybeSingle();
    if (error) return { ok: false, error: "Couldn't check the team list just now. Please try again." };
    if (!data) return { ok: false, error: "This email isn't on the AOD team. Ask the owner to add you in Team & roles." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { ok: false, error: friendly(error.message) };
  return { ok: true };
}

export async function verifyCode(rawEmail: string, code: string): Promise<Result> {
  if (!backendEnabled) return { ok: false, error: "Sign-in isn't set up yet." };
  const email = clean(rawEmail);
  if (!emailOk(email) || !/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code from the email." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) return { ok: false, error: "That code didn't work or has expired. Check it, or ask for a new one." };
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  if (!backendEnabled) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// The signed-in email, or null.
export async function signedInEmail(): Promise<string | null> {
  if (!backendEnabled) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}
