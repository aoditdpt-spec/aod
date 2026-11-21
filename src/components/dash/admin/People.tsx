"use client";

import Link from "@/components/ui/AppLink";
import { Avatar } from "@/components/ui/Avatar";
import { useState } from "react";
import { categories, cities } from "@/data/site";
import { backendEnabled } from "@/lib/backend";
import { act, ago, appStageLabel, appStages, catName, openStage, shortDate, stageLabel, useDb, type AppStage, type Artist } from "@/lib/app-db";
import { meetingWhen } from "./Overview";
import { kindName, workAnswerLabel } from "@/data/work-questions";

// "photo-video.level" → "Photography & Film: Are You A Professional…"
import { Drawer, Head, Loading, Rows, Status, Tabs, Title, btn, btnInk, btnMain, field, label, stageTone, sub, td, th, useOpen } from "../ui";

// Applications: review → meeting → trial → approved, each opening in the drawer.
export function Applications() {
  const db = useDb();
  const o = useOpen();
  const [stage, setStage] = useState<AppStage | "all">("all");
  if (!db) return <Loading />;
  const rows = db.applications.filter((a) => stage === "all" || a.stage === stage);
  const open = db.applications.find((a) => a.id === o.value);

  return (
    <>
      <Title title="Applications" text="Every artist who applied through the artist portal." />
      <div className="mt-7 border-t border-ink pt-4">
        <Tabs value={stage} onChange={setStage} options={[{ id: "all", label: "All", count: db.applications.length }, ...appStages.map((s) => ({ id: s.id, label: s.label, count: db.applications.filter((a) => a.stage === s.id).length }))]} />
      </div>
      <table className="mt-5 w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className={th}>Artist</th>
            <th className={`${th} max-sm:hidden`}>Category</th>
            <th className={th}>Stage</th>
            <th className={`${th} max-sm:hidden`}>Applied</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="cursor-pointer hover:bg-wash" onClick={() => o.open(a.id)}>
              {/* No photo in the list (on request, 2026-11-21); the drawer still shows it. */}
              <td className={td}>
                <button type="button" className="text-left" onClick={() => o.open(a.id)}>
                  {a.name}
                  <small className={sub}>
                    {a.id}, {a.city}
                  </small>
                </button>
              </td>
              <td className={`${td} max-sm:hidden`}>{a.craft}</td>
              <td className={td}>
                <Status tone={a.stage === "approved" || a.stage === "rejected" ? "dim" : a.stage === "meeting" ? "hot" : "ink"}>
                  {a.stage === "meeting" && a.meetingAt ? `Meeting ${meetingWhen(a.meetingAt, db)}` : appStageLabel(a.stage)}
                </Status>
              </td>
              <td className={`${td} max-sm:hidden`}>{shortDate(a.applied)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={!!open} onClose={o.close} title={open?.name ?? ""} subtitle={open ? `${open.id} · ${open.craft}` : undefined}>
        {open && (
          <div className="space-y-8">
            <Avatar src={open.photo} name={open.name} size={96} />
            <Rows
              rows={[
                ["Stage", appStageLabel(open.stage)],
                ["Category", catName(open.cat)],
                ["City", open.city],
                ["Phone", open.phone],
                ["Email", open.email],
                ["Applied", shortDate(open.applied)],
                ["Meeting", open.meetingAt ? meetingWhen(open.meetingAt, db) : ""],
                ["Experience", open.experience ?? ""],
                ["Instagram", open.instagram ? `instagram.com/${open.instagram}` : ""],
                ["Portfolio", open.link ?? ""],
                ["Date Of Birth", open.details?.dob ?? ""],
                ["Area", open.details?.area ?? ""],
                ["Languages", open.details?.languages?.join(", ") ?? ""],
                ["Mainly Works As", open.details?.kind ? kindName(open.details.kind) : ""],
                ["Also Works As", open.details?.other?.map(kindName).join(", ") ?? ""],
                ["Services", open.details?.services?.join(", ") ?? ""],
                ["About", open.details?.about ?? ""],
                ["Declaration", open.details?.agree ? "Agreed" : ""],
              ]}
            />
            {open.details?.work && Object.keys(open.details.work).length > 0 && (
              <section>
                <Head title="Work Details" />
                <Rows rows={Object.entries(open.details.work).map(([k, v]): [string, string] => [workAnswerLabel(k), Array.isArray(v) ? v.join(", ") : v])} />
              </section>
            )}
            {open.submittedAt && <p className="text-[13px] text-muted">Sent for review by the applicant {ago(open.submittedAt)}.</p>}
            <section>
              <Head title="Move To" />
              <div className="flex flex-wrap gap-2">
                {appStages
                  .filter((s) => s.id !== "approved")
                  .map((s) => (
                    <button key={s.id} type="button" disabled={s.id === open.stage} onClick={() => act.setAppStage(open.id, s.id)} className={s.id === open.stage ? btnInk : btn}>
                      {s.label}
                    </button>
                  ))}
              </div>
            </section>
            <MeetingTime key={open.id} id={open.id} at={open.meetingAt} />
            <section>
              <Head title="Approve" />
              {open.stage === "approved" ? (
                <p className="text-muted">Approved. They&apos;re on the Artists page.</p>
              ) : (
                <>
                  <p className="mb-3 text-[13px] text-muted">Makes them an artist in {catName(open.cat)}, ready for requests.</p>
                  <button type="button" onClick={() => act.approve(open.id)} className={btnMain}>
                    Approve And Create Artist
                  </button>
                </>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}

// Artists: who's live, in which categories, and their orders.
export function Artists() {
  const db = useDb();
  const o = useOpen();
  if (!db) return <Loading />;
  const open = db.artists.find((a) => a.id === o.value);
  const ordersOf = (id: string) => db.bookings.filter((b) => b.assigned.includes(id));

  return (
    <>
      <Title title="Artists" text={`${db.artists.filter((a) => a.active).length} active of ${db.artists.length}.`}>
        <button type="button" className={btnMain} onClick={() => o.open("new")}>
          Add Artist
        </button>
      </Title>
      <table className="mt-7 w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className={th}>Artist</th>
            <th className={`${th} max-sm:hidden`}>Categories</th>
            <th className={th}>Status</th>
            <th className={`${th} text-right`}>Orders</th>
          </tr>
        </thead>
        <tbody>
          {db.artists.map((a) => (
            <tr key={a.id} className="cursor-pointer hover:bg-wash" onClick={() => o.open(a.id)}>
              <td className={td}>
                <span className="flex items-center gap-2.5">
                  <Avatar src={a.photo} name={a.name} size={30} />
                  <button type="button" className="text-left" onClick={() => o.open(a.id)}>
                    {a.name}
                    <small className={sub}>
                      {a.id}, {a.craft}
                    </small>
                  </button>
                </span>
              </td>
              <td className={`${td} max-sm:hidden`}>{a.cats.map(catName).join(", ")}</td>
              <td className={td}>
                <Status tone={a.active ? "ink" : "dim"}>{a.active ? "Active" : "Paused"}</Status>
              </td>
              <td className={`${td} text-right`}>{ordersOf(a.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Drawer open={o.value === "new"} onClose={o.close} title="Add Artist" subtitle={backendEnabled ? undefined : "Every field can be left empty in test mode."}>
        <ArtistForm onSave={(a) => o.open(act.addArtist({ name: a.name ?? "", craft: a.craft ?? "", cats: a.cats ?? [], city: a.city ?? "", email: a.email ?? "", phone: a.phone ?? "", photo: "" }))} cta="Add Artist" />
      </Drawer>
      <Drawer open={!!open} onClose={o.close} title={open?.name ?? ""} subtitle={open ? `${open.id} · ${open.craft}` : undefined}>
        {open && (
          <div className="space-y-8">
            <Avatar src={open.photo} name={open.name} size={96} />
            <Rows
              rows={[
                ["Status", open.active ? "Active" : "Paused"],
                ["Categories", open.cats.map(catName).join(", ")],
                ["City", open.city],
                ["Phone", open.phone],
                ["Email", open.email],
                ["Live Since", shortDate(open.since)],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {/* Opens this artist's conversation in Chat With Artists. */}
              <Link href={`/admin/chat?artist=${open.id}`} className={btnMain}>
                Message {open.name.split(" ")[0]}
              </Link>
              <button type="button" onClick={() => act.toggleArtist(open.id)} className={btn}>
                {open.active ? "Pause Artist" : "Activate Artist"}
              </button>
            </div>
            <section>
              <Head title="Edit Profile" />
              <ArtistForm key={open.id} initial={open} onSave={(a) => act.editArtist(open.id, a)} cta="Save Changes" />
            </section>
            <section>
              <Head title="Orders">{ordersOf(open.id).length}</Head>
              {ordersOf(open.id).length ? (
                <ul className="border-b border-line">
                  {ordersOf(open.id).map((b) => (
                    <li key={b.id} className="flex justify-between gap-3 border-t border-line py-2.5">
                      <span>
                        {b.id}
                        <small className="block text-xs text-muted">
                          {b.customer}, {shortDate(b.date)}
                        </small>
                      </span>
                      <Status tone={openStage(b.stage) ? stageTone[b.stage] : "dim"}>{stageLabel(b.stage)}</Status>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No orders yet.</p>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </>
  );
}

// The meeting with an applicant: pick the date and time (moves them to Meeting).
function MeetingTime({ id, at }: { id: string; at?: string }) {
  const local = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const [value, setValue] = useState(local(at));
  return (
    <section>
      <Head title="Meeting" />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (value) act.setMeeting(id, new Date(value).toISOString());
        }}
      >
        <input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Meeting date and time" className={field} />
        <button className={btn}>Set Meeting</button>
      </form>
    </section>
  );
}

// Add an artist, or edit one's profile: name, craft, the categories they work in, city and contact.
function ArtistForm({ initial, onSave, cta }: { initial?: Artist; onSave: (a: Partial<Artist>) => void; cta: string }) {
  const [f, setF] = useState({ name: initial?.name ?? "", craft: initial?.craft ?? "", city: initial?.city ?? "", email: initial?.email ?? "", phone: initial?.phone ?? "" });
  const [cats, setCats] = useState<string[]>(initial?.cats ?? []);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => (setF({ ...f, [k]: e.target.value }), setSaved(false));
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...f, cats });
        setSaved(true);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className={label}>Name</span>
          <input value={f.name} onChange={set("name")} className={field} />
        </label>
        <label>
          <span className={label}>Craft</span>
          <input value={f.craft} onChange={set("craft")} placeholder="Photographer" className={field} />
        </label>
        <label>
          <span className={label}>City</span>
          <select value={f.city} onChange={set("city")} className={field}>
            <option value="">Choose</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={label}>Phone</span>
          <input value={f.phone} onChange={set("phone")} inputMode="tel" className={field} />
        </label>
        <label className="col-span-2">
          <span className={label}>Email</span>
          <input value={f.email} onChange={set("email")} type="email" className={field} />
        </label>
      </div>
      <div>
        <span className={label}>Categories (The First Is Their Main One)</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = cats.includes(c.slug);
            return (
              <button key={c.slug} type="button" aria-pressed={on} onClick={() => (setCats(on ? cats.filter((x) => x !== c.slug) : [...cats, c.slug]), setSaved(false))} className={on ? btnInk : btn}>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className={btnMain}>{cta}</button>
        {saved && <span className="text-[13px] text-muted">Saved.</span>}
      </div>
    </form>
  );
}
