"use client";

import { companyTypes, type Company } from "@/content/business-portal";
import { createStore } from "./local-store";

// The business portal's company for the preview (no backend): kept only in this browser, the same
// way My bookings keeps its preview session. Live, the company is a row in the `companies` table.
export const businessCompanyStore = createStore<Company | null>("aod-business-company", null, (v) => {
  if (!v || typeof v !== "object") return null;
  const c = v as Partial<Company>;
  if (typeof c.email !== "string" || typeof c.name !== "string") return null;
  return {
    id: String(c.id ?? "BIZ-PREVIEW"),
    name: c.name,
    type: (companyTypes as readonly string[]).includes(String(c.type)) ? (c.type as Company["type"]) : "",
    typeOther: String(c.typeOther ?? ""),
    contactName: String(c.contactName ?? ""),
    email: c.email,
    phone: String(c.phone ?? ""),
    city: String(c.city ?? ""),
    website: String(c.website ?? ""),
  };
});
