import { brand } from "@/content/site";
import type { HtmlStyles } from "@/lib/markdown";
import { siteUrl } from "@/lib/site-url";

// The look of AOD's HTML emails (the newsletter and its confirmation): a white card with an orange
// line along the top and an orange "AOD.", like the sign-in code email (backend-setup.md 2.9).
// Email apps ignore the site's stylesheet and CSS variables, so the colours are written out here:
// the brand tokens in globals.css (orange #ff6201, ink #000000, muted #5c5c5c, line #e6e6e6, wash #fff4ed).

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Styles for Markdown turned into email HTML (src/lib/markdown.ts toHtml).
export const emailStyles: HtmlStyles = {
  h2: "margin:28px 0 8px;font-size:20px;line-height:1.3;color:#000000",
  h3: "margin:22px 0 6px;font-size:17px;line-height:1.3;color:#000000",
  p: "margin:0 0 16px;font-size:15px;line-height:1.6;color:#1a1a1a",
  quote: "margin:0 0 16px;padding:12px 16px;border-left:4px solid #ff6201;background:#fff4ed;font-size:15px;line-height:1.6;color:#000000",
  ul: "margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.6;color:#1a1a1a",
  ol: "margin:0 0 16px;padding-left:22px;font-size:15px;line-height:1.6;color:#1a1a1a",
  li: "margin:0 0 6px",
  img: "display:block;max-width:100%;height:auto;margin:8px 0 16px;border-radius:8px",
  hr: "border:none;border-top:1px solid #e6e6e6;margin:24px 0",
  a: "color:#ff6201;font-weight:bold",
};

// Links to the site's own pages ("/book") need the full address in an email.
export const absoluteLinks = (html: string) => html.replace(/(href|src)="\/(?!\/)/g, `$1="${siteUrl}/`);

export function emailLayout({ heading, bodyHtml, footerHtml = "" }: { heading?: string; bodyHtml: string; footerHtml?: string }) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#fff4ed">
<div style="background:#fff4ed;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e6e6e6;border-top:4px solid #ff6201;border-radius:12px;padding:32px">
    <p style="margin:0 0 24px;font-size:22px;font-weight:bold;color:#ff6201">AOD.</p>
    ${heading ? `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#000000">${esc(heading)}</h1>` : ""}
    ${absoluteLinks(bodyHtml)}
  </div>
  <div style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.6;color:#5c5c5c;text-align:center">
    ${footerHtml}
    <p style="margin:8px 0 0">${esc(brand.fullName)} · ${esc(brand.city)}, Gujarat · <a href="${siteUrl}" style="color:#5c5c5c">${esc(brand.domain)}</a></p>
  </div>
</div>
</body></html>`;
}

// An orange button, for the one action an email asks for.
export const emailButton = (href: string, label: string) =>
  `<p style="margin:8px 0 24px"><a href="${esc(href)}" style="display:inline-block;background:#ff6201;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:12px 22px;border-radius:8px">${esc(label)}</a></p>`;

export const emailParagraph = (text: string) => `<p style="${emailStyles.p}">${esc(text)}</p>`;
