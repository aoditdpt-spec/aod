"use server";

import { after } from "next/server";
import { cities } from "@/content/site";
import { companyLinkError, companyLinkOf, companyTypes, type Company } from "@/content/business-portal";
import { backendEnabled } from "@/lib/backend";
import { sectionUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { insertWithNextId } from "@/server/ids";
import { notifyEnabled, runOrQueue, spamNote, spamSubject, teamEmails, type Job } from "@/server/notify";

// The business portal's company accounts (aod.co.in/business). A company signs up after
// confirming its email with an emailed code (the same sign-in as My bookings), then signs in with
// that email. Its orders are the bookings made with the same email (myOrders in customer.ts), so
// nothing else needs linking. Companies are written only here, with the secret key, after the
// signed-in email is checked against the one being registered.

export type CompanyInput = {
  name: string;
  type: string;
  typeOther?: string; // what "Other" means
  contactName: string;
  email: string;
  phone: string;
  city: string;
  website: string; // website, LinkedIn or Linktree (required)
  trap?: string; // hidden field: only bots fill it in
};

type Saved = { ok: true; company: Company } | { ok: false; error: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const phoneOk = (p: string) => {
  const d = p.replace(/\D/g, "");
  return /^(?:91|0)?[6-9]\d{9}$/.test(d) || (d.length >= 8 && d.length <= 15);
};

const toCompany = (r: Record<string, unknown>): Company => ({
  id: String(r.id),
  name: String(r.name ?? ""),
  type: (companyTypes as readonly string[]).includes(String(r.type)) ? (String(r.type) as Company["type"]) : "",
  typeOther: String(r.type_other ?? ""),
  contactName: String(r.contact_name ?? ""),
  email: String(r.email ?? ""),
  phone: String(r.phone ?? ""),
  city: String(r.city ?? ""),
  website: String(r.website ?? ""),
});

async function signedIn(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

// The signed-in company, or null (not signed in, or the email has no company).
export async function myCompany(): Promise<Company | null> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return null;
  const email = await signedIn();
  if (!email) return null;
  const { data, error } = await createAdminClient().from("companies").select("*").eq("email", email).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toCompany(data) : null;
}

function check(input: CompanyInput) {
  const name = text(input.name, 80);
  const contactName = text(input.contactName, 80);
  const phone = text(input.phone, 20);
  const city = text(input.city, 40);
  const website = companyLinkOf(input.website);
  const type = text(input.type, 30);
  if (name.length < 2) return { error: "Enter your company name." };
  if (!(companyTypes as readonly string[]).includes(type)) return { error: "Choose what describes your company." };
  const typeOther = type === "Other" ? text(input.typeOther, 40) : "";
  if (type === "Other" && typeOther.length < 2) return { error: "Please specify what kind of company you are." };
  if (contactName.length < 2) return { error: "Enter the contact person's name." };
  if (!phoneOk(phone)) return { error: "Enter a valid phone number." };
  if (!cities.includes(city)) return { error: "Choose your city." };
  if (!website) return { error: website === null ? "Check the website, LinkedIn or Linktree link." : companyLinkError };
  return { value: { name, type, typeOther, contactName, phone, city, website } };
}

// Create the company for the email that has just been confirmed with a code.
export async function registerCompany(input: CompanyInput): Promise<Saved> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: false, error: "Sign-up isn't set up yet." };
  const email = await signedIn();
  if (!email || email !== text(input.email, 120).toLowerCase() || !emailOk(email)) return { ok: false, error: "Confirm your email with the code first." };
  const checked = check(input);
  if (!checked.value) return { ok: false, error: checked.error! };
  const v = checked.value;
  const suspect = text(input.trap, 200) !== "";

  try {
    const db = createAdminClient();
    const { data: existing } = await db.from("companies").select("id").eq("email", email).maybeSingle();
    if (existing) return { ok: false, error: "A company is already registered with this email. Sign in instead." };
    const [row] = await insertWithNextId(db, "companies", "BIZ", 101, (n) => [
      { id: `BIZ-${n}`, name: v.name, type: v.type, type_other: v.typeOther, contact_name: v.contactName, email, phone: v.phone, city: v.city, website: v.website },
    ]);
    after(async () => {
      const jobs: Job[] = [];
      if (await notifyEnabled("New business account"))
        jobs.push({
          kind: "email",
          to: await teamEmails(),
          subject: spamSubject(suspect, `New business account ${row.id}: ${v.name} (${v.type === "Other" ? `Other: ${v.typeOther}` : v.type}, ${v.city})`),
          text: `${v.name} (${v.type === "Other" ? `Other: ${v.typeOther}` : v.type}), ${v.city}\nContact: ${v.contactName}, ${v.phone}, ${email}\nWebsite / LinkedIn / Linktree: ${v.website}${suspect ? `\n\n${spamNote(new Date().toISOString()).text}` : ""}\n\nTheir orders appear in Bookings as business bookings: ${sectionUrl("admin", "/bookings")}`,
          replyTo: email,
        });
      if (!suspect)
        jobs.push({
          kind: "email",
          to: [email],
          subject: `Welcome to AOD for Business (${row.id})`,
          text: `Hi ${v.contactName},\n\nYour company account for ${v.name} is ready. Sign in at aod.co.in/business with this email to book artists, see your calendar and follow every order.\n\nYour reference: ${row.id}\n\n– Team AOD`,
        });
      if (jobs.length) await runOrQueue(jobs);
    });
    return { ok: true, company: toCompany(row) };
  } catch (e) {
    console.error("[company signup]", e);
    return { ok: false, error: "Couldn't create the account just now. Please try again." };
  }
}

// The company changes its own details (the sign-in email stays).
export async function updateMyCompany(input: Omit<CompanyInput, "email" | "trap">): Promise<Saved> {
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY) return { ok: false, error: "Saving isn't set up yet." };
  const email = await signedIn();
  if (!email) return { ok: false, error: "Please sign in again." };
  const checked = check({ ...input, email });
  if (!checked.value) return { ok: false, error: checked.error! };
  const v = checked.value;
  const { data, error } = await createAdminClient()
    .from("companies")
    .update({ name: v.name, type: v.type, type_other: v.typeOther, contact_name: v.contactName, phone: v.phone, city: v.city, website: v.website })
    .eq("email", email)
    .select("*")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Couldn't save your details just now. Please try again." };
  return { ok: true, company: toCompany(data) };
}
