"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { newsletter } from "@/content/blog";
import { Spinner } from "@/components/ui/Spinner";
import { confirmSubscription, unsubscribe } from "@/server/actions/newsletter";

// The button on the page a newsletter email's link opens: "Yes, subscribe me" or "Unsubscribe".
// It's a button rather than something that happens when the page opens, because some email
// apps and company mail filters open every link in an email by themselves to check it.
export function NewsletterLinkAction({ mode, token }: { mode: "confirm" | "unsubscribe"; token: string }) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "done" } | { kind: "error"; error: string }>({ kind: "idle" });
  const confirm = mode === "confirm";

  if (!token) return <p className="mt-6 text-body">{newsletter.badLink}</p>;

  if (state.kind === "done") {
    return (
      <div role="status" className="mt-6">
        <p className="flex items-center gap-2 text-lg font-bold text-ink">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden /> {confirm ? newsletter.confirmedTitle : newsletter.unsubscribedTitle}
        </p>
        <p className="mt-2 text-body">{confirm ? newsletter.confirmedText : newsletter.unsubscribedText}</p>
        <Link href="/blog" className="mt-5 inline-block font-medium text-brand hover:underline">
          Read the AOD blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        disabled={state.kind === "busy"}
        onClick={async () => {
          setState({ kind: "busy" });
          try {
            const res = confirm ? await confirmSubscription(token) : await unsubscribe(token);
            setState(res.ok ? { kind: "done" } : { kind: "error", error: res.error });
          } catch {
            setState({ kind: "error", error: "Couldn't reach AOD just now. Please try again." });
          }
        }}
        className={`inline-flex h-12 items-center gap-2 rounded-lg px-6 font-medium transition-colors disabled:cursor-wait ${
          confirm ? "bg-brand text-white hover:bg-brand-hover" : "border-2 border-ink text-ink hover:bg-wash"
        }`}
      >
        {state.kind === "busy" && <Spinner className="h-5 w-5" />}
        {confirm ? newsletter.confirmButton : newsletter.unsubscribeButton}
      </button>
      {state.kind === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
