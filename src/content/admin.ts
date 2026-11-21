// The staff roles (Team And Roles in the admin). Both have full access; row-level security and the
// admin's save action (src/server/actions/admin.ts) check the role again.

export const roles = [
  { id: "owner", label: "Admin", text: "Full access. The team always keeps at least one admin." },
  { id: "developer", label: "Developer", text: "Full access, the same as an admin: for the people who build and run the site." },
] as const;

export type Role = (typeof roles)[number]["id"];
