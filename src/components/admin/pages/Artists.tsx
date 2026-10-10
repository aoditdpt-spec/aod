"use client";

import Link from "next/link";
import { CalendarX, Pause, Play, Plus } from "lucide-react";
import { useState } from "react";
import { bookingStages } from "@/content/admin";
import { categories, cities } from "@/content/site";
import { currentUser, newId, update, useDb, type Artist, type Db } from "@/lib/admin-store";
import { WhatsAppIcon } from "@/components/ui/Icon";
import { DataTable, type Column } from "../DataTable";
import {
  ActionButton,
  categoryName,
  Details,
  Drawer,
  DrawerSection,
  fieldBase,
  fieldClass,
  fmtDate,
  inr,
  Labelled,
  NotesBox,
  PageHeader,
  PortfolioFiles,
  StageBadge,
  StatusBadge,
  todayKey,
  useCan,
  whatsappTo,
} from "../ui";
import { useOpen } from "../useOpen";

const done = ["completed", "delivered", "reviewed"];
const jobs = (db: Db, id: string) => db.bookings.filter((b) => b.artistId === id && done.includes(b.status)).length;
const upcoming = (db: Db, id: string) => db.bookings.filter((b) => b.artistId === id && ["confirmed", "payment_pending", "quoted"].includes(b.status) && b.date >= todayKey()).length;

export function Artists() {
  const db = useDb();
  const [openId, setOpen] = useOpen();
  const [adding, setAdding] = useState(false);
  if (!db) return null;
  const open = db.artists.find((a) => a.id === openId) ?? null;

  const columns: Column<Artist>[] = [
    { key: "name", label: "Artist", render: (a) => a.name, value: (a) => a.name },
    { key: "category", label: "Category", render: (a) => categoryName(a.category), value: (a) => categoryName(a.category) },
    { key: "city", label: "City", render: (a) => a.city, value: (a) => a.city },
    { key: "experience", label: "Experience", render: (a) => a.experience, value: (a) => a.experience, hideOnMobile: true },
    { key: "jobs", label: "Jobs done", render: (a) => jobs(db, a.id), value: (a) => jobs(db, a.id), hideOnMobile: true },
    { key: "upcoming", label: "Upcoming", render: (a) => upcoming(db, a.id), value: (a) => upcoming(db, a.id), hideOnMobile: true },
    { key: "kyc", label: "Identity", render: (a) => <StatusBadge tone={a.kyc === "verified" ? "good" : "wait"}>{a.kyc === "verified" ? "Verified" : "Pending"}</StatusBadge>, value: (a) => a.kyc, hideOnMobile: true },
    { key: "status", label: "Status", render: (a) => <StatusBadge tone={a.status === "active" ? "good" : "neutral"}>{a.status === "active" ? "Active" : "Paused"}</StatusBadge>, value: (a) => a.status },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Artists"
        text={`${db.artists.filter((a) => a.status === "active").length} active of ${db.artists.length}. Approved applications land here; paused artists don't get new requests.`}
        actions={
          <ActionButton permission="artists.edit" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add artist
          </ActionButton>
        }
      />
      <DataTable
        rows={db.artists}
        columns={columns}
        getId={(a) => a.id}
        onOpen={(a) => setOpen(a.id)}
        exportName="artists"
        initialSort={{ key: "name", dir: "asc" }}
        filters={[
          { label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })), test: (a, v) => a.category === v },
          { label: "City", options: cities.map((c) => ({ value: c, label: c })), test: (a, v) => a.city === v },
          { label: "Status", options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }], test: (a, v) => a.status === v },
        ]}
      />
      {open && <ArtistDrawer key={open.id} artist={open} db={db} onClose={() => setOpen(null)} />}
      {adding && <AddArtist onClose={() => setAdding(false)} onAdded={(id) => setOpen(id)} />}
    </div>
  );
}

function ArtistDrawer({ artist, db, onClose }: { artist: Artist; db: Db; onClose: () => void }) {
  const allowed = useCan();
  const [blockDate, setBlockDate] = useState("");
  const [upi, setUpi] = useState(artist.payoutUpi);
  const history = db.bookings.filter((b) => b.artistId === artist.id).sort((a, b) => b.date.localeCompare(a.date));
  const payouts = db.payouts.filter((p) => p.artistId === artist.id);
  const reviews = history.filter((b) => b.review);
  const edit = (text: string, fn: (a: Artist) => void) => update("Artists", text, (d) => fn(d.artists.find((x) => x.id === artist.id)!), artist.id);

  return (
    <Drawer
      open
      onClose={onClose}
      title={artist.name}
      subtitle={`${artist.id} · ${categoryName(artist.category)} · ${artist.city}`}
      footer={
        <>
          <a href={whatsappTo(artist.phone, `Hi ${artist.name.split(" ")[0]}, `)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 text-sm font-medium text-white hover:bg-whatsapp-hover">
            <WhatsAppIcon className="h-4 w-4" /> WhatsApp
          </a>
          <ActionButton
            permission="artists.edit"
            variant="secondary"
            onClick={() => edit(`${artist.status === "active" ? "Paused" : "Re-activated"} ${artist.name}`, (a) => void (a.status = a.status === "active" ? "paused" : "active"))}
          >
            {artist.status === "active" ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
            {artist.status === "active" ? "Pause" : "Activate"}
          </ActionButton>
        </>
      }
    >
      <DrawerSection title="Profile">
        <Details
          rows={[
            ["Status", <StatusBadge key="s" tone={artist.status === "active" ? "good" : "neutral"}>{artist.status === "active" ? "Active" : "Paused"}</StatusBadge>],
            ["Phone", artist.phone],
            ["Email", artist.email],
            ["Services", artist.services.join(", ")],
            ["Experience", artist.experience],
            ["Languages", artist.languages.join(", ")],
            ["With AOD since", fmtDate(artist.joinedAt)],
            ["Identity", artist.kyc === "verified" ? "Verified (DigiLocker)" : "Pending"],
            ["Jobs done", jobs(db, artist.id)],
            ["Reviews", reviews.length ? `${reviews.length}, average ${(reviews.reduce((n, b) => n + b.review!.rating, 0) / reviews.length).toFixed(1)} / 5` : "None yet"],
          ]}
        />
      </DrawerSection>

      <DrawerSection title="Their work">
        {artist.bio && <p className="mb-3 whitespace-pre-line text-sm text-ink">{artist.bio}</p>}
        {(artist.links ?? []).length > 0 && (
          <ul className="mb-3 space-y-1 text-sm">
            {artist.links!.map((l) => (
              <li key={l}>
                <a href={l} target="_blank" rel="noopener noreferrer" className="break-all text-brand hover:underline">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        )}
        <PortfolioFiles files={artist.portfolio} />
      </DrawerSection>

      <DrawerSection title="Bookings">
        {history.length === 0 ? (
          <p className="text-sm text-muted">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {history.map((b) => (
              <li key={b.id}>
                <Link href={`/admin/bookings?open=${b.id}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-wash">
                  <span className="min-w-0">
                    <span className="block truncate text-ink">
                      {b.id} · {b.service}
                    </span>
                    <span className="block text-xs text-muted">
                      {fmtDate(b.date)} · {b.customer.name} · {inr(b.quote)}
                    </span>
                  </span>
                  <StageBadge stages={bookingStages} id={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="Days off">
        <div className="flex flex-wrap gap-2">
          {artist.blockedDates.length === 0 && <p className="text-sm text-muted">No days blocked.</p>}
          {[...artist.blockedDates].sort().map((d) => (
            <span key={d} className="inline-flex items-center gap-1.5 rounded-lg bg-night px-2.5 py-1 text-xs text-white">
              <CalendarX className="h-3.5 w-3.5" aria-hidden /> {fmtDate(d)}
              {allowed("artists.edit") && (
                <button type="button" aria-label={`Free up ${d}`} onClick={() => edit(`Freed ${d} for ${artist.name}`, (a) => void (a.blockedDates = a.blockedDates.filter((x) => x !== d)))} className="ml-1 text-white/70 hover:text-white">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {allowed("artists.edit") && (
          <div className="mt-3 flex gap-2">
            <input type="date" value={blockDate} min={todayKey()} onChange={(e) => setBlockDate(e.target.value)} className={`${fieldBase} w-auto`} aria-label="Day off" />
            <ActionButton
              permission="artists.edit"
              variant="secondary"
              disabled={!blockDate}
              onClick={() => {
                edit(`Blocked ${blockDate} for ${artist.name}`, (a) => void (a.blockedDates = [...new Set([...a.blockedDates, blockDate])]));
                setBlockDate("");
              }}
            >
              Block day
            </ActionButton>
          </div>
        )}
      </DrawerSection>

      <DrawerSection title="Payouts">
        <div className="flex gap-2">
          <Labelled label="Payout UPI ID" className="flex-1">
            <input value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" className={fieldClass} disabled={!allowed("payouts.pay")} />
          </Labelled>
          <ActionButton permission="payouts.pay" variant="secondary" className="self-end" disabled={upi === artist.payoutUpi} onClick={() => edit(`Updated ${artist.name}'s payout UPI ID`, (a) => void (a.payoutUpi = upi.trim()))}>
            Save
          </ActionButton>
        </div>
        {payouts.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span className="text-muted">
                  {p.bookingId} · {p.status === "paid" ? `paid ${fmtDate(p.paidAt)}` : "due"}
                </span>
                <span className="font-medium text-ink">{inr(p.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection title="Team notes">
        <NotesBox notes={artist.notes} permission="artists.edit" onAdd={(text) => edit(`Added a note to ${artist.name}`, (a) => void a.notes.unshift({ at: new Date().toISOString(), by: currentUser(), text }))} />
      </DrawerSection>
    </Drawer>
  );
}

function AddArtist({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: cities[0], category: categories[0].slug, experience: "1–3 years" });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ok = form.name.trim().length > 1 && form.phone.replace(/\D/g, "").length >= 10;
  return (
    <Drawer
      open
      onClose={onClose}
      title="Add an artist"
      subtitle="For artists you've already met. New artists should apply through the artist portal."
      footer={
        <ActionButton
          permission="artists.edit"
          disabled={!ok}
          onClick={() => {
            const id = newId("ART");
            update("Artists", `Added ${form.name} to the directory`, (db) =>
              void db.artists.unshift({
                id,
                ...form,
                services: [],
                languages: [],
                joinedAt: new Date().toISOString(),
                status: "active",
                kyc: "pending",
                payoutUpi: "",
                blockedDates: [],
                notes: [],
              }),
            id);
            onClose();
            onAdded(id);
          }}
        >
          Add artist
        </ActionButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Labelled label="Full name">
          <input value={form.name} onChange={set("name")} className={fieldClass} />
        </Labelled>
        <Labelled label="Phone">
          <input value={form.phone} onChange={set("phone")} inputMode="tel" className={fieldClass} />
        </Labelled>
        <Labelled label="Email">
          <input value={form.email} onChange={set("email")} type="email" className={fieldClass} />
        </Labelled>
        <Labelled label="City">
          <select value={form.city} onChange={set("city")} className={fieldClass}>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Category">
          <select value={form.category} onChange={set("category")} className={fieldClass}>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Labelled>
        <Labelled label="Experience">
          <select value={form.experience} onChange={set("experience")} className={fieldClass}>
            {["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Labelled>
      </div>
    </Drawer>
  );
}
