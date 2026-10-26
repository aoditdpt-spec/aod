import { backendEnabled } from "@/lib/backend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { photoFileId, readPhoto } from "@/server/artist-photos";
import { currentStaff } from "@/server/staff";

// An artist's or applicant's profile photo from AOD's Google Drive (src/server/artist-photos.ts):
// /api/artist-photos/APP-231.img or /api/artist-photos/ART-101.img. Private: only signed-in staff
// and the artist themselves (the record's email) get it. The ".img" keeps src/proxy.ts from moving
// the address under a section on the artists and admin domains. Pages add ?v=<version>, so a new
// photo is a new address and the browser may keep each one for a day.
export const dynamic = "force-dynamic";

const notFound = () => new Response("Not found", { status: 404 });

export async function GET(_request: Request, { params }: RouteContext<"/api/artist-photos/[file]">) {
  const id = (await params).file.replace(/\.img$/i, "").toUpperCase();
  if (!backendEnabled || !process.env.SUPABASE_SECRET_KEY || !/^(APP|ART)-\d+$/.test(id)) return notFound();

  const { data: auth } = await (await createClient()).auth.getUser();
  const email = auth.user?.email?.toLowerCase();
  if (!email) return new Response("Sign in to see this photo", { status: 401 });

  const table = id.startsWith("APP") ? "applications" : "artists";
  const { data: r } = await createAdminClient().from(table).select("email, photo").eq("id", id).maybeSingle();
  if (!r) return notFound();
  const own = String(r.email ?? "").toLowerCase() === email;
  if (!own && !(await currentStaff())) return new Response("Not allowed", { status: 403 });

  const fileId = photoFileId(r.photo);
  if (!fileId) return notFound();
  try {
    const { bytes, type } = await readPhoto(fileId);
    return new Response(bytes, {
      headers: { "Content-Type": type.startsWith("image/") ? type : "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.error("[artist photo]", e);
    return notFound();
  }
}
