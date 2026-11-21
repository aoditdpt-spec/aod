// AOD For Business accounts as the server keeps them (src/server/actions/business.ts): the account types
// (stored in this wording; the page shows them in Title Case, src/lib/business.ts), the company record and
// the check for its website, LinkedIn or Linktree link.

export const companyTypes = ["Brand owner", "Event planner", "Agency", "Other"] as const;
export type CompanyType = (typeof companyTypes)[number];

export type Company = {
  id: string;
  name: string;
  type: CompanyType | "";
  typeOther: string; // what "Other" means, written by the company
  contactName: string;
  email: string;
  phone: string;
  city: string;
  website: string;
};

// The company's online presence: its website, LinkedIn page or Linktree (required).
export const companyLinkError = "Add your website, LinkedIn or Linktree link.";

// What the company typed ("acme.in", "linkedin.com/company/acme", "https://linktr.ee/acme") as an
// https address; "" when empty, null when it isn't a web address. Used by the forms and the server.
export function companyLinkOf(v: unknown): string | null {
  const raw = typeof v === "string" ? v.trim().slice(0, 200) : "";
  if (!raw) return "";
  if (/\s/.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!/^https?:$/.test(url.protocol) || !/\.[a-z]{2,}$/i.test(url.hostname)) return null;
    url.protocol = "https:";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}
