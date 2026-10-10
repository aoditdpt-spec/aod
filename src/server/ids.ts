import type { SupabaseClient } from "@supabase/supabase-js";

// Readable references the team already uses: B-1215, APP-205, PAY-3102, AOD-1048 …
// The next one is one more than the highest so far (or `start` for the first). Two saves at the
// same moment can pick the same number; the insert then fails on the primary key and the
// caller tries again with a fresh number (see `insertWithNextId`).
export async function nextNumber(db: SupabaseClient, table: string, column: string, prefix: string, start: number) {
  const { data, error } = await db.from(table).select(column).like(column, `${prefix}-%`);
  if (error) throw new Error(error.message);
  let max = start - 1;
  for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
    const n = Number(String(row[column] ?? "").slice(prefix.length + 1));
    if (Number.isInteger(n) && n > max) max = n;
  }
  return max + 1;
}

// Insert rows that need fresh ids, retrying with new numbers if someone else took them first.
// `build(n)` returns the rows to insert when the first free number is n.
export async function insertWithNextId(
  db: SupabaseClient,
  table: string,
  prefix: string,
  start: number,
  build: (first: number) => Record<string, unknown>[],
) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const first = await nextNumber(db, table, "id", prefix, start);
    const rows = build(first);
    const { error } = await db.from(table).insert(rows);
    if (!error) return rows;
    if (error.code !== "23505") throw new Error(error.message); // 23505 = duplicate key: try the next number
  }
  throw new Error("Couldn't get a free reference number. Please try again.");
}
