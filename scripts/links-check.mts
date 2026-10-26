// Checks the artist portal's portfolio-link rules (src/lib/portfolio-links.ts) and the profile
// photo's file name and address (src/lib/artist-photo.ts).
// Run with: npm run check:links
import { artistPhotoSrc, photoFileName } from "../src/lib/artist-photo.ts";
import { checkDriveLink, checkPortfolioLink } from "../src/lib/portfolio-links.ts";

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

// Profile photos (src/lib/artist-photo.ts): the file name on AOD's Drive, and the address pages
// show the photo from (the private route, or a picture still in the browser).
const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
for (const [got, want] of [
  [photoFileName("PH", "Aman Shah", "APP-231", "image/webp"), "PH_AMANSHAH_APP-231.webp"],
  [photoFileName("DR", "  aman  ", "APP-7", "image/jpeg"), "DR_AMAN_APP-7.jpg"],
  [photoFileName("AH", "ઝાલા", "APP-9", "image/png"), "AH_ARTIST_APP-9.png"],
  [artistPhotoSrc("APP-231", `${ID}~lq3x`), "/api/artist-photos/APP-231.img?v=lq3x"],
  [artistPhotoSrc("ART-101", ID), "/api/artist-photos/ART-101.img"],
  [artistPhotoSrc("APP-231", "data:image/webp;base64,AAAA"), "data:image/webp;base64,AAAA"],
  [artistPhotoSrc("APP-231", "https://drive.google.com/file/d/x/view"), ""],
  [artistPhotoSrc("APP-231", ""), ""],
  [artistPhotoSrc(undefined, ID), ""],
] as const) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} photo ${JSON.stringify(got)}${ok ? "" : `   (expected ${JSON.stringify(want)})`}`);
}
// Equipment photos in "Your work details" (checkDriveLink): Google Drive only, a folder or a file.
for (const [input, accepted] of [
  ["https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv?usp=sharing", true],
  ["https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUv/view", true],
  ["https://www.instagram.com/kavya.frames/", false],
  ["https://youtu.be/dQw4w9WgXcQ", false],
  ["https://photos.google.com/share/abc", false],
  ["drive.google.com", false],
] as const) {
  const result = checkDriveLink(input);
  const ok = result.ok === accepted;
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} equipment ${JSON.stringify(input).padEnd(72)} → ${result.ok ? "accepted" : `rejected: ${result.message}`}`);
}
console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
