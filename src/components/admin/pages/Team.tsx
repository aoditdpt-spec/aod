"use client";

import { backendEnabled } from "@/lib/backend";
import { Check, Minus, UserPlus } from "lucide-react";
import { useState } from "react";
import { can, permissions, roles, type Permission, type Role } from "@/content/admin";
import { newId, signIn, update, useDb, useSession } from "@/lib/admin-store";
import { ActionButton, ago, Card, fieldBase, fieldClass, Labelled, PageHeader, StatusBadge, useCan } from "../ui";

const permissionLabels: Record<Permission, string> = {
  "applications.edit": "Review and decide on applications",
  "artists.edit": "Edit artists, days off, notes",
  "bookings.edit": "Create and move bookings, send quotes",
  "payments.verify": "Verify customer payments",
  "payouts.pay": "Pay artists, edit payout details",
  "leads.edit": "Add and update leads",
  "cases.edit": "Handle resolution cases",
  "messages.send": "Send WhatsApp messages",
  export: "Download Excel / CSV",
  "team.edit": "Invite people and change roles",
  "settings.edit": "Change settings",
};

export function Team() {
  const db = useDb();
  const session = useSession();
  const allowed = useCan();
  const [invite, setInvite] = useState({ name: "", email: "", role: "ops" as Role });
  if (!db || !session) return null;
  const owners = db.team.filter((m) => m.role === "owner" && m.active).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Team & roles" text={backendEnabled ? "Who can sign in, and what each role can do. Each person signs in with a code emailed to the address listed here." : "Who can sign in, and what each role can do. Every login needs 2-step verification once real accounts are switched on."} />

      {!backendEnabled && (
      <Card title="Preview as another role">
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => signIn({ ...session, role: r.id, name: `${session.name.replace(/\s*\(.*\)$/, "")} (${r.label})` })}
              aria-pressed={session.role === r.id}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${session.role === r.id ? "border-brand bg-peach/50" : "border-line hover:border-ink"}`}
            >
              <span className="block font-medium text-ink">{r.label}</span>
              <span className="block text-xs text-muted">{r.text}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Every role can open every page; the role decides which buttons work.</p>
      </Card>
      )}

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
                        title={lastOwner ? "There must always be an owner" : undefined}
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
              if (!invite.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(invite.email)) return;
              update("Team", `Invited ${invite.name} as ${roles.find((r) => r.id === invite.role)?.label}`, (d) =>
                void d.team.push({ id: newId("U"), name: invite.name.trim(), email: invite.email.trim(), role: invite.role, active: true, twoFactor: false, lastActive: new Date().toISOString() }),
              );
              setInvite({ name: "", email: "", role: "ops" });
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
          </form>
        )}
      </Card>

      <Card title="What each role can do">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Permission</th>
                {roles.map((r) => (
                  <th key={r.id} scope="col" className="px-2 py-2 text-center font-medium">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(Object.keys(permissions) as Permission[]).map((p) => (
                <tr key={p} className="border-b border-line/70 last:border-0">
                  <td className="py-2 pr-4 text-ink">{permissionLabels[p]}</td>
                  {roles.map((r) => (
                    <td key={r.id} className="px-2 py-2 text-center">
                      {can(r.id, p) ? <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Yes" /> : <Minus className="mx-auto h-4 w-4 text-line" aria-label="No" />}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-4 text-ink">See every page and record</td>
                {roles.map((r) => (
                  <td key={r.id} className="px-2 py-2 text-center">
                    <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Yes" />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
