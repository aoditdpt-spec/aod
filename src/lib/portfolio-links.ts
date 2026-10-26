// Checks a portfolio link an artist pastes in: is it a real web address, is it on one of the
// platforms AOD accepts (Instagram, YouTube or Google Drive; any other site is turned away), and
// does it point at something the team can open (a profile, channel, video, folder or file, not a
// chat link or the platform's home page). Runs in the browser as the artist types; no imports, so it can
// be tested on its own. Once the backend exists, the server should also fetch each link to
// confirm it loads (see the platform plan doc).

export type LinkCheck =
  | { ok: true; url: string; platform: string; label: string; warning?: string }
  | { ok: false; message: string };

const HANDLE = /^[A-Za-z0-9._-]{1,60}$/;

export function checkPortfolioLink(input: string): LinkCheck {
  const raw = input.trim();
  if (!raw) return { ok: false, message: "Paste a link to your work." };
  if (/\s/.test(raw)) return { ok: false, message: "A link can't contain spaces." };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, message: "That doesn't look like a web address." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, message: "Use a normal web link starting with https://." };
  }

  const host = url.hostname.toLowerCase().replace(/^(www\.|m\.)/, "");
  if (!host.includes(".") || host === "localhost" || /^[\d.]+$/.test(host)) {
    return { ok: false, message: "That address isn't a public website." };
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const clean = url.toString();

  if (host === "wa.me" || host.endsWith("whatsapp.com")) {
    return { ok: false, message: "That's a WhatsApp chat link. Add a link to your work instead." };
  }

  if (host === "instagram.com") {
    if (parts[0] === "p" || parts[0] === "reel" || parts[0] === "reels") {
      return { ok: true, url: clean, platform: "Instagram", label: "Instagram post" };
    }
    if (parts.length >= 1 && HANDLE.test(parts[0])) {
      return { ok: true, url: clean, platform: "Instagram", label: `Instagram @${parts[0]}` };
    }
    return { ok: false, message: "Add your Instagram profile link, e.g. instagram.com/yourname." };
  }

  if (host === "youtube.com" || host === "youtu.be") {
    if (host === "youtu.be" && parts[0]) return { ok: true, url: clean, platform: "YouTube", label: "YouTube video" };
    if (parts[0]?.startsWith("@")) return { ok: true, url: clean, platform: "YouTube", label: `YouTube ${parts[0]}` };
    if (parts[0] === "watch" && url.searchParams.get("v")) return { ok: true, url: clean, platform: "YouTube", label: "YouTube video" };
    if (parts[0] === "shorts" && parts[1]) return { ok: true, url: clean, platform: "YouTube", label: "YouTube Short" };
    if ((parts[0] === "channel" || parts[0] === "c" || parts[0] === "playlist") && (parts[1] || url.searchParams.get("list"))) {
      return { ok: true, url: clean, platform: "YouTube", label: parts[0] === "playlist" ? "YouTube playlist" : "YouTube channel" };
    }
    return { ok: false, message: "Add a YouTube channel or video link." };
  }

  if (host === "drive.google.com") {
    // A folder (drive/folders/…, drive/u/0/folders/…), a file (file/d/…) or an open?id= link.
    const folder = parts[0] === "drive" && parts.includes("folders") && parts[parts.indexOf("folders") + 1];
    const file = parts[0] === "file" && parts[1] === "d" && parts[2];
    const open = parts[0] === "open" && url.searchParams.get("id");
    if (folder || file || open) {
      return {
        ok: true,
        url: clean,
        platform: "Google Drive",
        label: file ? "Google Drive file" : "Google Drive folder",
        warning: "Set sharing to “Anyone with the link” so our team can open it.",
      };
    }
    return { ok: false, message: "Add the link to a Google Drive folder or file (Share → Copy link)." };
  }

  return { ok: false, message: "Only Instagram, YouTube and Google Drive links are accepted." };
}

// A Google Drive link only (a folder or a file): the photos of an applicant's equipment, asked in
// "Your work details" (kind "link" in src/content/artist-portal.ts).
export function checkDriveLink(input: string): LinkCheck {
  const check = checkPortfolioLink(input);
  if (check.ok && check.platform === "Google Drive") return check;
  if (!input.trim()) return check;
  return { ok: false, message: check.ok ? "Use a Google Drive link here (a folder or a photo)." : check.message.replace("Only Instagram, YouTube and Google Drive links are accepted.", "Use a Google Drive link here (a folder or a photo).") };
}
