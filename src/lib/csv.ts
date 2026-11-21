import { catName, stageLabel, type Db } from "@/lib/app-db";

// CSV downloads for the admin (they open in Excel and Google Sheets). Made in the browser.

const cell = (v: unknown) => {
  const s = String(v ?? "");
  // Quotes around anything with a comma, quote or new line; a leading = + - @ is kept as text.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(rows: unknown[][]) {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export function downloadCsv(name: string, csv: string) {
  // The byte-order mark makes Excel read ₹ and other symbols correctly.
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function bookingRows(db: Db): (string | number)[][] {
  const name = (id: string) => db.artists.find((a) => a.id === id)?.name ?? id;
  return [
    ["Order", "Customer", "Phone", "Email", "Categories", "Who They Need", "Occasion", "Date", "Start", "End", "Venue", "City", "Status", "Quote", "Artists", "Source", "Notes", "Brief"],
    ...db.bookings.map((b) => [b.id, b.customer, b.phone, b.email, b.cats.map(catName).join(", "), b.needs, b.occasion ?? "", b.date, b.start, b.end, b.venue ?? "", b.city, stageLabel(b.stage), b.quote ?? "", b.assigned.map(name).join(", "), b.source, b.notes, b.brief ?? ""]),
  ];
}

export const bookingsCsv = (db: Db) => toCsv(bookingRows(db));
