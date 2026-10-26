import { categories } from "@/content/site";
import { categoryCodes } from "@/lib/order-id";
import { photoFileName } from "@/lib/artist-photo";
import { createAdminClient } from "@/lib/supabase/admin";
import { DRIVE_SCOPE, googleToken, type PhotoJob } from "@/server/notify";

// Artists' profile photos on AOD's Google Drive (a Shared Drive the service account is a Content
// manager of; a service account can't keep files in an ordinary "My Drive"). ARTIST_PHOTOS_FOLDER_ID
// is the "Artists" folder (or the Shared Drive itself); inside it each category has a folder
// ("Photographers", "Drone Pilots"…), made the first time it's needed.
//
// One file per artist, in their main category's folder, named <code>_<NAME>_<application id>
// (PH_AMANSHAH_APP-231.webp); each other category they work in gets a Drive shortcut to it, so
// every category folder lists everyone without a second copy. A new photo replaces the file's
// content (same file, same shortcuts). The record's `photo` keeps "<Drive file id>~<version>":
// the version changes with each new photo, so browsers fetch the new one.
// The photos are private: pages show them through /api/artist-photos/<id>.img, which only
// signed-in staff and the artist themselves may open.

const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// The Drive file id in a record's `photo` ("<id>~<version>"), or null.
export const photoFileId = (photo: unknown) => (typeof photo === "string" && /^[\w-]{10,}(~\w+)?$/.test(photo) ? photo.split("~")[0] : null);

// "data:image/webp;base64,…" from the browser → its type and base64 data, checked.
export function readDataUrl(dataUrl: unknown): { type: string; data: string } | { error: string } {
  const m = typeof dataUrl === "string" ? dataUrl.match(/^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=]+)$/) : null;
  if (!m || !PHOTO_TYPES.includes(m[1])) return { error: "Use a JPG, PNG or WebP photo." };
  if ((m[2].length * 3) / 4 > MAX_PHOTO_BYTES) return { error: "That photo is too large. Pick a smaller one." };
  return { type: m[1], data: m[2] };
}

function rootFolder() {
  const raw = process.env.ARTIST_PHOTOS_FOLDER_ID?.trim() ?? "";
  // The folder's ID, or its whole address pasted in (…/folders/<id>…): either works.
  const id = raw.match(/\/folders\/([\w-]+)/)?.[1] ?? raw;
  if (!/^[\w-]{10,}$/.test(id)) throw new Error("Artists' photos aren't set up yet (ARTIST_PHOTOS_FOLDER_ID).");
  return id;
}

async function drive(token: string, url: string, init: RequestInit = {}) {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`Google Drive ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

const folderIds = new Map<string, string>(); // category name → its folder, for this server instance

async function categoryFolder(token: string, root: string, name: string) {
  const known = folderIds.get(name);
  if (known) return known;
  const q = `name = '${name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}' and '${root}' in parents and mimeType = '${FOLDER}' and trashed = false`;
  const found = (await (
    await drive(token, `${DRIVE}/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=allDrives`)
  ).json()) as { files?: { id: string }[] };
  const id =
    found.files?.[0]?.id ??
    ((await (
      await drive(token, `${DRIVE}/files?supportsAllDrives=true&fields=id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mimeType: FOLDER, parents: [root] }),
      })
    ).json()) as { id: string }).id;
  folderIds.set(name, id);
  return id;
}

// One multipart request: the file's details and its bytes.
function multipart(meta: object, type: string, data: string) {
  const boundary = `aod${Date.now().toString(36)}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`),
    Buffer.from(data, "base64"),
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  return { body, headers: { "Content-Type": `multipart/related; boundary=${boundary}` } };
}

const categoryName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "Other";

// Put the photo on Drive (a new file, or new content for the record's existing one) and note it
// on the record. Runs as a job (src/server/notify.ts), so a failure waits in the outbox and retries.
export async function savePhoto(job: PhotoJob) {
  const db = createAdminClient();
  const { data: r, error } = await db.from(job.table).select("*").eq("id", job.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!r) return; // the record is gone: nothing to attach the photo to
  const main = String(r.category ?? "");
  const others = (Array.isArray(r.other_categories) ? r.other_categories.map(String) : []).filter((c: string) => c && c !== main);
  // An artist approved from an application keeps the application's number in the file name.
  const ref = job.table === "artists" ? (await db.from("applications").select("id").eq("artist_id", job.id).maybeSingle()).data?.id ?? job.id : job.id;
  const name = photoFileName(categoryCodes[main] ?? "AR", String(r.name ?? ""), String(ref), job.type);

  const token = await googleToken(DRIVE_SCOPE);
  const root = rootFolder();
  let fileId = photoFileId(r.photo);
  if (fileId) {
    // New content for the same file, so its shortcuts keep working.
    const { body, headers } = multipart({ name }, job.type, job.data);
    const res = await fetch(`${UPLOAD}/files/${fileId}?uploadType=multipart&supportsAllDrives=true&fields=id`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, ...headers },
      body,
    });
    if (res.status === 404) fileId = null; // deleted on Drive: make a new one
    else if (!res.ok) throw new Error(`Google Drive ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  if (!fileId) {
    const folder = await categoryFolder(token, root, categoryName(main));
    const { body, headers } = multipart({ name, parents: [folder] }, job.type, job.data);
    fileId = ((await (await drive(token, `${UPLOAD}/files?uploadType=multipart&supportsAllDrives=true&fields=id`, { method: "POST", headers, body })).json()) as { id: string }).id;
    // A shortcut in each other category's folder (no second copy).
    for (const slug of others) {
      const other = await categoryFolder(token, root, categoryName(slug));
      await drive(token, `${DRIVE}/files?supportsAllDrives=true&fields=id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mimeType: SHORTCUT, parents: [other], shortcutDetails: { targetId: fileId } }),
      });
    }
  }
  const photo = `${fileId}~${Date.now().toString(36)}`;
  const { error: saveError } = await db.from(job.table).update({ photo }).eq("id", job.id);
  if (saveError) throw new Error(saveError.message);
  // An approved applicant's artist record shows the same photo.
  if (job.table === "applications" && r.artist_id) await db.from("artists").update({ photo }).eq("id", String(r.artist_id));
}

// The photo's bytes, for /api/artist-photos.
export async function readPhoto(fileId: string) {
  const token = await googleToken(DRIVE_SCOPE);
  const res = await drive(token, `${DRIVE}/files/${fileId}?alt=media&supportsAllDrives=true`);
  return { bytes: await res.arrayBuffer(), type: res.headers.get("content-type") ?? "image/jpeg" };
}
