"use client";

import { backendEnabled } from "@/lib/backend";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { roles, type Role } from "@/content/admin";
import { newId, update, useDb, useSession } from "@/lib/admin-store";
import { ActionButton, ago, Card, fieldBase, fieldClass, Labelled, PageHeader, StatusBadge, useCan } from "../ui";

export function Team() {
  const db = useDb();
  const session = useSession();
  const allowed = useCan();
  const [invite, setInvite] = useState({ name: "", email: "", role: "developer" as Role });
  const [inviteError, setInviteError] = useState<string | null>(null);
  if (!db || !session) return null;
  const owners = db.team.filter((m) => m.role === "owner" && m.active).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Team & roles" text={backendEnabled ? "Who can sign in to the admin. Each person signs in with a code emailed to the address listed here." : "Who can sign in to the admin. Every login needs 2-step verification once real accounts are switched on."} />

      <Card title="Members">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                <th scope="col" className="py-2 pr-4 font-medium">Role</th>
                <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">2-step</th>
                <th scope="col" className="hidden py-2 pr-4 font-medium md:table-cell">Last active</th>
                <th scope="col" className="py-2 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {db.team.map((m) => {
                const lastOwner = m.role === "owner" && owners <= 1;
                return (
                  <tr key={m.id} className="border-b border-line/70 last:border-0">
                    <td className="py-2.5 pr-4">
                      <span className="block font-medium text-ink">{m.name}</span>
                      <span className="block text-xs text-muted">{m.email}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <select
                        value={m.role}
                        disabled={!allowed("team.edit") || lastOwner}
                        title={lastOwner ? "There must always be an admin" : undefined}
                        onChange={(e) => update("Team", `Changed ${m.name}'s role to ${roles.find((r) => r.id === e.target.value)?.label}`, (d) => void (d.team.find((x) => x.id === m.id)!.role = e.target.value as Role), m.id)}
                        className={`${fieldBase} w-auto py-1.5`}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden py-2.5 pr-4 md:table-cell">
                      <StatusBadge tone={m.twoFactor ? "good" : "wait"}>{m.twoFactor ? "On" : "Not set up"}</StatusBadge>
                    </td>
                    <td className="hidden py-2.5 pr-4 text-muted md:table-cell">{ago(m.lastActive)}</td>
                    <td className="py-2.5">
                      <ActionButton
                        permission="team.edit"
                        variant={m.active ? "danger" : "secondary"}
                        disabled={lastOwner}
                        onClick={() => update("Team", `${m.active ? "Removed access for" : "Restored access for"} ${m.name}`, (d) => void (d.team.find((x) => x.id === m.id)!.active = !m.active), m.id)}
                      >
                        {m.active ? "Remove access" : "Restore"}
                      </ActionButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {allowed("team.edit") && (
          <form
            className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              const email = invite.email.trim().toLowerCase();
              if (!invite.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setInviteError("Enter their name and email address.");
              if (db.team.some((m) => m.email.toLowerCase() === email)) return setInviteError("This email is already on the team.");
              setInviteError(null);
              update("Team", `Invited ${invite.name} as ${roles.find((r) => r.id === invite.role)?.label}`, (d) =>
                void d.team.push({ id: newId("U"), name: invite.name.trim(), email, role: invite.role, active: true, twoFactor: false, lastActive: new Date().toISOString() }),
              );
              setInvite({ name: "", email: "", role: "developer" });
            }}
          >
            <Labelled label="Name">
              <input value={invite.name} onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))} className={fieldClass} />
            </Labelled>
            <Labelled label="Work email">
              <input value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} type="email" className={fieldClass} />
            </Labelled>
            <Labelled label="Role">
              <select value={invite.role} onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value as Role }))} className={fieldClass}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Labelled>
            <button type="submit" className="inline-flex h-9 items-center gap-1.5 self-end rounded-lg bg-brand px-3.5 text-sm font-medium text-white hover:bg-brand-hover">
              <UserPlus className="h-4 w-4" aria-hidden /> Invite
            </button>
            <p className={`text-xs sm:col-span-4 ${inviteError ? "text-red-600" : "text-muted"}`} role={inviteError ? "alert" : undefined}>
              {inviteError ??
                (backendEnabled
                  ? "They get an email with the admin's address and sign in with a code sent to this email. Developers get full access, the same as an admin."
                  : "Preview: no email is sent. Developers get full access, the same as an admin.")}
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}
