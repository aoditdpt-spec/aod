// Checks the artist portal's portfolio-link rules (src/lib/portfolio-links.ts).
// Run with: npm run check:links
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
console.log(failed ? `\n${failed} failed` : "\nAll passed");
process.exit(failed ? 1 : 0);
