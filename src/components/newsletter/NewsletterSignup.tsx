"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { newsletter } from "@/content/blog";
import { Spinner } from "@/components/ui/Spinner";
import { backendEnabled } from "@/lib/backend";
import { subscribe } from "@/server/actions/newsletter";

// The newsletter sign-up: an email box and a button, in the footer (`dark`) and on the blog
// (`light`). It saves a "pending" sign-up and the server emails a confirmation link
// (src/server/actions/newsletter.ts); it says "check your inbox" whatever the address, so it never
// reveals who is already subscribed. Preview (no keys): it says nothing was saved.
export function NewsletterSignup({ variant = "light", heading = true }: { variant?: "light" | "dark"; heading?: boolean }) {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // spam trap: hidden, only bots fill it in
  const [state, setState] = useState<{ kind: "idle" | "sending" | "done" | "preview" } | { kind: "error"; error: string }>({ kind: "idle" });
  const dark = variant === "dark";
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  async function submit() {
    if (!valid || state.kind === "sending") return;
    if (!backendEnabled) return setState({ kind: "preview" });
    setState({ kind: "sending" });
    try {
      const res = await subscribe({ email, source: pathname, website });
      setState(res.ok ? { kind: "done" } : { kind: "error", error: res.error });
    } catch {
      setState({ kind: "error", error: "Couldn't reach AOD just now. Please try again." });
    }
  }

  if (state.kind === "done") {
    return (
      <p role="status" className={`flex items-start gap-2 text-sm ${dark ? "text-white" : "text-ink"}`}>
        <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${dark ? "text-apricot" : "text-emerald-600"}`} aria-hidden /> {newsletter.done}
      </p>
    );
  }

  return (
    <div>
      {heading && (
        <>
          <p className={`flex items-center gap-2 font-display text-lg font-bold ${dark ? "text-white" : "text-ink"}`}>
            <Mail className={`h-5 w-5 ${dark ? "text-apricot" : "text-brand"}`} aria-hidden /> {newsletter.title}
          </p>
          <p className={`mt-1 text-sm ${dark ? "text-white/70" : "text-body"}`}>{newsletter.text}</p>
        </>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-4 flex flex-col gap-2.5 sm:flex-row"
      >
        <label className="sr-only" htmlFor={`newsletter-${variant}`}>
          Email address
        </label>
        <input
          id={`newsletter-${variant}`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={newsletter.placeholder}
          // `sm:flex-1`, not `flex-1`: in the stacked phone layout flex-1 let the box shrink to a sliver.
          className={`h-14 w-full min-w-0 rounded-xl border px-5 text-base outline-none transition-colors sm:flex-1 ${
            dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/40 focus:border-apricot" : "border-line bg-white text-ink placeholder:text-muted/60 focus:border-brand"
          }`}
        />
        {/* Spam trap: not displayed at all, so people and browser autofill never reach it. */}
        <input value={website} onChange={(e) => setWebsite(e.target.value)} name="aod_trap" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={!valid || state.kind === "sending"}
          className="press inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-7 text-base font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === "sending" ? (
            <>
              <Spinner className="h-4 w-4" /> {newsletter.sending}
            </>
          ) : (
            newsletter.button
          )}
        </button>
      </form>
      <p className={`mt-2.5 text-xs ${dark ? "text-white/50" : "text-muted"}`} role={state.kind === "error" || state.kind === "preview" ? "alert" : undefined}>
        {state.kind === "error" ? state.error : state.kind === "preview" ? newsletter.preview : newsletter.consent}
      </p>
    </div>
  );
}
