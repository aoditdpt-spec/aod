import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runJob, type Job } from "@/server/notify";

// Retries queued jobs (sheet rows, emails) that failed or waited for keys. Called by Vercel Cron
// (or by hand) with `Authorization: Bearer <CRON_SECRET>`. A job is given up after 6 tries and
// stays in the outbox table, marked failed, with its last error.

export const dynamic = "force-dynamic";
const MAX_ATTEMPTS = 6;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return NextResponse.json({ error: "Supabase isn't configured" }, { status: 503 });
  }

  const db = createAdminClient();
  const { data: jobs, error } = await db.from("outbox").select("*").eq("status", "pending").order("id").limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let done = 0;
  let failed = 0;
  for (const row of jobs ?? []) {
    try {
      await runJob(row.payload as Job);
      await db.from("outbox").update({ status: "done", done_at: new Date().toISOString(), attempts: row.attempts + 1 }).eq("id", row.id);
      done++;
    } catch (e) {
      const attempts = row.attempts + 1;
      await db
        .from("outbox")
        .update({ attempts, status: attempts >= MAX_ATTEMPTS ? "failed" : "pending", last_error: (e instanceof Error ? e.message : String(e)).slice(0, 500) })
        .eq("id", row.id);
      failed++;
    }
  }
  return NextResponse.json({ checked: jobs?.length ?? 0, done, failed });
}
