// Checks the artist portal's portfolio-link rules (src/lib/portfolio-links.ts) and the profile
// photo's Google Drive link rules (src/lib/drive-photo.ts).
// Run with: npm run check:links
import { checkDrivePhoto, drivePhotoSrc } from "../src/lib/drive-photo.ts";
import { checkPortfolioLink } from "../src/lib/portfolio-links.ts";

// link → the label expected when accepted, or null when it must be turned away
const cases: Record<string, string | null> = {
  "instagram.com/kavya.frames": "Instagram @kavya.frames",
  "https://www.instagram.com/kavya.frames/": "Instagram @kavya.frames",
  "https://instagram.com/p/C0abc123/": "Instagram post",
  "https://www.youtube.com/@kavyafilms": "YouTube @kavyafilms",
  "https://youtu.be/dQw4w9WgXcQ": "YouTube video",
  "youtube.com/watch?v=dQw4w9WgXcQ": "YouTube video",
  "https://youtube.com/shorts/abc123": "YouTube Short",
  "https://drive.google.com/drive/folders/abc": "Google Drive folder",
  "https://drive.google.com/drive/u/0/folders/abc": "Google Drive folder",
  "https://drive.google.com/file/d/abc/view?usp=sharing": "Google Drive file",
  "https://drive.google.com/open?id=abc": "Google Drive folder",
  // Only Instagram, YouTube and Google Drive are accepted.
  "drive.google.com": null,
  "https://vimeo.com/123456": null,
  "behance.net/kavyadesai": null,
  "kavyadesai.in": null,
  "https://facebook.com/kavyafilms": null,
  "https://photos.google.com/share/abc": null,
  "https://example.com/random": null,
  "https://wa.me/919274739763": null,
  "instagram.com": null,
  "youtube.com": null,
  "http://localhost:3000": null,
  "192.168.1.5/portfolio": null,
  "my portfolio": null,
  "": null,
};

let failed = 0;
for (const [input, expected] of Object.entries(cases)) {
  const result = checkPortfolioLink(input);
  const got = result.ok ? result.label : null;
  const ok = got === expected;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${JSON.stringify(input).padEnd(46)} → ${result.ok ? result.label : `rejected: ${result.message}`}${ok ? "" : `   (expected ${expected ?? "rejection"})`}`);
}

// Profile photos (src/lib/drive-photo.ts): a Google Drive file link → the file id it should find,
// or null when it must be turned away (a folder, another site, no id).
const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const photos: Record<string, string | null> = {
  [`https://drive.google.com/file/d/${ID}/view?usp=sharing`]: ID,
  [`https://drive.google.com/file/d/${ID}/view?usp=drive_link`]: ID,
  [`drive.google.com/file/d/${ID}`]: ID,
  [`https://drive.google.com/file/u/0/d/${ID}/view`]: ID,
  [`https://drive.google.com/open?id=${ID}`]: ID,
  [`https://drive.google.com/uc?export=view&id=${ID}`]: ID,
  [`https://drive.google.com/thumbnail?id=${ID}&sz=w400`]: ID,
  [`https://docs.google.com/uc?id=${ID}`]: ID,
  [`https://lh3.googleusercontent.com/d/${ID}=w400`]: ID,
  "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv": null,
  "https://drive.google.com/drive/u/0/folders/1AbCdEfGhIjKlMnOpQrStUv": null,
  "https://drive.google.com/file/d/": null,
  "https://drive.google.com/open?id=abc": null,
  "drive.google.com": null,
  "https://photos.google.com/share/abc": null,
  "https://www.instagram.com/kavya.frames/": null,
  "https://example.com/me.jpg": null,
  [`https://drive.google.com/file/d/${ID} /view`]: null,
  "": null,
};
for (const [input, expected] of Object.entries(photos)) {
  const result = checkDrivePhoto(input);
  const got = result.ok ? result.id : null;
  // Every accepted link is saved the same way.
  const ok = got === expected && (!result.ok || result.url === `https://drive.google.com/file/d/${ID}/view`);
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} photo ${JSON.stringify(input).padEnd(72)} → ${result.ok ? result.url : `rejected: ${result.message}`}${ok ? "" : `   (expected ${expected ?? "rejection"})`}`);
}
// The address pages load the photo from; nothing for a link that isn't a Drive file.
for (const [got, want] of [
  [drivePhotoSrc(`https://drive.google.com/file/d/${ID}/view`, 200), `https://drive.google.com/thumbnail?id=${ID}&sz=w200`],
  [drivePhotoSrc("https://example.com/me.jpg"), ""],
  [drivePhotoSrc(undefined), ""],
]) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} photo address ${JSON.stringify(got)}${ok ? "" : `   (expected ${JSON.stringify(want)})`}`);
}
console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
