"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { buildCsv, buildXlsx, download, XLSX_TYPE, type Cell } from "@/lib/xlsx";
import { fieldBase, fieldClass, useCan } from "./ui";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  value: (row: T) => Cell; // used for sorting, search and export
  className?: string;
  hideOnMobile?: boolean;
};

export type Filter<T> = { label: string; options: { value: string; label: string }[]; test: (row: T, value: string) => boolean };

const PAGE = 15;

// Every list in the admin panel: search, filters, sortable columns, pages, and export of what's
// shown (filters applied) as Excel or CSV.
export function DataTable<T>({
  rows,
  columns,
  getId,
  onOpen,
  filters = [],
  exportName,
  empty = "Nothing here yet.",
  toolbar,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  getId: (row: T) => string;
  onOpen?: (row: T) => void;
  filters?: Filter<T>[];
  exportName: string;
  empty?: string;
  toolbar?: ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const allowed = useCan();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<string[]>(filters.map(() => ""));
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => filters.every((f, i) => !filterValues[i] || f.test(r, filterValues[i])));
    if (q) out = out.filter((r) => columns.some((c) => String(c.value(r) ?? "").toLowerCase().includes(q)));
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        out = [...out].sort((a, b) => {
          const va = col.value(a) ?? "";
          const vb = col.value(b) ?? "";
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "en", { numeric: true });
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, filters, filterValues, query, sort, columns]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const current = Math.min(page, pages - 1);
  const pageRows = shown.slice(current * PAGE, current * PAGE + PAGE);
  const table = () => [columns.map((c) => c.label), ...shown.map((r) => columns.map((c) => c.value(r)))];
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search"
            aria-label="Search this list"
            className={`${fieldClass} pl-9`}
          />
        </div>
        {filters.map((f, i) => (
          <select
            key={f.label}
            aria-label={f.label}
            value={filterValues[i]}
            onChange={(e) => {
              setFilterValues((v) => v.map((x, j) => (j === i ? e.target.value : x)));
              setPage(0);
            }}
            className={`${fieldBase} w-auto`}
          >
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {toolbar}
        {allowed("export") && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => download(`aod-${exportName}-${stamp}.xlsx`, buildXlsx([{ name: exportName, rows: table() }]), XLSX_TYPE)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-ink hover:border-ink"
            >
              <Download className="h-4 w-4" aria-hidden /> Excel
            </button>
            <button
              type="button"
              onClick={() => download(`aod-${exportName}-${stamp}.csv`, buildCsv(table()), "text/csv;charset=utf-8")}
              className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-sm font-medium text-ink hover:border-ink"
            >
              CSV
            </button>
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted">{rows.length === 0 ? empty : "No matches. Try another search or filter."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                {columns.map((c) => {
                  const active = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort?.dir === "asc" ? "ascending" : "descending") : undefined}
                      className={`whitespace-nowrap px-4 py-2.5 font-medium ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => setSort((s) => (s?.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" }))}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        {c.label}
                        {active && (sort?.dir === "asc" ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />)}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr
                  key={getId(r)}
                  onClick={onOpen ? () => onOpen(r) : undefined}
                  className={`border-b border-line/70 last:border-0 ${onOpen ? "cursor-pointer hover:bg-wash/70" : ""}`}
                >
                  {columns.map((c, i) => (
                    <td key={c.key} className={`px-4 py-3 align-middle ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}>
                      {i === 0 && onOpen ? (
                        <button type="button" onClick={(e) => {
                            e.stopPropagation();
                            onOpen(r);
                          }} className="text-left font-medium text-ink hover:text-brand">
                          {c.render(r)}
                        </button>
                      ) : (
                        c.render(r)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-xs text-muted">
        <span>
          {shown.length} of {rows.length}
        </span>
        {pages > 1 && (
          <span className="flex items-center gap-1">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page" className="rounded p-1 hover:bg-wash disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            Page {current + 1} of {pages}
            <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page" className="rounded p-1 hover:bg-wash disabled:opacity-30">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
