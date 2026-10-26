"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Lock, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { download, XLSX_TYPE } from "@/lib/xlsx";
import { fieldClass } from "./ui";

// Every Excel download in the admin is password-protected: the Excel button opens this box, the
// person sets a password (typed twice), and the file downloads as a normal .xlsx that Excel, Google
// Sheets and WPS open only with that password (src/lib/xlsx-encrypt.ts: AES-256, in the browser,
// so the password never leaves this computer). Nobody can recover a forgotten password; exporting
// again makes a new file.

const MIN = 6;

type Pending = { filename: string; build: () => Uint8Array };

// `exportExcel(filename, build)` asks for the password, then builds, locks and downloads the file;
// render `dialog` once in the page.
export function useExcelExport(): { exportExcel: (filename: string, build: () => Uint8Array) => void; dialog: ReactNode } {
  const [pending, setPending] = useState<Pending | null>(null);
  return {
    exportExcel: (filename, build) => setPending({ filename, build }),
    dialog: pending ? <PasswordDialog key={pending.filename} pending={pending} onClose={() => setPending(null)} /> : null,
  };
}

function PasswordDialog({ pending, onClose }: { pending: Pending; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const problem = password.length < MIN ? `Use at least ${MIN} characters.` : password !== again ? "The two passwords don't match." : null;

  async function lockAndDownload() {
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      const { encryptXlsx } = await import("@/lib/xlsx-encrypt");
      const locked = await encryptXlsx(pending.build(), password);
      download(pending.filename, locked, XLSX_TYPE);
      onClose();
    } catch {
      setError("Couldn't lock the file. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" onClick={() => !busy && onClose()} className="absolute inset-0 bg-night/40" />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="excel-lock-title"
        onSubmit={(e) => {
          e.preventDefault();
          void lockAndDownload();
        }}
        className="relative w-full max-w-md rounded-card bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach text-brand">
            <Lock className="h-5 w-5" aria-hidden />
          </span>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-wash hover:text-ink">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <h2 id="excel-lock-title" className="mt-3 text-lg font-bold">
          Choose a password for this file
        </h2>
        <p className="mt-1 text-sm text-muted">
          You&apos;re making a new password now: there isn&apos;t an existing one to know. Type any password you like;{" "}
          <span className="font-medium text-ink">{pending.filename}</span> will then only open with it, in Excel, Google Sheets or WPS.
        </p>

        <label className="mt-5 block text-xs font-medium text-muted">
          New password (at least {MIN} characters)
          <span className="relative mt-1 block">
            <input
              ref={first}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={`${fieldClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
            >
              {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </span>
        </label>
        <label className="mt-3 block text-xs font-medium text-muted">
          Type the same password again
          <input type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" className={`${fieldClass} mt-1`} />
        </label>

        <p className="mt-3 rounded-lg bg-wash px-3 py-2 text-xs text-body">
          You&apos;ll need this password every time you open the file, so keep it safe, and share it separately from the file (not in the same email or chat). It can&apos;t be recovered: if it&apos;s lost, download the list again with a new password.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-ink">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? (
              <>
                <Spinner className="h-4 w-4" /> Locking the file…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden /> Lock and download
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
