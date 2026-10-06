// Checks a portfolio link an artist pastes in: is it a real web address, which platform is it,
// and does it point at something a customer can open (a profile, channel or video, not a
// chat link or a private file). Runs in the browser as the artist types; no imports, so it can
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

  if (host === "vimeo.com") {
    if (parts[0]) return { ok: true, url: clean, platform: "Vimeo", label: /^\d+$/.test(parts[0]) ? "Vimeo video" : `Vimeo ${parts[0]}` };
    return { ok: false, message: "Add a Vimeo profile or video link." };
  }

  if (host === "behance.net") {
    if (parts[0]) return { ok: true, url: clean, platform: "Behance", label: parts[0] === "gallery" ? "Behance project" : `Behance ${parts[0]}` };
    return { ok: false, message: "Add your Behance profile link." };
  }

  if (host === "drive.google.com" || host === "photos.google.com" || host === "photos.app.goo.gl") {
    return {
      ok: true,
      url: clean,
      platform: "Google Drive",
      label: host === "drive.google.com" ? "Google Drive folder" : "Google Photos album",
      warning: "Set sharing to “Anyone with the link” so our team can open it.",
    };
  }

  if (host === "facebook.com" || host === "fb.com") {
    return { ok: true, url: clean, platform: "Facebook", label: "Facebook page" };
  }

  if (url.protocol === "http:") {
    return { ok: true, url: clean, platform: "Website", label: host, warning: "This site isn't secure (http). Use the https:// link if there is one." };
  }
  return { ok: true, url: clean, platform: "Website", label: host };
}
