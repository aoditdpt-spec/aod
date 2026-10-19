// Checks the blog and newsletter Markdown reader (src/lib/markdown.ts): what it shows, and that
// nothing unsafe gets through. Run: npm run check:markdown
// Add a case here when you change what the reader understands.
import { isSlug, parse, readingMinutes, slugify, toHtml, toText } from "../src/lib/markdown.ts";

let failures = 0;
const check = (label: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra && !ok ? `  (${extra})` : ""}`);
  if (!ok) failures++;
};
const html = (md: string) => toHtml(parse(md));

// What it shows.
check("## makes a heading", html("## Before the big day") === "<h2>Before the big day</h2>");
check("# also makes the large heading (the post title is the only h1)", html("# Tips") === "<h2>Tips</h2>");
check("### makes a smaller heading", html("### Lights") === "<h3>Lights</h3>");
check("bold and italic", html("A **verified** artist, *on time*") === "<p>A <strong>verified</strong> artist, <em>on time</em></p>", html("A **verified** artist, *on time*"));
check("underscores are italic too", html("_really_") === "<p><em>really</em></p>");
check("a lone star stays a star", html("5 * 3 = 15") === "<p>5 * 3 = 15</p>", html("5 * 3 = 15"));
check("snake_case words are left alone", html("use file_name_here") === "<p>use file_name_here</p>");
check("a link", html("[Book now](https://www.aod.co.in/book)") === '<p><a href="https://www.aod.co.in/book">Book now</a></p>');
check("a link to the site's own page", html("[Book](/book)") === '<p><a href="/book">Book</a></p>');
check("bold inside a link", html("[**Book**](/book)") === '<p><a href="/book"><strong>Book</strong></a></p>');
check("a list", html("- one\n- two") === "<ul><li>one</li><li>two</li></ul>");
check("a numbered list", html("1. one\n2. two") === "<ol><li>one</li><li>two</li></ol>");
check("a quote", html("> Best day ever") === "<blockquote>Best day ever</blockquote>");
check("a photo on its own line", html("![Mehndi night](https://x.supabase.co/storage/v1/object/public/blog/a.webp)") === '<img src="https://x.supabase.co/storage/v1/object/public/blog/a.webp" alt="Mehndi night">');
check("a line across", html("---") === "<hr>");
check("one line break stays a break", html("Line one\nLine two") === "<p>Line one<br>Line two</p>");
check("a blank line starts a new paragraph", html("One\n\nTwo") === "<p>One</p>\n<p>Two</p>");
check("Windows line endings", html("One\r\n\r\nTwo") === "<p>One</p>\n<p>Two</p>");

// Nothing unsafe gets through.
check("HTML is shown as text, never run", html("<script>alert(1)</script>") === "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
check("a javascript: link is only text", !html("[click](javascript:alert(1))").includes("<a") && !html("[click](javascript:alert(1))").includes("javascript"), html("[click](javascript:alert(1))"));
check("a data: link is only text", html("[x](data:text/html,hi)") === "<p>x</p>");
check("a //other-site link is only text", html("[x](//evil.test)") === "<p>x</p>");
check("an http (not https) photo is dropped", html("![x](http://evil.test/a.png)") === "");
check("quotes in a link can't break out of it", !html('[x](https://a.test/"onmouseover=alert(1))').includes('"onmouseover'));
check("quotes in a photo description are escaped", html('![a "b"](https://a.test/x.png)').includes('alt="a &quot;b&quot;"'));

// Email styles and plain text.
check("styles go on the tags", toHtml(parse("Hi"), { p: "margin:0" }) === '<p style="margin:0">Hi</p>');
check("plain text keeps link addresses", toText(parse("[Book](https://www.aod.co.in/book)")) === "Book (https://www.aod.co.in/book)");
check("plain text lists", toText(parse("- a\n- b")) === "- a\n- b");

// Post helpers.
check("slug from a title", slugify("How to pick a Wedding Photographer!") === "how-to-pick-a-wedding-photographer");
check("slug keeps & as 'and'", slugify("DJs & Anchors") === "djs-and-anchors");
check("slug drops accents", slugify("Café shoots") === "cafe-shoots");
check("a slug is valid", isSlug("garba-night-2026") && !isSlug("Garba Night") && !isSlug("-x"));
check("reading time is at least a minute", readingMinutes("short") === 1 && readingMinutes("word ".repeat(1000)) === 5);

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
