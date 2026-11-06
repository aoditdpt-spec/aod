"use client";

import { useState } from "react";
import { Copy, Plus, Send, Trash2 } from "lucide-react";
import { backendEnabled } from "@/lib/backend";
import { currentUser, newId, update, useDb, useSession, type Newsletter as Issue, type Subscriber } from "@/lib/admin-store";
import { siteUrl } from "@/lib/site-url";
import { sendNewsletter } from "@/server/actions/newsletter";
import { Spinner } from "@/components/ui/Spinner";
import { DataTable, type Column } from "../DataTable";
import { MarkdownEditor } from "../MarkdownEditor";
import { ActionButton, ago, Details, Drawer, DrawerSection, fieldClass, fmtDate, Labelled, PageHeader, Stat, StatusBadge, useCan } from "../ui";
import { useOpen } from "../useOpen";

// The newsletter: who signed up on the website (they confirm by email first, so only
// "Subscribed" people get issues), and the issues: write one, send yourself a test, then send it
// to every subscriber (src/server/actions/newsletter.ts, through Resend). Every issue has a
// one-click unsubscribe link. Resend's free plan sends 100 emails a day.

const subscriberTone = { pending: "wait", subscribed: "good", unsubscribed: "neutral" } as const;
const subscriberLabel = { pending: "Waiting to confirm", subscribed: "Subscribed", unsubscribed: "Unsubscribed" } as const;

const subscriberColumns: Column<Subscriber>[] = [
  { key: "email", label: "Email", render: (s) => <span className="font-medium">{s.email}</span>, value: (s) => s.email },
  { key: "status", label: "Status", render: (s) => <StatusBadge tone={subscriberTone[s.status]}>{subscriberLabel[s.status]}</StatusBadge>, value: (s) => subscriberLabel[s.status] },
  { key: "source", label: "Signed up on", render: (s) => s.source || "—", value: (s) => s.source, hideOnMobile: true },
  { key: "created", label: "Signed up", render: (s) => fmtDate(s.createdAt), value: (s) => s.createdAt, hideOnMobile: true },
  { key: "confirmed", label: "Confirmed", render: (s) => (s.confirmedAt ? fmtDate(s.confirmedAt) : "—"), value: (s) => s.confirmedAt ?? "", hideOnMobile: true },
];

const issueColumns: Column<Issue>[] = [
  { key: "subject", label: "Subject", render: (n) => <span className="line-clamp-1 font-medium">{n.subject || "Untitled"}</span>, value: (n) => n.subject },
  { key: "status", label: "Status", render: (n) => <StatusBadge tone={n.status === "sent" ? "good" : "neutral"}>{n.status === "sent" ? "Sent" : "Draft"}</StatusBadge>, value: (n) => n.status },
  { key: "sent", label: "Sent", render: (n) => (n.sentAt ? fmtDate(n.sentAt, true) : "—"), value: (n) => n.sentAt ?? "" },
  { key: "recipients", label: "To", render: (n) => (n.status === "sent" ? `${n.recipients} people` : "—"), value: (n) => n.recipients, hideOnMobile: true },
  { key: "created", label: "Started", render: (n) => ago(n.createdAt), value: (n) => n.createdAt, hideOnMobile: true },
];

export function Newsletter() {
  const db = useDb();
  const [openId, setOpen] = useOpen();
  if (!db) return null;
  const issue = db.newsletters.find((n) => n.id === openId) ?? null;
  const subscriber = db.subscribers.find((s) => s.id === openId) ?? null;
  const count = (status: Subscriber["status"]) => db.subscribers.filter((s) => s.status === status).length;

  function newIssue(from?: Issue) {
    const id = newId("N");
    update(
      "Newsletter",
      from ? `Copied the newsletter "${from.subject}"` : "Started a new newsletter",
      (d) => {
        d.newsletters.unshift({ id, subject: from?.subject ?? "", body: from?.body ?? "", status: "draft", createdAt: new Date().toISOString(), sentBy: "", recipients: 0 });
      },
      id,
    );
    setOpen(id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Newsletter"
        text="People who signed up on the website (the footer and the blog). They confirm by email first, so only Subscribed people get issues, and every issue has a one-click unsubscribe link."
        actions={
          <ActionButton permission="newsletter.send" onClick={() => newIssue()}>
            <Plus className="h-4 w-4" aria-hidden /> New newsletter
          </ActionButton>
        }
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Subscribed" value={count("subscribed")} />
        <Stat label="Waiting to confirm" value={count("pending")} />
        <Stat label="Unsubscribed" value={count("unsubscribed")} />
        <Stat label="Newsletters sent" value={db.newsletters.filter((n) => n.status === "sent").length} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Newsletters</h2>
        <DataTable
          rows={db.newsletters}
          columns={issueColumns}
          getId={(n) => n.id}
          onOpen={(n) => setOpen(n.id)}
          exportName="newsletters"
          empty="No newsletters yet. Press New newsletter to write the first one."
          initialSort={{ key: "created", dir: "desc" }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Subscribers</h2>
        <DataTable
          rows={db.subscribers}
          columns={subscriberColumns}
          getId={(s) => s.id}
          onOpen={(s) => setOpen(s.id)}
          exportName="newsletter-subscribers"
          empty="Nobody has signed up yet. The sign-up box is in the website's footer and on the blog."
          initialSort={{ key: "created", dir: "desc" }}
          filters={[{ label: "Status", options: (["subscribed", "pending", "unsubscribed"] as const).map((s) => ({ value: s, label: subscriberLabel[s] })), test: (s, v) => s.status === v }]}
        />
      </section>

      {issue && <IssueEditor key={issue.id} issue={issue} subscribed={count("subscribed")} onClose={() => setOpen(null)} onCopy={() => newIssue(issue)} />}
      {subscriber && <SubscriberDrawer key={subscriber.id} s={subscriber} onClose={() => setOpen(null)} />}
    </div>
  );
}

function IssueEditor({ issue, subscribed, onClose, onCopy }: { issue: Issue; subscribed: number; onClose: () => void; onCopy: () => void }) {
  const db = useDb();
  const session = useSession();
  const editable = useCan()("newsletter.send") && issue.status === "draft";
  const [subject, setSubject] = useState(issue.subject);
  const [body, setBody] = useState(issue.body);
  const [busy, setBusy] = useState<null | "test" | "all">(null);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const posts = (db?.posts ?? []).filter((p) => p.status === "published");
  const ready = subject.trim().length > 0 && body.trim().length > 0;

  const save = () =>
    update("Newsletter", `Saved the newsletter "${subject.trim() || "Untitled"}"`, (d) => {
      const n = d.newsletters.find((x) => x.id === issue.id)!;
      n.subject = subject.trim();
      n.body = body;
    }, issue.id);

  // A short piece about a blog post, added at the end: its title, summary and a link to read it.
  function addPost(id: string) {
    const p = posts.find((x) => x.id === id);
    if (!p) return;
    const piece = [`## ${p.title}`, p.excerpt, `[Read the post](${siteUrl}/blog/${p.slug})`].filter(Boolean).join("\n\n");
    setBody((b) => (b.trim() ? `${b.trimEnd()}\n\n${piece}` : piece));
    if (!subject.trim()) setSubject(p.title);
  }

  async function send(mode: "test" | "all") {
    if (!ready) return setMessage({ tone: "bad", text: "Add a subject and some text first." });
    if (mode === "all" && !window.confirm(`Send "${subject.trim()}" to ${subscribed} subscriber${subscribed === 1 ? "" : "s"} now? This can't be undone.`)) return;
    save();
    setMessage(null);
    if (!backendEnabled) {
      // Preview: nothing is emailed; the issue is only marked as sent here.
      if (mode === "all")
        update("Newsletter", `Sent "${subject.trim()}" to ${subscribed} subscribers (preview)`, (d) => {
          Object.assign(d.newsletters.find((x) => x.id === issue.id)!, { status: "sent", sentAt: new Date().toISOString(), sentBy: currentUser(), recipients: subscribed });
        }, issue.id);
      return setMessage({ tone: "good", text: "Preview: nothing was emailed. With Supabase and Resend connected, this sends for real." });
    }
    setBusy(mode);
    try {
      const res = await sendNewsletter(issue.id, subject, body, mode);
      if (res.ok) setMessage({ tone: "good", text: mode === "test" ? `Test sent to ${session?.email ?? "you"}.` : `Sent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}.` });
      else setMessage({ tone: "bad", text: res.error });
    } catch {
      setMessage({ tone: "bad", text: "Couldn't reach the server. Check your connection and try again." });
    }
    setBusy(null);
  }

  return (
    <Drawer
      open
      wide
      onClose={() => {
        if (editable && (subject !== issue.subject || body !== issue.body)) save();
        onClose();
      }}
      title={subject.trim() || "New newsletter"}
      subtitle={
        issue.status === "sent" ? (
          <span>
            Sent {issue.sentAt ? fmtDate(issue.sentAt, true) : ""} to {issue.recipients} people{issue.sentBy ? ` by ${issue.sentBy}` : ""}
          </span>
        ) : (
          <span>Draft · goes to {subscribed} subscriber{subscribed === 1 ? "" : "s"}</span>
        )
      }
      footer={
        issue.status === "draft" ? (
          <>
            <ActionButton permission="newsletter.send" onClick={() => void send("all")} disabled={Boolean(busy) || !ready || subscribed === 0}>
              {busy === "all" ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" aria-hidden />} Send to {subscribed}
            </ActionButton>
            <ActionButton permission="newsletter.send" variant="secondary" onClick={() => void send("test")} disabled={Boolean(busy) || !ready}>
              {busy === "test" && <Spinner className="h-4 w-4" />} Send me a test
            </ActionButton>
            <ActionButton permission="newsletter.send" variant="secondary" onClick={save}>
              Save draft
            </ActionButton>
            <ActionButton
              permission="newsletter.send"
              variant="danger"
              className="ml-auto"
              onClick={() => {
                if (!window.confirm("Delete this draft?")) return;
                update("Newsletter", `Deleted the draft "${subject.trim() || "Untitled"}"`, (d) => void (d.newsletters = d.newsletters.filter((n) => n.id !== issue.id)), issue.id);
                onClose();
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Delete
            </ActionButton>
          </>
        ) : (
          <ActionButton permission="newsletter.send" variant="secondary" onClick={onCopy}>
            <Copy className="h-4 w-4" aria-hidden /> Make a copy to send again
          </ActionButton>
        )
      }
    >
      {message && (
        <p role="status" className={`rounded-lg border px-4 py-3 text-sm ${message.tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </p>
      )}
      <DrawerSection title="Email">
        <div className="space-y-4">
          <Labelled label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!editable} placeholder="Wedding season tips from AOD" className={`${fieldClass} text-base font-medium`} />
          </Labelled>
          {editable && posts.length > 0 && (
            <Labelled label="Add a blog post (its title, summary and a link)">
              <select value="" onChange={(e) => addPost(e.target.value)} className={fieldClass}>
                <option value="">Choose a post…</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </Labelled>
          )}
          <MarkdownEditor value={body} onChange={setBody} disabled={!editable} rows={16} label="Text" photos />
          <p className="text-xs text-muted">
            Every email ends with AOD&apos;s name, the website and a one-click Unsubscribe link, added for you. Send yourself a test to see it in your inbox first.
          </p>
        </div>
      </DrawerSection>
    </Drawer>
  );
}

function SubscriberDrawer({ s, onClose }: { s: Subscriber; onClose: () => void }) {
  return (
    <Drawer
      open
      onClose={onClose}
      title={s.email}
      subtitle={<StatusBadge tone={subscriberTone[s.status]}>{subscriberLabel[s.status]}</StatusBadge>}
      footer={
        <>
          {s.status !== "unsubscribed" && (
            <ActionButton
              permission="newsletter.send"
              variant="secondary"
              onClick={() =>
                update("Newsletter", `Unsubscribed ${s.email}`, (d) => {
                  Object.assign(d.subscribers.find((x) => x.id === s.id)!, { status: "unsubscribed", unsubscribedAt: new Date().toISOString() });
                }, s.id)
              }
            >
              Unsubscribe them
            </ActionButton>
          )}
          <ActionButton
            permission="newsletter.send"
            variant="danger"
            className="ml-auto"
            onClick={() => {
              if (!window.confirm(`Remove ${s.email} completely? Use this when someone asks for their data to be deleted.`)) return;
              update("Newsletter", `Removed ${s.email} from the newsletter`, (d) => void (d.subscribers = d.subscribers.filter((x) => x.id !== s.id)), s.id);
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Remove
          </ActionButton>
        </>
      }
    >
      <DrawerSection title="Details">
        <Details
          rows={[
            ["Email", s.email],
            ["Status", subscriberLabel[s.status]],
            ["Signed up on", s.source || "—"],
            ["Signed up", fmtDate(s.createdAt, true)],
            ["Confirmed", s.confirmedAt ? fmtDate(s.confirmedAt, true) : "Not yet"],
            ["Unsubscribed", s.unsubscribedAt ? fmtDate(s.unsubscribedAt, true) : "—"],
          ]}
        />
      </DrawerSection>
      <p className="text-sm text-muted">
        Only the person can subscribe themselves (through the link emailed to them), so there&apos;s no way to add someone here. To remove someone at their request, use Remove.
      </p>
    </Drawer>
  );
}
