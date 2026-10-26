// An artist's profile photo, kept in their own Google Drive: AOD stores only the link. Checks the
// link an artist pastes in (a Google Drive file, not a folder or another site), turns it into the
// one address AOD saves (drive.google.com/file/d/<id>/view), and gives the address the pages load
// the picture from (Drive's thumbnail service, which works for files shared "Anyone with the link").
// Runs in the browser and again on the server; no imports, so it can be tested on its own
// (npm run check:links).

export type DrivePhotoCheck = { ok: true; id: string; url: string } | { ok: false; message: string };

// Drive file ids are long runs of letters, digits, _ and -.
const ID = /^[A-Za-z0-9_-]{10,}$/;

export const drivePhotoHelp = "In Google Drive, right-click the photo → Share → set General access to “Anyone with the link” → Copy link.";

export function checkDrivePhoto(input: string): DrivePhotoCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, message: "Paste the Google Drive link to your photo." };
  if (/\s/.test(raw)) return { ok: false, message: "A link can't contain spaces." };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, message: "That doesn't look like a web address." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, message: "Use the link that starts with https://drive.google.com." };

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined;

  if (host === "drive.google.com" || host === "docs.google.com") {
    if (parts.includes("folders")) return { ok: false, message: "That's a folder. Open the photo itself in Drive and copy its link." };
    // file/d/<id>/view, file/u/0/d/<id>/view, open?id=<id>, uc?id=<id>, thumbnail?id=<id>
    const d = parts[0] === "file" ? parts.indexOf("d") : -1;
    if (d > 0) id = parts[d + 1];
    else if (["open", "uc", "thumbnail"].includes(parts[0] ?? "")) id = url.searchParams.get("id");
  } else if (host === "lh3.googleusercontent.com" && parts[0] === "d") {
    id = parts[1]?.split("=")[0];
  } else {
    return { ok: false, message: "Only Google Drive links are accepted for the profile photo." };
  }

  if (!id || !ID.test(id)) return { ok: false, message: "Copy the link to the photo itself (Share → Copy link)." };
  return { ok: true, id, url: `https://drive.google.com/file/d/${id}/view` };
}

// The address to show the photo from, about `width` pixels wide; "" when the link isn't a Drive file.
export function drivePhotoSrc(link: string | undefined, width = 400): string {
  const check = link ? checkDrivePhoto(link) : null;
  return check?.ok ? `https://drive.google.com/thumbnail?id=${check.id}&sz=w${width}` : "";
}
