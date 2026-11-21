"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { download, XLSX_TYPE } from "@/lib/xlsx";
import { btn, btnMain, field, label } from "./ui";

// Every Excel download in the admin is password-protected, as on aod.co.in: the person sets a
// password (typed twice), and the file downloads as a normal .xlsx that Excel, Google Sheets and
// WPS open only with that password (src/lib/xlsx-encrypt.ts, copied from the main site: AES-256,
// in the browser, so the password never leaves this computer). A forgotten password can't be
// recovered; exporting again makes a new file.

const MIN = 6;
type Pending = { filename: string; build: () => Uint8Array };

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
      download(pending.filename, await encryptXlsx(pending.build(), password), XLSX_TYPE);
      onClose();
    } catch {
      setError("Couldn't lock the file. Please try again.");
      setBusy(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4" onClick={() => !busy && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Set a password for this file"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void lockAndDownload();
        }}
        className="w-full max-w-sm rounded-xl bg-paper p-6 text-sm shadow-xl"
      >
        <h2 className="text-xl">Set A Password</h2>
        <p className="mt-2 text-muted">The Excel file opens only with this password. Nobody can recover it if it&apos;s forgotten.</p>
        <label className="mt-5 block">
          <span className={label}>Password</span>
          <input ref={first} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={field} />
        </label>
        <label className="mt-3 block">
          <span className={label}>Type It Again</span>
          <input type={show ? "text" : "password"} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" className={field} />
        </label>
        <label className="mt-3 flex items-center gap-2 text-muted">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show Password
        </label>
        {error && (
          <p role="alert" className="mt-3 text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2 *:flex-1">
          <button type="button" onClick={onClose} disabled={busy} className={btn}>
            Cancel
          </button>
          <button disabled={busy} className={btnMain}>
            {busy ? "Locking…" : "Download"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
